'use strict';

const express = require('express');
const db      = require('../db');
const { requireAuth }          = require('../middleware/auth');
const { collectWebIntelligence } = require('../agents/webIntelligence');

const router = express.Router();

// GET /api/cases/:id/evidence
router.get('/:id/evidence', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM evidence WHERE case_id = $1 ORDER BY collected_at DESC',
      [req.params.id]
    );
    return res.json({ evidence: rows });
  } catch (err) {
    console.error('[GET /api/cases/:id/evidence]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/cases/:id/evidence/collect
router.post('/:id/evidence/collect', requireAuth, async (req, res) => {
  const { type = 'web_intelligence' } = req.body ?? {};

  try {
    const { rows: [caseRow] } = await db.query(
      'SELECT * FROM cases WHERE id = $1',
      [req.params.id]
    );
    if (!caseRow) return res.status(404).json({ error: 'Case not found' });

    if (type !== 'web_intelligence') {
      return res.status(400).json({ error: 'Unknown evidence type' });
    }

    const result = await collectWebIntelligence(caseRow.descriptor);

    const { rows: [evidence] } = await db.query(
      `INSERT INTO evidence (case_id, type, merchant_name, confidence, business_type, description, sources)
       VALUES ($1, 'web_intelligence', $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.params.id,
        result.merchant_name,
        result.confidence,
        result.business_type,
        result.description,
        JSON.stringify(result.sources),
      ]
    );

    return res.json({ evidence });
  } catch (err) {
    console.error('[POST /api/cases/:id/evidence/collect]', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;
