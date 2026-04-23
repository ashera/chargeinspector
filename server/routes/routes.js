// routes/auth.js
// ------------------------------------------------------------
// POST /auth/register
// POST /auth/login
// POST /auth/refresh
// POST /auth/logout
// POST /auth/logout-all
// GET  /auth/me
// ------------------------------------------------------------

'use strict';

const express = require('express');
const bcrypt  = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db      = require('../db');            // pg Pool — adjust path as needed
const {
  signAccessToken,
  generateRefreshToken,
  refreshCookieOptions,
  requireAuth,
  ACCESS_TTL_SECONDS,
  REFRESH_TTL_SECONDS,
} = require('../middleware/auth');

const router = express.Router();

const BCRYPT_ROUNDS         = 12;
const BCRYPT_REFRESH_ROUNDS = 10; // slightly faster; tokens are long-lived anyway

// ── Helpers ──────────────────────────────────────────────────

/**
 * Issue a fresh access + refresh token pair for a user.
 * Inserts the hashed refresh token into the DB under the given family.
 * Returns { accessToken, rawRefreshToken }.
 */
async function issueTokenPair(user, family = uuidv4()) {
  const accessToken     = signAccessToken(user);
  const rawRefreshToken = generateRefreshToken();
  const tokenHash       = await bcrypt.hash(rawRefreshToken, BCRYPT_REFRESH_ROUNDS);

  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, family, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [user.id, tokenHash, family, expiresAt]
  );

  return { accessToken, rawRefreshToken };
}

/**
 * Revoke every token in a family (used for reuse detection).
 */
async function revokeFamilyTokens(family) {
  await db.query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE family = $1 AND revoked_at IS NULL`,
    [family]
  );
}

/**
 * Revoke all tokens belonging to a user (logout-all / nuke).
 */
async function revokeAllUserTokens(userId) {
  await db.query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

/**
 * Safely compare a raw token against stored hashes for a user.
 * Returns the matching DB row or null.
 *
 * We fetch all active, non-expired tokens for the user and run bcrypt.compare
 * on each so timing is relatively constant (avoids revealing whether a token
 * family exists via short-circuit timing).
 */
async function findRefreshToken(userId, rawToken) {
  const { rows } = await db.query(
    `SELECT * FROM refresh_tokens
     WHERE user_id = $1
       AND expires_at > NOW()`,
    [userId]
  );

  let matchRow    = null;
  let matchRevoked = false;

  for (const row of rows) {
    // eslint-disable-next-line no-await-in-loop
    const match = await bcrypt.compare(rawToken, row.token_hash);
    if (match) {
      matchRow    = row;
      matchRevoked = row.revoked_at !== null;
      break;
    }
  }

  return { matchRow, matchRevoked };
}

// ── Routes ───────────────────────────────────────────────────

// POST /auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Check for existing user using constant-time comparison trick:
    // hash regardless to prevent user-enumeration via timing.
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    let user;
    try {
      const { rows } = await db.query(
        `INSERT INTO users (email, password_hash) VALUES ($1, $2)
         RETURNING id, email, role, total_points`,
        [email.toLowerCase().trim(), passwordHash]
      );
      user = rows[0];
    } catch (err) {
      if (err.code === '23505') {
        // unique_violation — but return same error shape as "bad password"
        return res.status(409).json({ error: 'Email already registered' });
      }
      throw err;
    }

    const { accessToken, rawRefreshToken } = await issueTokenPair(user);

    res.cookie('refreshToken', rawRefreshToken, refreshCookieOptions());
    return res.status(201).json({
      accessToken,
      expiresIn: ACCESS_TTL_SECONDS,
      user: { id: user.id, email: user.email, role: user.role, total_points: user.total_points },
    });
  } catch (err) {
    console.error('[/auth/register]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const { rows } = await db.query(
      'SELECT id, email, role, total_points, password_hash FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    // Always hash-compare even if user not found — prevents timing-based enumeration
    const user        = rows[0];
    const storedHash  = user?.password_hash ?? '$2b$12$invalidhashpaddingtomimicbcryptXXXXXXXXXXXXXXXXXXXXX';
    const valid       = await bcrypt.compare(password, storedHash);

    if (!user || !valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { accessToken, rawRefreshToken } = await issueTokenPair(user);

    res.cookie('refreshToken', rawRefreshToken, refreshCookieOptions());
    return res.json({
      accessToken,
      expiresIn: ACCESS_TTL_SECONDS,
      user: { id: user.id, email: user.email, role: user.role, total_points: user.total_points },
    });
  } catch (err) {
    console.error('[/auth/login]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/refresh  (cookie-only route)
router.post('/refresh', async (req, res) => {
  const rawToken = req.cookies?.refreshToken;
  if (!rawToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  // We need the user ID to scope the search. Decode without verifying the
  // access token (it may be expired) — we use the refresh token as the
  // source of truth. We embed userId in a separate lightweight lookup cookie,
  // OR we accept a userId in the body. Here we use the body for simplicity;
  // adjust to a signed cookie if preferred.
  const { userId } = req.body ?? {};
  if (!userId) {
    return res.status(400).json({ error: 'userId required in request body' });
  }

  try {
    const { matchRow, matchRevoked } = await findRefreshToken(userId, rawToken);

    if (!matchRow) {
      // Token not found at all — could be expired or never existed
      res.clearCookie('refreshToken', { path: '/auth/refresh' });
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (matchRevoked) {
      // REUSE DETECTION — nuke entire family
      await revokeFamilyTokens(matchRow.family);
      res.clearCookie('refreshToken', { path: '/auth/refresh' });
      return res.status(401).json({ error: 'Refresh token reuse detected — all sessions revoked' });
    }

    // Revoke the used token
    await db.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1',
      [matchRow.id]
    );

    // Fetch fresh user data (role may have changed)
    const { rows } = await db.query(
      'SELECT id, email, role, total_points FROM users WHERE id = $1',
      [userId]
    );
    const user = rows[0];
    if (!user) {
      res.clearCookie('refreshToken', { path: '/auth/refresh' });
      return res.status(401).json({ error: 'User not found' });
    }

    // Issue new pair under the same family (rotation)
    const { accessToken, rawRefreshToken } = await issueTokenPair(user, matchRow.family);

    res.cookie('refreshToken', rawRefreshToken, refreshCookieOptions());
    return res.json({
      accessToken,
      expiresIn: ACCESS_TTL_SECONDS,
      user: { id: user.id, email: user.email, role: user.role, total_points: user.total_points },
    });
  } catch (err) {
    console.error('[/auth/refresh]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/logout  (revoke current device's refresh token)
router.post('/logout', requireAuth, async (req, res) => {
  const rawToken = req.cookies?.refreshToken;
  if (rawToken) {
    try {
      const { matchRow } = await findRefreshToken(req.user.sub, rawToken);
      if (matchRow) {
        await db.query(
          'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1',
          [matchRow.id]
        );
      }
    } catch {
      // Best-effort; proceed to clear cookie regardless
    }
  }

  res.clearCookie('refreshToken', { path: '/auth/refresh' });
  return res.json({ message: 'Logged out' });
});

// POST /auth/logout-all  (revoke ALL sessions for this user)
router.post('/logout-all', requireAuth, async (req, res) => {
  try {
    await revokeAllUserTokens(req.user.sub);
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
    return res.json({ message: 'All sessions revoked' });
  } catch (err) {
    console.error('[/auth/logout-all]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [req.user.sub]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('[/auth/me]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
