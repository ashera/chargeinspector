// middleware/auth.js
// ------------------------------------------------------------
// Token signing helpers + Express middleware
// ------------------------------------------------------------

'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set');
}

const ACCESS_TTL_SECONDS  = 15 * 60;        // 15 minutes
const REFRESH_TTL_SECONDS = 30 * 24 * 3600; // 30 days

// ── Token helpers ────────────────────────────────────────────

/**
 * Sign a short-lived access JWT.
 * Payload: { sub, email, role }
 */
function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL_SECONDS, algorithm: 'HS256' }
  );
}

/**
 * Verify an access JWT. Returns decoded payload or throws.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET, { algorithms: ['HS256'] });
}

/**
 * Generate a cryptographically secure opaque refresh token string.
 * The caller is responsible for hashing before storing.
 */
function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Cookie options for the refresh token.
 */
function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/auth/refresh',
    maxAge: REFRESH_TTL_SECONDS * 1000,
  };
}

// ── Middleware ───────────────────────────────────────────────

/**
 * Extract Bearer token from Authorization header.
 * Returns the token string or null.
 */
function extractBearer(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

/**
 * requireAuth — blocks unauthenticated requests with 401.
 * Attaches decoded payload to req.user on success.
 */
function requireAuth(req, res, next) {
  const token = extractBearer(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token';
    return res.status(401).json({ error: message });
  }
}

/**
 * optionalAuth — same as requireAuth but never blocks the request.
 * req.user is set if a valid token is present, otherwise undefined.
 */
function optionalAuth(req, res, next) {
  const token = extractBearer(req);
  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // Invalid/expired — treat as unauthenticated
    }
  }
  return next();
}

/**
 * requireRole(...roles) — returns middleware that enforces role membership.
 * Must be used AFTER requireAuth.
 *
 * Usage:
 *   router.delete('/posts/:id', requireAuth, requireRole('admin'), handler);
 *   router.post('/flag',        requireAuth, requireRole('admin', 'moderator'), handler);
 */
function requireRole(...roles) {
  return function roleMiddleware(req, res, next) {
    if (!req.user) {
      // Should never happen if requireAuth precedes this, but guard anyway
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden — required role: ${roles.join(' or ')}`,
      });
    }
    return next();
  };
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  refreshCookieOptions,
  requireAuth,
  optionalAuth,
  requireRole,
  ACCESS_TTL_SECONDS,
  REFRESH_TTL_SECONDS,
};
