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
         s.upvote_count
       FROM descriptors d
       JOIN submissions  s ON s.id = d.canonical_submission_id
       JOIN merchants    m ON m.id = s.merchant_id
       WHERE d.text ILIKE $1
       ORDER BY
         CASE WHEN lower(d.text) LIKE lower($2) THEN 0 ELSE 1 END,
         d.text
       LIMIT 20`,
      [`%${q}%`, `${q}%`]
    );

    return res.json({ results: rows });
  } catch (err) {
    console.error('[GET /api/search]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/search/descriptor?q=<exact descriptor text>
// Returns all approved submissions for a specific descriptor
router.get('/descriptor', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ descriptor: null, submissions: [] });

  try {
    const { rows } = await db.query(
      `SELECT
         d.id   AS descriptor_id,
         d.text AS descriptor,
         m.id   AS merchant_id,
         m.name, m.location, m.website, m.logo_url,
         s.id   AS submission_id,
         s.upvote_count,
         s.created_at
       FROM submissions s
       JOIN descriptors d ON d.id = s.descriptor_id
       JOIN merchants   m ON m.id = s.merchant_id
       WHERE d.text = $1
         AND s.status = 'approved'
       ORDER BY s.upvote_count DESC`,
      [q]
    );
    return res.json({ descriptor: q, submissions: rows });
  } catch (err) {
    console.error('[GET /api/search/descriptor]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/search/autocomplete?q=<partial>
router.get('/autocomplete', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ results: [] });

  try {
    const { rows } = await db.query(
      `SELECT d.text AS descriptor, m.name AS merchant_name
       FROM descriptors d
       JOIN submissions s ON s.id = d.canonical_submission_id
       JOIN merchants   m ON m.id = s.merchant_id
       WHERE d.text ILIKE $1
       ORDER BY
         CASE WHEN lower(d.text) LIKE lower($2) THEN 0 ELSE 1 END,
         d.text
       LIMIT 8`,
      [`%${q}%`, `${q}%`]
    );
    return res.json({ results: rows });
  } catch (err) {
    console.error('[GET /api/search/autocomplete]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
