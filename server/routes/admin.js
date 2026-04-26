'use strict';

const express = require('express');
const db      = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { generateLogoSvg }          = require('../agents/collect');

const router = express.Router();

// POST /api/admin/backfill-logos
// Generates SVG logos for every merchant that currently has none.
router.post('/backfill-logos', requireAuth, requireRole('admin', 'moderator'), async (req, res) => {
  const { rows: merchants } = await db.query(`
    SELECT
      m.id,
      m.name,
      m.location,
      (
        SELECT e.business_type
        FROM   evidence e
        JOIN   cases c       ON c.id = e.case_id
        JOIN   descriptors d ON lower(d.text) = lower(c.descriptor)
        JOIN   submissions s ON s.descriptor_id = d.id AND s.merchant_id = m.id
        WHERE  e.business_type IS NOT NULL
        LIMIT  1
      ) AS business_type
    FROM  merchants m
    WHERE m.logo_url IS NULL
    ORDER BY m.name ASC
  `);

  let updated = 0;
  let skipped = 0;

  for (const m of merchants) {
    try {
      const context = m.location ? `Located in ${m.location}` : null;
      const logoUrl = await generateLogoSvg(m.name, m.business_type, context);
      if (logoUrl) {
        await db.query('UPDATE merchants SET logo_url = $1 WHERE id = $2', [logoUrl, m.id]);
        updated++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error('[backfill-logos] failed for', m.name, err.message);
      skipped++;
    }
    await new Promise(r => setTimeout(r, 250));
  }

  return res.json({ total: merchants.length, updated, skipped });
});

module.exports = router;
