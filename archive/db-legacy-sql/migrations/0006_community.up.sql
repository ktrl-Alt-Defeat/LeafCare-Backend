-- 0006_community.up.sql
-- Posts, comments and likes.

BEGIN;

-- ---------------------------------------------------------------------------
-- posts
--
-- crop_id is nullable: a weather or marketplace question need not name a crop.
-- Both crop_id and category are stored because the feed filters on each.
-- ---------------------------------------------------------------------------
CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  crop_id       UUID REFERENCES crops (id) ON DELETE SET NULL,
  category      post_category NOT NULL DEFAULT 'general',
  title         TEXT NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  description   TEXT NOT NULL CHECK (length(btrim(description)) > 0),
  image_url     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Feed ordering. Partial so soft-deleted posts never enter the scan.
CREATE INDEX posts_created_at_idx
  ON posts (created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX posts_category_idx
  ON posts (category, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX posts_crop_id_idx
  ON posts (crop_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX posts_user_id_idx ON posts (user_id);

-- ---------------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------------
CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  comment     TEXT NOT NULL CHECK (length(btrim(comment)) > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX comments_post_id_idx
  ON comments (post_id, created_at)
  WHERE deleted_at IS NULL;

CREATE INDEX comments_user_id_idx ON comments (user_id);

-- ---------------------------------------------------------------------------
-- likes
--
-- The composite primary key IS the uniqueness guarantee: without it a user can
-- like the same post repeatedly and every count in the feed becomes fiction.
-- A surrogate id would add a column and an index for no benefit.
-- ---------------------------------------------------------------------------
CREATE TABLE likes (
  post_id     UUID NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX likes_post_id_idx ON likes (post_id);
CREATE INDEX likes_user_id_idx ON likes (user_id);

COMMIT;
