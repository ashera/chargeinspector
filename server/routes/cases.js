'use strict';

const express = require('express');
const db      = require('../db');
const { optionalAuth } = require('../middleware/auth');
const router  = express.Router();

const COMPUTED_STATUS =
  `CASE
    WHEN EXISTS (
      SELECT 1 FROM submissions s
      JOIN descriptors d ON d.id = s.descriptor_id
      WHERE lower(d.text) = lower(c.descriptor) AND s.status = 'approved'
    ) THEN 'solved'
    WHEN EXISTS (
      SELECT 1 FROM submissions s
      JOIN descriptors d ON d.id = s.descriptor_id
      WHERE lower(d.text) = lower(c.descriptor)
    ) THEN 'investigating'
    ELSE 'open'
  END`;

// POST /api/cases  — get-or-create a case for a descriptor
router.post('/', optionalAuth, async (req, res) => {
  const { descriptor } = req.body ?? {};
  if (!descriptor?.trim()) return res.status(400).json({ error: 'descriptor is required' });

  try {
    const { rows } = await db.query(
      'WITH ins AS (' +
      '  INSERT INTO cases (descriptor, created_by) VALUES ($1, $2)' +
      '  ON CONFLICT (lower(descriptor)) DO NOTHING RETURNING *' +
      ')' +
      ' SELECT *, (' + COMPUTED_STATUS + ') AS computed_status FROM ins c' +
      ' UNION ALL' +
      ' SELECT *, (' + COMPUTED_STATUS + ') AS computed_status FROM cases c' +
      '   WHERE lower(descriptor) = lower($1)' +
      ' LIMIT 1',
      [descriptor.trim().toUpperCase(), req.user?.sub ?? null]
    );
    return res.status(201).json({ case: rows[0] });
  } catch (err) {
    console.error('[POST /api/cases]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cases/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT *, (' + COMPUTED_STATUS + ') AS computed_status FROM cases c WHERE c.id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Case not found' });
    return res.json({ case: rows[0] });
  } catch (err) {
    console.error('[GET /api/cases/:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
