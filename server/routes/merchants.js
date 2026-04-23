'use strict';

const express = require('express');
const db      = require('../db');
const router  = express.Router();

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
      `SELECT d.text AS descriptor, s.upvote_count, s.created_at
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
