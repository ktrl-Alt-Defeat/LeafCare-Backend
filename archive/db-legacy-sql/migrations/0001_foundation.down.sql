-- 0001_foundation.down.sql

BEGIN;

DROP FUNCTION IF EXISTS set_updated_at();

DROP TYPE IF EXISTS notification_type;
DROP TYPE IF EXISTS order_status;
DROP TYPE IF EXISTS product_category;
DROP TYPE IF EXISTS post_category;
DROP TYPE IF EXISTS pathogen_type;
DROP TYPE IF EXISTS disease_severity;
DROP TYPE IF EXISTS companion_relationship;
DROP TYPE IF EXISTS nutrient_unit;
DROP TYPE IF EXISTS labour_level;
DROP TYPE IF EXISTS crop_life_cycle;
DROP TYPE IF EXISTS drainage_level;
DROP TYPE IF EXISTS sunlight_exposure;
DROP TYPE IF EXISTS water_requirement;
DROP TYPE IF EXISTS crop_season;
DROP TYPE IF EXISTS user_role;

-- Extensions are intentionally left installed: other schemas in the same
-- database may depend on them.

COMMIT;
