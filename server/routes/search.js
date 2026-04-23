'use strict';

const express = require('express');
const db      = require('../db');
const router  = express.Router();

// GET /api/search?q=<descriptor text>
router.get('/', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ results: [] });

  try {
    const { rows } = await db.query(
      `SELECT
         d.id              AS descriptor_id,
         d.text            AS descriptor,
         m.id              AS merchant_id,
         m.name,
         m.location,
         m.website,
         m.logo_url,
         s.id              AS submission_id,
         s.upvote_count,
         similarity(d.text, $1) AS score
       FROM descriptors d
       JOIN submissions  s ON s.id = d.canonical_submission_id
       JOIN merchants    m ON m.id = s.merchant_id
       WHERE d.text % $1
          OR d.text ILIKE $2
       ORDER BY score DESC
       LIMIT 20`,
      [q, `%${q}%`]
    );

    return res.json({ results: rows });
  } catch (err) {
    console.error('[GET /api/search]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
