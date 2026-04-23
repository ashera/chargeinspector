'use strict';

const express = require('express');
const db      = require('../db');
const { optionalAuth } = require('../middleware/auth');
const router  = express.Router();

// POST /api/analytics/view
// Body: { descriptorId }
router.post('/view', optionalAuth, async (req, res) => {
  const { descriptorId } = req.body ?? {};
  if (!descriptorId) return res.status(400).json({ error: 'descriptorId is required' });

  try {
    await db.query(
      `INSERT INTO descriptor_views (descriptor_id, user_id) VALUES ($1, $2)`,
      [descriptorId, req.user?.sub ?? null]
    );
    return res.status(201).json({ recorded: true });
  } catch (err) {
    console.error('[POST /api/analytics/view]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
