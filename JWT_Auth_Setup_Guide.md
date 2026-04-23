# JWT Auth — Local Setup Guide

**Stack:** Node.js · Express · PostgreSQL · React (Vite)
**Files delivered:** `schema.sql` · `middleware.js` · `routes.js` · `useAuth.js` · `AuthPage.jsx`

---

## Prerequisites

Before starting, make sure the following are installed on your machine.

| Tool | Minimum Version | Check command |
|------|----------------|---------------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| PostgreSQL | 14+ | `psql --version` |
| Git (optional) | any | `git --version` |

**Install Node.js:** https://nodejs.org (choose the LTS version)
**Install PostgreSQL:** https://www.postgresql.org/download/ (choose your OS)

---

## Step 1 — Create your project folders

Open a terminal and run:

```bash
mkdir my-app
cd my-app
mkdir server client
```

Your final folder structure will look like this:

```
my-app/
├── server/
│   ├── db.js                  ← you will create this
│   ├── middleware/
│   │   └── auth.js            ← middleware.js (renamed)
│   ├── routes/
│   │   └── auth.js            ← routes.js (renamed)
│   ├── schema.sql             ← schema.sql
│   └── index.js               ← you will create this
└── client/
    ├── src/
    │   ├── hooks/
    │   │   └── useAuth.js     ← useAuth.js
    │   └── components/
    │       └── AuthPage.jsx   ← AuthPage.jsx
    └── ...
```

---

## Step 2 — Place the delivered files

Copy the five files you received into the correct locations:

| Delivered file | Destination |
|---|---|
| `schema.sql` | `server/schema.sql` |
| `middleware.js` | `server/middleware/auth.js` |
| `routes.js` | `server/routes/auth.js` |
| `useAuth.js` | `client/src/hooks/useAuth.js` |
| `AuthPage.jsx` | `client/src/components/AuthPage.jsx` |

---

## Step 3 — Set up the database

### 3a. Start PostgreSQL

**macOS (Homebrew):**
```bash
brew services start postgresql@16
```

**Windows:** Open the Services app and start "postgresql-x64-16", or run:
```bash
pg_ctl -D "C:\Program Files\PostgreSQL\16\data" start
```

**Linux (systemd):**
```bash
sudo systemctl start postgresql
```

### 3b. Create a database and user

```bash
psql -U postgres
```

Inside the psql prompt, run:

```sql
CREATE DATABASE myapp;
CREATE USER myapp_user WITH PASSWORD 'choose_a_strong_password';
GRANT ALL PRIVILEGES ON DATABASE myapp TO myapp_user;
\q
```

### 3c. Run the migration

```bash
psql -U myapp_user -d myapp -f server/schema.sql
```

You should see output confirming that the `users` and `refresh_tokens` tables were created. Verify with:

```bash
psql -U myapp_user -d myapp -c "\dt"
```

Expected output:
```
           List of relations
 Schema |      Name      | Type  |    Owner
--------+----------------+-------+------------
 public | refresh_tokens | table | myapp_user
 public | users          | table | myapp_user
```

---

## Step 4 — Set up the Express server

### 4a. Initialise and install dependencies

```bash
cd server
npm init -y
npm install express jsonwebtoken bcrypt pg cookie-parser uuid dotenv
npm install --save-dev nodemon
```

### 4b. Create the database connection — `server/db.js`

```js
// server/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = {
  query: (text, params) => pool.query(text, params),
};
```

### 4c. Create the environment file — `server/.env`

```bash
# In the server/ folder, create a file named .env
touch .env    # macOS/Linux
type nul > .env   # Windows Command Prompt
```

Open `.env` in any text editor and paste the following, filling in your own values:

```
DATABASE_URL=postgres://myapp_user:choose_a_strong_password@localhost:5432/myapp
JWT_ACCESS_SECRET=<paste_first_secret_here>
JWT_REFRESH_SECRET=<paste_second_secret_here>
NODE_ENV=development
PORT=3001
```

**Generate the two secrets** by running this command twice (use different outputs for each):

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> **Important:** Never commit `.env` to Git. Add it to `.gitignore`:
> ```bash
> echo ".env" >> .gitignore
> ```

### 4d. Create the main server file — `server/index.js`

```js
// server/index.js
require('dotenv').config();
const express      = require('express');
const cookieParser = require('cookie-parser');
const authRoutes   = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cookieParser());

// Auth routes
app.use('/auth', authRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### 4e. Add a start script to `server/package.json`

Open `server/package.json` and update the `"scripts"` section:

```json
"scripts": {
  "start":   "node index.js",
  "dev":     "nodemon index.js"
}
```

### 4f. Start the server

```bash
npm run dev
```

You should see: `Server running on http://localhost:3001`

Test it:

```bash
curl http://localhost:3001/health
# Expected: {"ok":true}
```

---

## Step 5 — Set up the React client

### 5a. Create a Vite React project

```bash
cd ../client
npm create vite@latest . -- --template react
npm install
```

When prompted "Current directory is not empty. Remove existing files and continue?", choose **Yes** only if the `client/` folder is empty. Otherwise run this in a new empty folder and copy the Vite files across manually.

