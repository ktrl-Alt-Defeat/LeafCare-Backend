-- 0003_crops.up.sql
-- Crops, their translations, seasons, per-user selection and companion planting.

BEGIN;

-- ---------------------------------------------------------------------------
-- crops
--
-- Language-independent agronomy only. Every human-readable string lives in
-- crop_translations.
--
-- Ranges are stored as typed numeric min/max pairs rather than display strings
-- such as '15-24 °C'. That keeps them queryable ("crops viable at 30 °C"),
-- comparable, and formattable per locale at render time.
-- ---------------------------------------------------------------------------
CREATE TABLE crops (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Stable, human-readable key used in URLs (/catalog/rice) and by the AI
  -- model's class labels. Decoupled from the UUID so either can change safely.
  slug                    TEXT NOT NULL UNIQUE
                            CHECK (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),

  scientific_name         TEXT,
  image_url               TEXT,

  -- Growing conditions
  water_requirement       water_requirement,
  sunlight                sunlight_exposure,
  temperature_min_c       NUMERIC(4, 1),
  temperature_max_c       NUMERIC(4, 1),
  rainfall_min_mm         INTEGER CHECK (rainfall_min_mm >= 0),
  rainfall_max_mm         INTEGER CHECK (rainfall_max_mm >= 0),
  humidity_min_pct        SMALLINT CHECK (humidity_min_pct BETWEEN 0 AND 100),
  humidity_max_pct        SMALLINT CHECK (humidity_max_pct BETWEEN 0 AND 100),

  -- Soil
  soil_type               TEXT,
  ph_min                  NUMERIC(3, 1) CHECK (ph_min BETWEEN 0 AND 14),
  ph_max                  NUMERIC(3, 1) CHECK (ph_max BETWEEN 0 AND 14),
  drainage                drainage_level,

  -- Cultivation
  life_cycle              crop_life_cycle,
  labour_level            labour_level,
  planting_method         TEXT,
  row_spacing_min_cm      NUMERIC(7, 1) CHECK (row_spacing_min_cm >= 0),
  row_spacing_max_cm      NUMERIC(7, 1) CHECK (row_spacing_max_cm >= 0),
  plant_spacing_min_cm    NUMERIC(7, 1) CHECK (plant_spacing_min_cm >= 0),
  plant_spacing_max_cm    NUMERIC(7, 1) CHECK (plant_spacing_max_cm >= 0),

  -- Nutrients. The unit qualifies all three figures.
  nutrient_unit           nutrient_unit,
  nitrogen_requirement    NUMERIC(8, 2) CHECK (nitrogen_requirement >= 0),
  phosphorus_requirement  NUMERIC(8, 2) CHECK (phosphorus_requirement >= 0),
  potassium_requirement   NUMERIC(8, 2) CHECK (potassium_requirement >= 0),

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,

  CONSTRAINT crops_temperature_range CHECK (
    temperature_min_c IS NULL OR temperature_max_c IS NULL
    OR temperature_min_c <= temperature_max_c
  ),
  CONSTRAINT crops_rainfall_range CHECK (
    rainfall_min_mm IS NULL OR rainfall_max_mm IS NULL
    OR rainfall_min_mm <= rainfall_max_mm
  ),
  CONSTRAINT crops_humidity_range CHECK (
    humidity_min_pct IS NULL OR humidity_max_pct IS NULL
    OR humidity_min_pct <= humidity_max_pct
  ),
  CONSTRAINT crops_ph_range CHECK (
    ph_min IS NULL OR ph_max IS NULL OR ph_min <= ph_max
  ),
  CONSTRAINT crops_row_spacing_range CHECK (
    row_spacing_min_cm IS NULL OR row_spacing_max_cm IS NULL
    OR row_spacing_min_cm <= row_spacing_max_cm
  ),
  CONSTRAINT crops_plant_spacing_range CHECK (
    plant_spacing_min_cm IS NULL OR plant_spacing_max_cm IS NULL
    OR plant_spacing_min_cm <= plant_spacing_max_cm
  ),
  -- A nutrient figure is meaningless without knowing its unit.
  CONSTRAINT crops_nutrient_unit_required CHECK (
    nutrient_unit IS NOT NULL
    OR (nitrogen_requirement IS NULL
        AND phosphorus_requirement IS NULL
        AND potassium_requirement IS NULL)
  )
);

CREATE TRIGGER trg_crops_updated_at
  BEFORE UPDATE ON crops
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- crop_translations
-- ---------------------------------------------------------------------------
CREATE TABLE crop_translations (
  crop_id         UUID NOT NULL REFERENCES crops (id) ON DELETE CASCADE,
  language_code   TEXT NOT NULL REFERENCES languages (language_code)
                    ON UPDATE CASCADE ON DELETE RESTRICT,
  crop_name       TEXT NOT NULL CHECK (length(btrim(crop_name)) > 0),
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (crop_id, language_code)
);

CREATE INDEX crop_translations_language_code_idx
  ON crop_translations (language_code);

-- Fuzzy name search within a language, used by the catalog search box.
CREATE INDEX crop_translations_name_trgm_idx
  ON crop_translations USING gin (crop_name gin_trgm_ops);

CREATE TRIGGER trg_crop_translations_updated_at
  BEFORE UPDATE ON crop_translations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- crop_seasons
--
-- A crop can be sown in more than one season, so this is a set rather than a
-- column on crops.
-- ---------------------------------------------------------------------------
CREATE TABLE crop_seasons (
  crop_id   UUID NOT NULL REFERENCES crops (id) ON DELETE CASCADE,
  season    crop_season NOT NULL,

  PRIMARY KEY (crop_id, season)
);

-- ---------------------------------------------------------------------------
-- user_crops
--
-- The crops a farmer grows, chosen during onboarding. Drives dashboard
-- personalisation and the default crop for a scan.
-- ---------------------------------------------------------------------------
CREATE TABLE user_crops (
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  crop_id     UUID NOT NULL REFERENCES crops (id) ON DELETE CASCADE,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, crop_id)
);

CREATE INDEX user_crops_user_id_idx ON user_crops (user_id);
CREATE INDEX user_crops_crop_id_idx ON user_crops (crop_id);

-- At most one primary crop per farmer.
CREATE UNIQUE INDEX user_crops_one_primary_idx
  ON user_crops (user_id)
  WHERE is_primary;

-- ---------------------------------------------------------------------------
-- crop_companions
--
-- Self-referencing many-to-many. Stored directionally; the seed and the
-- application insert both directions so a single-sided query is complete.
-- ---------------------------------------------------------------------------
CREATE TABLE crop_companions (
  crop_id             UUID NOT NULL REFERENCES crops (id) ON DELETE CASCADE,
  companion_crop_id   UUID NOT NULL REFERENCES crops (id) ON DELETE CASCADE,
  relationship        companion_relationship NOT NULL,
  note                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (crop_id, companion_crop_id),
  CONSTRAINT crop_companions_not_self CHECK (crop_id <> companion_crop_id)
);

CREATE INDEX crop_companions_companion_idx ON crop_companions (companion_crop_id);

COMMENT ON TABLE crop_companions IS
  'Companion planting. Free-text partners that are not themselves catalogued '
  'crops (e.g. "Marigold") belong in the knowledge base, not here.';

COMMIT;
