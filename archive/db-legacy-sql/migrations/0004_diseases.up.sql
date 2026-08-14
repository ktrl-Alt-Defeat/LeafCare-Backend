-- 0004_diseases.up.sql
-- Diseases, their translations, and the crop <-> disease association.

BEGIN;

-- ---------------------------------------------------------------------------
-- diseases
-- ---------------------------------------------------------------------------
CREATE TABLE diseases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE
                      CHECK (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  scientific_name   TEXT,
  image_url         TEXT,
  severity          disease_severity NOT NULL DEFAULT 'moderate',
  pathogen_type     pathogen_type,
  contagious        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE TRIGGER trg_diseases_updated_at
  BEFORE UPDATE ON diseases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON COLUMN diseases.severity IS
  'Baseline severity for the pathogen. Per-crop variation is recorded on '
  'crop_diseases.severity_override.';

-- ---------------------------------------------------------------------------
-- disease_translations
--
-- symptoms/causes/prevention/treatment are ordered lists rendered as bullets,
-- so they are stored as TEXT[] rather than one blob. That preserves item
-- boundaries without a further table per list, and each element stays
-- individually translatable.
-- ---------------------------------------------------------------------------
CREATE TABLE disease_translations (
  disease_id            UUID NOT NULL REFERENCES diseases (id) ON DELETE CASCADE,
  language_code         TEXT NOT NULL REFERENCES languages (language_code)
                          ON UPDATE CASCADE ON DELETE RESTRICT,
  disease_name          TEXT NOT NULL CHECK (length(btrim(disease_name)) > 0),
  overview              TEXT,
  symptoms              TEXT[] NOT NULL DEFAULT '{}',
  causes                TEXT[] NOT NULL DEFAULT '{}',
  favorable_conditions  TEXT[] NOT NULL DEFAULT '{}',
  prevention            TEXT[] NOT NULL DEFAULT '{}',
  immediate_steps       TEXT[] NOT NULL DEFAULT '{}',
  organic_treatment     TEXT[] NOT NULL DEFAULT '{}',
  chemical_treatment    TEXT[] NOT NULL DEFAULT '{}',
  disclaimer            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (disease_id, language_code)
);

CREATE INDEX disease_translations_language_code_idx
  ON disease_translations (language_code);

CREATE INDEX disease_translations_name_trgm_idx
  ON disease_translations USING gin (disease_name gin_trgm_ops);

CREATE TRIGGER trg_disease_translations_updated_at
  BEFORE UPDATE ON disease_translations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- crop_diseases
--
-- Many-to-many: late blight affects both potato and tomato, and anthracnose
-- affects many hosts. A single crop_id on diseases could not express that.
-- ---------------------------------------------------------------------------
CREATE TABLE crop_diseases (
  crop_id             UUID NOT NULL REFERENCES crops (id) ON DELETE CASCADE,
  disease_id          UUID NOT NULL REFERENCES diseases (id) ON DELETE CASCADE,
  is_primary_host     BOOLEAN NOT NULL DEFAULT FALSE,
  severity_override   disease_severity,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (crop_id, disease_id)
);

CREATE INDEX crop_diseases_disease_id_idx ON crop_diseases (disease_id);

COMMIT;
