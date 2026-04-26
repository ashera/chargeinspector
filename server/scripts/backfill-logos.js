'use strict';
require('dotenv').config();

const db                        = require('../db');
const { generateLogoSvg }       = require('../agents/collect');

async function backfill() {
  // Fetch merchants without a logo, enriching with business_type from any linked evidence
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

  console.log(`\nFound ${merchants.length} merchant(s) without a logo.\n`);
  if (merchants.length === 0) { await db.end(); return; }

  let success = 0;
  let failed  = 0;

  for (let i = 0; i < merchants.length; i++) {
    const m = merchants[i];
    const prefix = `[${i + 1}/${merchants.length}] ${m.name}`;

    try {
      process.stdout.write(`${prefix} … `);

      const context = m.location ? `Located in ${m.location}` : null;
      const logoUrl = await generateLogoSvg(m.name, m.business_type, context);

      if (logoUrl) {
        await db.query('UPDATE merchants SET logo_url = $1 WHERE id = $2', [logoUrl, m.id]);
        console.log('✓');
        success++;
      } else {
        console.log('✗ (no SVG returned)');
        failed++;
      }
    } catch (err) {
      console.log(`✗ (${err.message})`);
      failed++;
    }

    // Brief pause between API calls to stay within rate limits
    if (i < merchants.length - 1) await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\nDone — ${success} updated, ${failed} skipped.\n`);
  await db.end();
}

backfill().catch(err => {
  console.error(err);
  process.exit(1);
});
