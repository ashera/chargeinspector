'use strict';

const express = require('express');
const db      = require('../db');
const { optionalAuth, requireAuth } = require('../middleware/auth');
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

const DETECTIVES_AGG =
  `COALESCE(
    json_agg(
      json_build_object(
        'user_id',      u.id,
        'username',     split_part(u.email, '@', 1),
        'last_name',    u.last_name,
        'total_points', u.total_points,
        'avatar_url',   u.avatar_url
      )
      ORDER BY det.joined_at ASC
    ) FILTER (WHERE det.user_id IS NOT NULL),
    '[]'
  )`;

// Returns a single case row with computed_status, detectives, creator rank/surname,
// and solved_merchant_name (from the first approved submission for this descriptor).
async function fetchCase(where, params) {
  const { rows } = await db.query(
    'SELECT c.*, (' + COMPUTED_STATUS + ') AS computed_status, ' +
    DETECTIVES_AGG + ' AS detectives, ' +
    'cb.last_name AS created_by_last_name, ' +
    '(SELECT r.icon || \' \' || r.name FROM ranks r' +
    '  WHERE r.points_threshold <= COALESCE(cb.total_points, 0)' +
    '  ORDER BY r.points_threshold DESC LIMIT 1) AS created_by_rank, ' +
    '(SELECT m.name FROM submissions s' +
    '  JOIN descriptors d ON d.id = s.descriptor_id' +
    '  JOIN merchants   m ON m.id = s.merchant_id' +
    '  WHERE lower(d.text) = lower(c.descriptor) AND s.status = \'approved\'' +
    '  ORDER BY s.created_at ASC LIMIT 1) AS solved_merchant_name, ' +
    '(SELECT json_build_object(' +
    '  \'username\', split_part(u.email, \'@\', 1),' +
    '  \'last_name\', u.last_name,' +
    '  \'total_points\', u.total_points,' +
    '  \'solved_at\', s.created_at' +
    ') FROM submissions s' +
    '  JOIN descriptors d ON d.id = s.descriptor_id' +
    '  JOIN users       u ON u.id = s.submitted_by' +
    '  WHERE lower(d.text) = lower(c.descriptor) AND s.status = \'approved\'' +
    '  ORDER BY s.created_at ASC LIMIT 1) AS solved_by, ' +
    '(SELECT s.id FROM submissions s' +
    '  JOIN descriptors d ON d.id = s.descriptor_id' +
    '  WHERE lower(d.text) = lower(c.descriptor) AND s.status = \'pending\'' +
    '  ORDER BY s.created_at DESC LIMIT 1) AS pending_submission_id ' +
    'FROM cases c' +
    ' LEFT JOIN users cb ON cb.id = c.created_by' +
    ' LEFT JOIN detectives det ON det.case_id = c.id' +
    ' LEFT JOIN users u ON u.id = det.user_id' +
    ' WHERE ' + where +
    ' GROUP BY c.id, cb.last_name, cb.total_points' +
    ' LIMIT 1',
    params
  );
  return rows[0] ?? null;
}

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
      ' SELECT id FROM ins' +
      ' UNION ALL' +
      ' SELECT id FROM cases WHERE lower(descriptor) = lower($1)' +
      ' LIMIT 1',
      [descriptor.trim().toUpperCase(), req.user?.sub ?? null]
    );

    const caseId = rows[0].id;

    if (req.user?.sub) {
      await db.query(
        'INSERT INTO detectives (case_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [caseId, req.user.sub]
      );
    }

    const caseRow = await fetchCase('c.id = $1', [caseId]);
    return res.status(201).json({ case: caseRow });
  } catch (err) {
    console.error('[POST /api/cases]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cases/lookup?descriptor=  — check if a case exists without creating one
router.get('/lookup', async (req, res) => {
  const descriptor = (req.query.descriptor || '').trim();
  if (!descriptor) return res.json({ case: null });

  try {
    const caseRow = await fetchCase('lower(c.descriptor) = lower($1)', [descriptor]);
    return res.json({ case: caseRow });
  } catch (err) {
    console.error('[GET /api/cases/lookup]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/cases/:id/hint  — save location hint (any authenticated user)
router.patch('/:id/hint', requireAuth, async (req, res) => {
  const { location_hint } = req.body ?? {};
  try {
    await db.query(
      'UPDATE cases SET location_hint = $1 WHERE id = $2',
      [location_hint?.trim() || null, req.params.id]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/cases/:id/hint]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cases/:id
router.get('/:id', async (req, res) => {
  try {
    const caseRow = await fetchCase('c.id = $1', [req.params.id]);
    if (!caseRow) return res.status(404).json({ error: 'Case not found' });
    return res.json({ case: caseRow });
  } catch (err) {
    console.error('[GET /api/cases/:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
