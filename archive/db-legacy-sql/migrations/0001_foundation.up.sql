-- 0001_foundation.up.sql
-- Extensions, shared ENUM types and the updated_at trigger function.
-- Everything in later migrations depends on this file.

BEGIN;

-- gen_random_uuid() is built into PostgreSQL 13+. pgcrypto covers 11-12.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Trigram index support for fuzzy search on names (see 0010 notes).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- Enumerated types
--
-- ENUMs are used for small, stable domains. Values can be appended later with
-- `ALTER TYPE ... ADD VALUE`, but cannot be removed or reordered, so anything
-- expected to churn (knowledge base categories, product units) is a table or
-- free text instead.
-- ---------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM ('farmer', 'expert', 'admin');

CREATE TYPE crop_season AS ENUM ('kharif', 'rabi', 'zaid', 'perennial');

CREATE TYPE water_requirement AS ENUM ('low', 'moderate', 'intermediate', 'high');

CREATE TYPE sunlight_exposure AS ENUM ('full_sun', 'partial_shade', 'full_shade');

CREATE TYPE drainage_level AS ENUM ('poor', 'moderate', 'good');

CREATE TYPE crop_life_cycle AS ENUM ('annual', 'biennial', 'perennial');

CREATE TYPE labour_level AS ENUM ('low', 'medium', 'high');

-- Nutrient doses are quoted per hectare for field crops and per plant for
-- orchard crops. Storing the unit alongside the figure keeps both comparable
-- and prevents a 200 g/tree dose being read as 200 kg/ha.
CREATE TYPE nutrient_unit AS ENUM ('kg_per_hectare', 'g_per_plant');

CREATE TYPE companion_relationship AS ENUM ('beneficial', 'neutral', 'avoid');

CREATE TYPE disease_severity AS ENUM ('low', 'moderate', 'high', 'severe');

CREATE TYPE pathogen_type AS ENUM (
  'fungal',
  'bacterial',
  'viral',
  'pest',
  'nutrient_deficiency',
  'abiotic'
);

CREATE TYPE post_category AS ENUM (
  'disease_help',
  'crop_advice',
  'fertilizer',
  'irrigation',
  'weather',
  'marketplace',
  'general'
);

CREATE TYPE product_category AS ENUM (
  'seeds',
  'fertilizers',
  'crop_protection',
  'tools',
  'equipment'
);

CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

CREATE TYPE notification_type AS ENUM (
  'weather_alert',
  'disease_alert',
  'community_reply',
  'order_update',
  'system'
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
--
-- Enforced by trigger rather than by the application so that manual SQL,
-- background jobs and future services cannot leave a stale timestamp behind.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION set_updated_at() IS
  'BEFORE UPDATE trigger: stamps updated_at on every mutation.';

COMMIT;
