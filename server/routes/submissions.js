'use strict';

const express    = require('express');
const db         = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const router     = express.Router();

const POINTS_SUBMISSION_APPROVED = 10;
const POINTS_UPVOTE_RECEIVED     = 1;

// ── Helpers ──────────────────────────────────────────────────

async function awardPoints(client, userId, amount, reason, referenceId) {
  await client.query(
    `INSERT INTO points_log (user_id, amount, reason, reference_id)
     VALUES ($1, $2, $3, $4)`,
    [userId, amount, reason, referenceId]
  );
  await client.query(
    `UPDATE users SET total_points = total_points + $1 WHERE id = $2`,
    [amount, userId]
  );
  await checkAndAwardBadges(client, userId);
}

async function checkAndAwardBadges(client, userId) {
  const { rows: [user] } = await client.query(
    'SELECT total_points FROM users WHERE id = $1',
    [userId]
  );
  const { rows: eligible } = await client.query(
    `SELECT b.id FROM badges b
     WHERE b.points_threshold <= $1
       AND NOT EXISTS (
         SELECT 1 FROM user_badges ub
         WHERE ub.user_id = $2 AND ub.badge_id = b.id
       )`,
    [user.total_points, userId]
  );
  for (const badge of eligible) {
    await client.query(
      `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, badge.id]
    );
  }
}

// ── Routes ───────────────────────────────────────────────────

// POST /api/submissions
// Body: { descriptor, merchantName, merchantLocation, website, logoUrl }
router.post('/', requireAuth, async (req, res) => {
  const { descriptor, merchantName, merchantLocation, website, logoUrl } = req.body ?? {};

  if (!descriptor?.trim())    return res.status(400).json({ error: 'descriptor is required' });
  if (!merchantName?.trim())  return res.status(400).json({ error: 'merchantName is required' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Check for existing descriptor
    const { rows: existing } = await client.query(
      `SELECT d.id, d.text, d.canonical_submission_id,
              s.id AS submission_id, m.name, m.location, m.website, m.logo_url
       FROM descriptors d
       LEFT JOIN submissions s ON s.id = d.canonical_submission_id
       LEFT JOIN merchants   m ON m.id = s.merchant_id
       WHERE d.text ILIKE $1`,
      [descriptor.trim()]
    );

    if (existing.length > 0) {
      // Check all submissions for this descriptor (not just canonical) for an exact merchant match
      const { rows: exact } = await client.query(
        `SELECT 1 FROM submissions s
         JOIN descriptors d ON d.id = s.descriptor_id
         JOIN merchants   m ON m.id = s.merchant_id
         WHERE d.text ILIKE $1
           AND lower(m.name) = lower($2)
           AND lower(COALESCE(m.location, '')) = lower(COALESCE($3, ''))
         LIMIT 1`,
        [descriptor.trim(), merchantName.trim(), merchantLocation?.trim() || null]
      );

      await client.query('ROLLBACK');

      if (exact.length > 0) {
        return res.status(200).json({ duplicate: true });
      }

      return res.status(409).json({
        conflict: true,
        existing: existing[0],
        message: 'A submission already exists for this descriptor.',
      });
    }

    // Insert merchant or reuse existing — never update an existing record
    const { rows: [merchant] } = await client.query(
      `WITH ins AS (
         INSERT INTO merchants (name, location, website, logo_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (lower(name), lower(COALESCE(location, ''))) DO NOTHING
         RETURNING id
       )
       SELECT id FROM ins
       UNION ALL
       SELECT id FROM merchants
       WHERE lower(name) = lower($1)
         AND lower(COALESCE(location, '')) = lower(COALESCE($2, ''))
       LIMIT 1`,
      [merchantName.trim(), merchantLocation?.trim() || null, website?.trim() || null, logoUrl?.trim() || null]
    );

    // Create descriptor
    const { rows: [desc] } = await client.query(
      `INSERT INTO descriptors (text) VALUES ($1) RETURNING id`,
      [descriptor.trim().toUpperCase()]
    );

    // Create submission
    const { rows: [submission] } = await client.query(
      `INSERT INTO submissions (descriptor_id, merchant_id, submitted_by)
       VALUES ($1, $2, $3) RETURNING id`,
      [desc.id, merchant.id, req.user.sub]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Submission received and pending review.',
      submissionId: submission.id,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[POST /api/submissions]', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/submissions/case-solve
// Creates an auto-approved submission from a case investigation.
// Awards points immediately — no admin review step.
router.post('/case-solve', requireAuth, async (req, res) => {
  const { descriptor, merchantName, merchantLocation, website, logoUrl } = req.body ?? {};

  if (!descriptor?.trim())   return res.status(400).json({ error: 'descriptor is required' });
  if (!merchantName?.trim()) return res.status(400).json({ error: 'merchantName is required' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Upsert merchant
    const { rows: [merchant] } = await client.query(
      `WITH ins AS (
         INSERT INTO merchants (name, location, website, logo_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (lower(name), lower(COALESCE(location, ''))) DO NOTHING
         RETURNING id
       )
       SELECT id FROM ins
       UNION ALL
       SELECT id FROM merchants
       WHERE lower(name) = lower($1)
         AND lower(COALESCE(location, '')) = lower(COALESCE($2, ''))
       LIMIT 1`,
      [merchantName.trim(), merchantLocation?.trim() || null, website?.trim() || null, logoUrl?.trim() || null]
    );

    // Upsert descriptor
    let { rows: [desc] } = await client.query(
      'SELECT id FROM descriptors WHERE text ILIKE $1',
      [descriptor.trim()]
    );
    if (!desc) {
      const result = await client.query(
        'INSERT INTO descriptors (text) VALUES ($1) RETURNING id',
        [descriptor.trim().toUpperCase()]
      );
      desc = result.rows[0];
    }

    // Skip if exact duplicate already exists
    const { rows: exact } = await client.query(
      `SELECT id FROM submissions WHERE descriptor_id = $1 AND merchant_id = $2 LIMIT 1`,
      [desc.id, merchant.id]
    );
    if (exact.length > 0) {
      await client.query('ROLLBACK');
      return res.status(200).json({ duplicate: true });
    }

    // Create as pending — goes through normal moderation
    const { rows: [submission] } = await client.query(
      `INSERT INTO submissions (descriptor_id, merchant_id, submitted_by)
       VALUES ($1, $2, $3) RETURNING id`,
      [desc.id, merchant.id, req.user.sub]
    );

    await client.query('COMMIT');
    return res.status(201).json({ message: 'Submission received and pending review.', submissionId: submission.id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[POST /api/submissions/case-solve]', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/submissions  (conflict confirmed — force new submission)
// Body: { descriptor, merchantName, merchantLocation, website, logoUrl, forceNew: true }
router.post('/conflict', requireAuth, async (req, res) => {
  const { descriptor, merchantName, merchantLocation, website, logoUrl } = req.body ?? {};

  if (!descriptor?.trim())   return res.status(400).json({ error: 'descriptor is required' });
  if (!merchantName?.trim()) return res.status(400).json({ error: 'merchantName is required' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    let { rows: [desc] } = await client.query(
      'SELECT id FROM descriptors WHERE text ILIKE $1',
      [descriptor.trim()]
    );

    if (!desc) {
      const result = await client.query(
        `INSERT INTO descriptors (text) VALUES ($1) RETURNING id`,
        [descriptor.trim().toUpperCase()]
      );
      desc = result.rows[0];
    }

    const { rows: [merchant] } = await client.query(
      `WITH ins AS (
         INSERT INTO merchants (name, location, website, logo_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (lower(name), lower(COALESCE(location, ''))) DO NOTHING
         RETURNING id
       )
       SELECT id FROM ins
       UNION ALL
       SELECT id FROM merchants
       WHERE lower(name) = lower($1)
         AND lower(COALESCE(location, '')) = lower(COALESCE($2, ''))
       LIMIT 1`,
      [merchantName.trim(), merchantLocation?.trim() || null, website?.trim() || null, logoUrl?.trim() || null]
    );

    const { rows: [submission] } = await client.query(
      `INSERT INTO submissions (descriptor_id, merchant_id, submitted_by)
       VALUES ($1, $2, $3) RETURNING id`,
      [desc.id, merchant.id, req.user.sub]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Conflict submission received and pending review.',
      submissionId: submission.id,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[POST /api/submissions/conflict]', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/submissions/:id/vote
router.post('/:id/vote', requireAuth, async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { rows: [submission] } = await client.query(
      'SELECT id, submitted_by, status FROM submissions WHERE id = $1',
      [req.params.id]
    );
    if (!submission)              return res.status(404).json({ error: 'Submission not found' });
    if (submission.status !== 'approved') return res.status(400).json({ error: 'Can only vote on approved submissions' });
    if (submission.submitted_by === req.user.sub) return res.status(400).json({ error: 'Cannot vote on your own submission' });

    try {
      await client.query(
        'INSERT INTO votes (submission_id, user_id) VALUES ($1, $2)',
        [req.params.id, req.user.sub]
      );
    } catch (err) {
      if (err.code === '23505') {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Already voted on this submission' });
      }
      throw err;
    }

    await client.query(
      'UPDATE submissions SET upvote_count = upvote_count + 1 WHERE id = $1',
      [req.params.id]
    );

    await awardPoints(client, submission.submitted_by, POINTS_UPVOTE_RECEIVED, 'upvote_received', submission.id);

    await client.query('COMMIT');
    return res.json({ message: 'Vote recorded' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[POST /api/submissions/:id/vote]', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/submissions/contributor-of-the-day  (public)
router.get('/contributor-of-the-day', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.email, COUNT(s.id)::int AS submission_count
       FROM submissions s
       JOIN users u ON u.id = s.submitted_by
       WHERE s.created_at > NOW() - INTERVAL '24 hours'
       GROUP BY u.id, u.email
       ORDER BY submission_count DESC
       LIMIT 1`
    );
    if (!rows.length) return res.json({ contributor: null });
    const { email, submission_count } = rows[0];
    return res.json({ contributor: { username: email.split('@')[0], submission_count } });
  } catch (err) {
    console.error('[GET /api/submissions/contributor-of-the-day]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/submissions/pending  (admin)
router.get('/pending', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         s.id, s.created_at, s.upvote_count,
         d.text  AS descriptor,
         m.name, m.location, m.website, m.logo_url,
         u.email AS submitted_by_email
       FROM submissions s
       JOIN descriptors d ON d.id = s.descriptor_id
       JOIN merchants   m ON m.id = s.merchant_id
       JOIN users       u ON u.id = s.submitted_by
       WHERE s.status = 'pending'
       ORDER BY s.created_at ASC`
    );
    return res.json({ submissions: rows });
  } catch (err) {
    console.error('[GET /api/submissions/pending]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/submissions/:id/approve  (admin)
router.put('/:id/approve', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { rows: [submission] } = await client.query(
      'SELECT id, descriptor_id, submitted_by, status FROM submissions WHERE id = $1',
      [req.params.id]
    );
    if (!submission)                  return res.status(404).json({ error: 'Submission not found' });
    if (submission.status !== 'pending') return res.status(400).json({ error: 'Submission is not pending' });

    await client.query(
      `UPDATE submissions SET status = 'approved' WHERE id = $1`,
      [req.params.id]
    );

    // Set as canonical if none exists yet
    await client.query(
      `UPDATE descriptors
       SET canonical_submission_id = $1
       WHERE id = $2 AND canonical_submission_id IS NULL`,
      [submission.id, submission.descriptor_id]
    );

    await awardPoints(client, submission.submitted_by, POINTS_SUBMISSION_APPROVED, 'submission_approved', submission.id);

    await client.query('COMMIT');
    return res.json({ message: 'Submission approved' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[PUT /api/submissions/:id/approve]', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PUT /api/submissions/:id/reject  (admin)
router.put('/:id/reject', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { rows: [submission] } = await client.query(
      `UPDATE submissions SET status = 'rejected' WHERE id = $1 AND status = 'pending'
       RETURNING id, merchant_id`,
      [req.params.id]
    );
    if (!submission) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pending submission not found' });
    }

    // Delete the merchant if no other submissions reference it
    await client.query(
      `DELETE FROM merchants WHERE id = $1
       AND NOT EXISTS (
         SELECT 1 FROM submissions WHERE merchant_id = $1 AND id <> $2
       )`,
      [submission.merchant_id, submission.id]
    );

    await client.query('COMMIT');
    return res.json({ message: 'Submission rejected' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[PUT /api/submissions/:id/reject]', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
