-- 0002_auth.up.sql
-- Languages and users.

BEGIN;

-- ---------------------------------------------------------------------------
-- languages
--
-- The ISO 639-1 code is the primary key rather than a surrogate UUID: it is
-- short, stable, human-readable and already the value carried in URLs, JSON
-- payloads and the client's stored preference. Using it directly removes a
-- join from every translated read.
-- ---------------------------------------------------------------------------
CREATE TABLE languages (
  language_code   TEXT PRIMARY KEY
                    CHECK (language_code ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  language_name   TEXT NOT NULL,          -- English name, e.g. "Tamil"
  native_name     TEXT NOT NULL,          -- Endonym, e.g. "தமிழ்"
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_languages_updated_at
  BEFORE UPDATE ON languages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  email             TEXT NOT NULL,
  password_hash     TEXT NOT NULL,
  phone             TEXT,
  profile_image     TEXT,
  role              user_role NOT NULL DEFAULT 'farmer',
  language_code     TEXT NOT NULL DEFAULT 'en'
                      REFERENCES languages (language_code)
                      ON UPDATE CASCADE ON DELETE RESTRICT,

  -- Location. district/state drive advisory content; the coordinates are what
  -- the weather service actually needs, and caching them avoids re-geocoding
  -- the district on every forecast request.
  district          TEXT,
  state             TEXT,
  latitude          NUMERIC(9, 6) CHECK (latitude BETWEEN -90 AND 90),
  longitude         NUMERIC(9, 6) CHECK (longitude BETWEEN -180 AND 180),

  -- Farm profile.
  farm_size_acres   NUMERIC(10, 2) CHECK (farm_size_acres >= 0),
  experience_years  SMALLINT CHECK (experience_years BETWEEN 0 AND 100),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,

  -- Coordinates are meaningful only as a pair.
  CONSTRAINT users_coordinates_paired CHECK (
    (latitude IS NULL) = (longitude IS NULL)
  )
);

-- Case-insensitive uniqueness, scoped to live rows so a deleted account does
-- not permanently reserve its address.
CREATE UNIQUE INDEX users_email_key
  ON users (lower(email))
  WHERE deleted_at IS NULL;

CREATE INDEX users_language_code_idx ON users (language_code);
CREATE INDEX users_district_state_idx ON users (state, district)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON COLUMN users.password_hash IS
  'Argon2id or bcrypt digest. Never store a reversible credential here.';

COMMIT;
