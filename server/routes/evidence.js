'use strict';

const express = require('express');
const db      = require('../db');
const { requireAuth }    = require('../middleware/auth');
const { collectEvidence } = require('../agents/collect');

const router = express.Router();

const STEP_ORDER = ['web_intelligence', 'local_knowledge'];

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
  const { type } = req.body ?? {};

  if (!STEP_ORDER.includes(type)) {
    return res.status(400).json({ error: 'Unknown evidence type' });
  }

  // web_intelligence can take 60-120s; use SSE so the gateway doesn't time out
  // before we send a single byte.
  const sse = type === 'web_intelligence';
  if (sse) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Encoding', 'identity');
    res.setHeader('X-Accel-Buffering', 'no'); // prevent nginx proxy buffering
    res.socket?.setNoDelay(true);             // disable Nagle's algorithm
    res.flushHeaders();
  }

  const ping = sse ? setInterval(() => res.write(': ping\n\n'), 15000) : null;
  if (sse) req.on('close', () => clearInterval(ping));

  const sseError = (msg) => { clearInterval(ping); res.write(`data: ${JSON.stringify({ error: msg })}\n\n`); res.end(); };
  const sseDone  = (ev)  => { clearInterval(ping); res.write(`data: ${JSON.stringify({ evidence: ev })}\n\n`); res.end(); };

  try {
    const { rows: [caseRow] } = await db.query(
      'SELECT * FROM cases WHERE id = $1',
      [req.params.id]
    );
    if (!caseRow) {
      if (sse) return sseError('Case not found');
      return res.status(404).json({ error: 'Case not found' });
    }

    // Enforce sequential order
    const stepIdx = STEP_ORDER.indexOf(type);
    if (stepIdx > 0) {
      const prevType = STEP_ORDER[stepIdx - 1];
      const { rows } = await db.query(
        'SELECT id FROM evidence WHERE case_id = $1 AND type = $2 LIMIT 1',
        [req.params.id, prevType]
      );
      if (rows.length === 0) {
        if (sse) return sseError(`Complete "${prevType}" first`);
        return res.status(400).json({ error: `Complete "${prevType}" first` });
      }
    }

    let result;
    if (type === 'local_knowledge') {
      const { merchant_name, confidence, business_type, description, sources } = req.body;
      result = {
        merchant_name: merchant_name?.trim() || null,
        confidence: ['high', 'medium', 'low'].includes(confidence) ? confidence : 'medium',
        business_type: business_type?.trim() || null,
        description: description?.trim() || null,
        sources: Array.isArray(sources) ? sources.slice(0, 8) : [],
      };
    } else {
      result = await collectEvidence(type, caseRow.descriptor, { location_hint: caseRow.location_hint });
    }

    const { rows: [evidence] } = await db.query(
      `INSERT INTO evidence (case_id, type, merchant_name, confidence, business_type, location, logo_url, description, sources)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.params.id,
        type,
        result.merchant_name,
        result.confidence,
        result.business_type,
        result.location   ?? null,
        result.logo_url   ?? null,
        result.description,
        JSON.stringify(result.sources),
      ]
    );

    if (sse) return sseDone(evidence);
    return res.json({ evidence });
  } catch (err) {
    if (ping) clearInterval(ping);
    console.error('[POST /api/cases/:id/evidence/collect]', err);
    const message = err?.message
      || err?.error?.message
      || (typeof err === 'string' ? err : null)
      || 'Internal server error';
    if (sse) { res.write(`data: ${JSON.stringify({ error: message })}\n\n`); res.end(); return; }
    return res.status(500).json({ error: message });
  }
});

// DELETE /api/cases/:id/evidence  — reset all investigation evidence and cancel pending submissions
router.delete('/:id/evidence', requireAuth, async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM evidence WHERE case_id = $1', [req.params.id]);

    // Cancel any pending submissions for this case's descriptor so the case unlocks
    await client.query(
      `DELETE FROM submissions
       WHERE status = 'pending'
         AND descriptor_id IN (
           SELECT d.id FROM descriptors d, cases c
           WHERE c.id = $1 AND lower(d.text) = lower(c.descriptor)
         )`,
      [req.params.id]
    );

    await client.query('COMMIT');
    return res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DELETE /api/cases/:id/evidence]', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
