'use strict';
require('dotenv').config();
const express      = require('express');
const cookieParser = require('cookie-parser');
const cors         = require('cors');
const path         = require('path');
const fs           = require('fs');
const db           = require('./db');
const authRoutes        = require('./routes/routes');
const searchRoutes      = require('./routes/search');
const submissionRoutes  = require('./routes/submissions');
const userRoutes        = require('./routes/users');
const merchantRoutes    = require('./routes/merchants');

const app  = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

async function runMigration() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.query(sql);
  console.log('Migration complete');
}

if (!isProd) {
  app.use(cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }));
}

app.use(express.json());
app.use(cookieParser());

app.use('/auth',             authRoutes);
app.use('/api/search',      searchRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/merchants',   merchantRoutes);

if (isProd) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

runMigration()
  .then(() => app.listen(PORT, () => console.log(`Server listening on port ${PORT}`)))
  .catch(err => { console.error('Migration failed, aborting startup:', err); process.exit(1); });
