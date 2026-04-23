'use strict';
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const db   = require('./db');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.query(sql);
  console.log('Migration complete');
  await db.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
