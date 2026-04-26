'use strict';

const express = require('express');
const db      = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const router  = express.Router();

// GET /api/merchants  — list all merchants (admin/moderator)
router.get('/', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const q = (req.query.q || '').trim();

  const params = [];
  const where  = q ? (params.push(`%${q}%`), `lower(m.name) LIKE lower($1)`) : '1=1';

  try {
    const { rows } = await db.query(
      `SELECT m.id, m.name, m.location, m.website, m.logo_url,
              COUNT(s.id)::int                                                        AS submission_count,
              COUNT(s.id) FILTER (WHERE s.status = 'approved')::int                  AS approved_count,
              COUNT(s.id) FILTER (WHERE s.status = 'pending')::int                   AS pending_count
       FROM merchants m
       LEFT JOIN submissions s ON s.merchant_id = m.id
       WHERE ${where}
       GROUP BY m.id
       ORDER BY m.name ASC
       LIMIT 500`,
      params
    );
    return res.json({ merchants: rows });
  } catch (err) {
    console.error('[GET /api/merchants]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/merchants/autocomplete?q=<partial name>
router.get('/autocomplete', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ results: [] });

  try {
    const { rows } = await db.query(
      `SELECT id, name, location, website, logo_url
       FROM merchants
       WHERE lower(name) LIKE lower($1)
       ORDER BY
         CASE WHEN lower(name) LIKE lower($2) THEN 0 ELSE 1 END,
         name
       LIMIT 8`,
      [`%${q}%`, `${q}%`]
    );
    return res.json({ results: rows });
  } catch (err) {
    console.error('[GET /api/merchants/autocomplete]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/merchants/:id/descriptors
router.get('/:id/descriptors', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT d.id AS descriptor_id, d.text AS descriptor, s.upvote_count, s.created_at
       FROM submissions s
       JOIN descriptors d ON d.id = s.descriptor_id
       WHERE s.merchant_id = $1
         AND s.status = 'approved'
       ORDER BY d.text ASC`,
      [req.params.id]
    );
    return res.json({ descriptors: rows });
  } catch (err) {
    console.error('[GET /api/merchants/:id/descriptors]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
