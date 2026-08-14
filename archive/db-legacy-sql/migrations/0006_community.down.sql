-- 0006_community.down.sql

BEGIN;

DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts;

COMMIT;
