-- 0003_crops.down.sql

BEGIN;

DROP TABLE IF EXISTS crop_companions;
DROP TABLE IF EXISTS user_crops;
DROP TABLE IF EXISTS crop_seasons;
DROP TABLE IF EXISTS crop_translations;
DROP TABLE IF EXISTS crops;

COMMIT;
