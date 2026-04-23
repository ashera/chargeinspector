-- ============================================================
-- Auth Schema: users + refresh_tokens
-- Run: psql $DATABASE_URL -f schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- Users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT          NOT NULL UNIQUE,
  password_hash TEXT          NOT NULL,
  role          TEXT          NOT NULL DEFAULT 'user'
                              CHECK (role IN ('user', 'admin', 'moderator')),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- Refresh Tokens
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT          NOT NULL UNIQUE,   -- bcrypt hash of the raw token
  family      UUID          NOT NULL,          -- rotation family; reuse = nuke family
  expires_at  TIMESTAMPTZ   NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ   DEFAULT NULL       -- NULL = still valid
);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx    ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_family_idx  ON refresh_tokens (family);
CREATE INDEX IF NOT EXISTS refresh_tokens_expires_idx ON refresh_tokens (expires_at);

-- ------------------------------------------------------------
-- Periodic cleanup (run via pg_cron or external cron)
-- DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked_at IS NOT NULL;
-- ------------------------------------------------------------
