-- ============================================================
-- ChargeInspector Schema
-- Run: psql $DATABASE_URL -f schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ------------------------------------------------------------
-- Users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT          NOT NULL UNIQUE,
  password_hash TEXT          NOT NULL,
  role          TEXT          NOT NULL DEFAULT 'user'
                              CHECK (role IN ('user', 'admin', 'moderator')),
  total_points  INT           NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

ALTER TABLE users ADD COLUMN IF NOT EXISTS total_points INT  NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name  TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name   TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url  TEXT;

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
  token_hash  TEXT          NOT NULL UNIQUE,
  family      UUID          NOT NULL,
  expires_at  TIMESTAMPTZ   NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ   DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx    ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_family_idx  ON refresh_tokens (family);
CREATE INDEX IF NOT EXISTS refresh_tokens_expires_idx ON refresh_tokens (expires_at);

-- ------------------------------------------------------------
-- Merchants
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchants (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  location   TEXT,
  website    TEXT,
  logo_url   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deduplicate merchants before enforcing uniqueness.
-- Keeps the oldest record and re-points any submissions that
-- referenced the duplicates so no data is orphaned.
DO $$
DECLARE
  dup     RECORD;
  keep_id UUID;
BEGIN
  FOR dup IN
    SELECT lower(name) AS lname, lower(COALESCE(location, '')) AS lloc
    FROM merchants
    GROUP BY lower(name), lower(COALESCE(location, ''))
    HAVING count(*) > 1
  LOOP
    SELECT id INTO keep_id
    FROM merchants
    WHERE lower(name) = dup.lname
      AND lower(COALESCE(location, '')) = dup.lloc
    ORDER BY created_at ASC
    LIMIT 1;

    UPDATE submissions
    SET merchant_id = keep_id
    WHERE merchant_id IN (
      SELECT id FROM merchants
      WHERE lower(name) = dup.lname
        AND lower(COALESCE(location, '')) = dup.lloc
        AND id <> keep_id
    );

    DELETE FROM merchants
    WHERE lower(name) = dup.lname
      AND lower(COALESCE(location, '')) = dup.lloc
      AND id <> keep_id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS merchants_name_location_idx
  ON merchants (lower(name), lower(COALESCE(location, '')));

-- ------------------------------------------------------------
-- Descriptors
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS descriptors (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  text                     TEXT        NOT NULL UNIQUE,
  canonical_submission_id  UUID,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS descriptors_text_trgm_idx
  ON descriptors USING GIN (text gin_trgm_ops);

-- ------------------------------------------------------------
-- Submissions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  descriptor_id UUID        NOT NULL REFERENCES descriptors(id) ON DELETE CASCADE,
  merchant_id   UUID        NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  submitted_by  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected')),
  upvote_count  INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS submissions_descriptor_idx ON submissions (descriptor_id);
CREATE INDEX IF NOT EXISTS submissions_status_idx     ON submissions (status);
CREATE INDEX IF NOT EXISTS submissions_user_idx       ON submissions (submitted_by);

DO $$ BEGIN
  ALTER TABLE descriptors
    ADD CONSTRAINT fk_canonical_submission
    FOREIGN KEY (canonical_submission_id)
    REFERENCES submissions(id)
    ON DELETE SET NULL
    DEFERRABLE INITIALLY DEFERRED;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ------------------------------------------------------------
-- Votes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS votes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID        NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, user_id)
);

CREATE INDEX IF NOT EXISTS votes_submission_idx ON votes (submission_id);

-- ------------------------------------------------------------
-- Points Log
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS points_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount       INT         NOT NULL,
  reason       TEXT        NOT NULL CHECK (reason IN ('submission_approved', 'upvote_received')),
  reference_id UUID        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS points_log_user_idx ON points_log (user_id);

-- ------------------------------------------------------------
-- Badges
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL UNIQUE,
  description       TEXT        NOT NULL,
  points_threshold  INT         NOT NULL UNIQUE,
  icon              TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id   UUID        NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- ------------------------------------------------------------
-- Descriptor Views (analytics)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS descriptor_views (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  descriptor_id UUID        NOT NULL REFERENCES descriptors(id) ON DELETE CASCADE,
  user_id       UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS descriptor_views_descriptor_idx ON descriptor_views (descriptor_id);
CREATE INDEX IF NOT EXISTS descriptor_views_created_idx    ON descriptor_views (created_at);

-- ------------------------------------------------------------
-- Cases (unidentified descriptors under investigation)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cases (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  descriptor   TEXT        NOT NULL,
  created_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS cases_descriptor_idx ON cases (lower(descriptor));
CREATE INDEX IF NOT EXISTS cases_created_idx           ON cases (created_at);

-- ------------------------------------------------------------
-- Detectives (users investigating a case)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detectives (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id   UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (case_id, user_id)
);

CREATE INDEX IF NOT EXISTS detectives_case_idx ON detectives (case_id);
CREATE INDEX IF NOT EXISTS detectives_user_idx ON detectives (user_id);

-- Seed default badges
INSERT INTO badges (name, description, points_threshold, icon) VALUES
  ('First Steps',    'Earned your first points',          10,   '🐣'),
  ('Contributor',    'Reached 50 points',                 50,   '🔍'),
  ('Investigator',   'Reached 100 points',                100,  '🕵️'),
  ('Analyst',        'Reached 250 points',                250,  '📊'),
  ('Expert',         'Reached 500 points',                500,  '🏆'),
  ('Legend',         'Reached 1000 points',               1000, '⭐')
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------------------
-- Ranks (progressive levels based on total_points)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ranks (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL UNIQUE,
  description       TEXT        NOT NULL,
  points_threshold  INT         NOT NULL UNIQUE,
  icon              TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO ranks (name, description, points_threshold, icon) VALUES
  ('Civilian',        'New recruit — just getting started',        0,    '👤'),
  ('Tipster',         'Your first tip in the case files',          10,   '🗣️'),
  ('Informant',       'A trusted source of intelligence',          50,   '👁️'),
  ('Street Detective','Starting to connect the dots',              100,  '🔍'),
  ('Private Eye',     'A respected independent investigator',      250,  '🕵️'),
  ('Inspector',       'Commanding authority in the field',         500,  '🎩'),
  ('Commissioner',    'The highest rank. A true legend.',          1000, '⭐')
ON CONFLICT (name) DO NOTHING;