### 5b. Copy your auth files into the Vite project

```bash
# From the my-app/ root
mkdir -p client/src/hooks
mkdir -p client/src/components

# Copy the files (already done in Step 2 if you followed it)
```

### 5c. Configure the dev proxy — `client/vite.config.js`

Open `client/vite.config.js` and update it so API requests from the browser are forwarded to your Express server:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

This means any request to `/auth/login` from React in development will be forwarded to `http://localhost:3001/auth/login` automatically.

### 5d. Wire up `AuthProvider` in `client/src/main.jsx`

Replace the contents of `client/src/main.jsx` with:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthPage from './components/AuthPage';
import App from './App';

function Root() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  return isAuthenticated ? <App /> : <AuthPage />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </React.StrictMode>
);
```

### 5e. Start the React dev server

```bash
npm run dev
```

Open your browser at **http://localhost:5173**

You should see the `AuthPage` login/register UI.

---

## Step 6 — Smoke test the full flow

With both servers running, open your browser's DevTools (F12) and try the following:

### Register a new user

Fill in the register form on screen, or test via curl:

```bash
curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"MyPassword1!"}' | jq .
```

Expected response:

```json
{
  "accessToken": "eyJ...",
  "expiresIn": 900,
  "user": { "id": "...", "email": "test@example.com", "role": "user" }
}
```

### Log in

```bash
curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"MyPassword1!"}' | jq .
```

The `-c cookies.txt` flag saves the `refreshToken` cookie to a file.

### Fetch the current user

```bash
# Replace eyJ... with the accessToken from the login response
curl -s http://localhost:3001/auth/me \
  -H "Authorization: Bearer eyJ..."  | jq .
```

### Verify token rotation

```bash
curl -s -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt \
  -d '{"userId":"<paste your user id here>"}' | jq .
```

A new `accessToken` should be returned and the cookie updated.

---

## Step 7 — Protect your own API routes

Once auth is working, use the middleware on any route you add:

```js
// server/routes/posts.js  (example)
const express    = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const router     = express.Router();

// Any logged-in user
router.get('/', requireAuth, (req, res) => {
  res.json({ message: `Hello ${req.user.email}` });
});

// Admins only
router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ message: 'Deleted' });
});

module.exports = router;
```

Wire it into `server/index.js`:

```js
const postRoutes = require('./routes/posts');
app.use('/api/posts', postRoutes);
```

### Making authenticated requests from React

```jsx
// Inside any component wrapped by AuthProvider
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { apiFetch } = useAuth();

  async function loadPosts() {
    const res  = await apiFetch('/api/posts');
    const data = await res.json();
    console.log(data);
  }

  return <button onClick={loadPosts}>Load posts</button>;
}
```

`apiFetch` automatically attaches the Bearer token and silently refreshes it if needed.

---

## Step 8 — Promote a user to admin (optional)

```bash
psql -U myapp_user -d myapp -c \
  "UPDATE users SET role = 'admin' WHERE email = 'test@example.com';"
```

---

## Optional — Database cleanup cron job

The `refresh_tokens` table accumulates expired and revoked rows over time. To keep it lean, add a scheduled cleanup.

**Using `node-cron` in Node.js:**

```bash
npm install node-cron
```

```js
// Add to server/index.js
const cron = require('node-cron');
const db   = require('./db');

// Run every day at 3 AM
cron.schedule('0 3 * * *', async () => {
  const { rowCount } = await db.query(
    `DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked_at IS NOT NULL`
  );
  console.log(`[cron] Cleaned up ${rowCount} stale refresh tokens`);
});
```

---

## Troubleshooting

### "Connection refused" on the server

Make sure PostgreSQL is running (`pg_ctl status`) and that the `DATABASE_URL` in `.env` matches your database name, username, and password exactly.

### "JWT_ACCESS_SECRET must be set" on startup

The `.env` file is not being loaded. Confirm `require('dotenv').config()` is the very first line in `index.js`, and that `.env` is in the `server/` folder (not the project root).

### CORS errors in the browser

In development the Vite proxy handles this — make sure both servers are running and `vite.config.js` has the proxy configured as shown in Step 5c. In production you will need to add `cors` middleware to Express.

### Cookie not being sent on `/auth/refresh`

The refresh cookie is scoped to the path `/auth/refresh`. Only requests to exactly that path will include the cookie — this is intentional. Make sure your fetch call targets `/auth/refresh` (not `/refresh`).

### "Tracker idealTree already exists" npm error

Run `npm cache clean --force` then try again.

---

## Production checklist

When you are ready to deploy:

- Set `NODE_ENV=production` in your environment variables
- Use HTTPS — the `secure: true` flag on the cookie will not work without it
- Set `sameSite: 'strict'` (already the default in the delivered code)
- Put the Express server behind a reverse proxy (nginx or Caddy)
- Add the `cors` package and restrict allowed origins to your frontend domain
- Run the token cleanup query on a schedule (pg_cron or the node-cron approach above)
- Never commit `.env` to source control
