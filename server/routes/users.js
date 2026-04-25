'use strict';

const express = require('express');
const db      = require('../db');
const { requireAuth } = require('../middleware/auth');
const router  = express.Router();

// GET /api/users/me/stats
router.get('/me/stats', requireAuth, async (req, res) => {
  try {
    const { rows: [user] } = await db.query(
      `SELECT id, email, role, total_points, first_name, last_name, avatar_url, created_at FROM users WHERE id = $1`,
      [req.user.sub]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { rows: badges } = await db.query(
      `SELECT b.name, b.description, b.icon, ub.awarded_at
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = $1
       ORDER BY ub.awarded_at DESC`,
      [req.user.sub]
    );

    const { rows: submissions } = await db.query(
      `SELECT s.id, s.status, s.upvote_count, s.created_at,
              d.text AS descriptor,
              m.name AS merchant_name
       FROM submissions s
       JOIN descriptors d ON d.id = s.descriptor_id
       JOIN merchants   m ON m.id = s.merchant_id
       WHERE s.submitted_by = $1
       ORDER BY s.created_at DESC
       LIMIT 20`,
      [req.user.sub]
    );

    return res.json({ user, badges, submissions });
  } catch (err) {
    console.error('[GET /api/users/me/stats]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/me/points
router.get('/me/points', requireAuth, async (req, res) => {
  try {
    const [{ rows: points }, { rows: badges }] = await Promise.all([
      db.query(
        `SELECT
           pl.id, pl.amount, pl.reason, pl.created_at,
           d.text  AS descriptor,
           m.name  AS merchant_name
         FROM points_log pl
         JOIN submissions s ON s.id = pl.reference_id
         JOIN descriptors d ON d.id = s.descriptor_id
         JOIN merchants   m ON m.id = s.merchant_id
         WHERE pl.user_id = $1
         ORDER BY pl.created_at DESC`,
        [req.user.sub]
      ),
      db.query(
        `SELECT b.name, b.description, b.icon, b.points_threshold, ub.awarded_at
         FROM user_badges ub
         JOIN badges b ON b.id = ub.badge_id
         WHERE ub.user_id = $1
         ORDER BY ub.awarded_at DESC
         LIMIT 1`,
        [req.user.sub]
      ),
    ]);
    return res.json({ points, latestBadge: badges[0] ?? null });
  } catch (err) {
    console.error('[GET /api/users/me/points]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.email, u.total_points,
              COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'approved') AS approved_submissions,
              COALESCE(
                (SELECT b.icon || ' ' || b.name
                 FROM user_badges ub
                 JOIN badges b ON b.id = ub.badge_id
                 WHERE ub.user_id = u.id
                 ORDER BY b.points_threshold DESC
                 LIMIT 1),
                ''
              ) AS top_badge
       FROM users u
       LEFT JOIN submissions s ON s.submitted_by = u.id
       WHERE u.total_points > 0
       GROUP BY u.id
       ORDER BY u.total_points DESC
       LIMIT 50`
    );
    return res.json({ leaderboard: rows });
  } catch (err) {
    console.error('[GET /api/users/leaderboard]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/me
router.put('/me', requireAuth, async (req, res) => {
  const { first_name, last_name, avatar_url } = req.body;
  try {
    const { rows: [user] } = await db.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, avatar_url = $3
       WHERE id = $4
       RETURNING id, email, role, total_points, first_name, last_name, avatar_url`,
      [first_name?.trim() || null, last_name?.trim() || null, avatar_url?.trim() || null, req.user.sub]
    );
    return res.json({ user });
  } catch (err) {
    console.error('[PUT /api/users/me]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
