-- 0009_knowledge_base.up.sql
-- Replaces the orphan `catalog` table with a linked, multilingual knowledge base.
--
-- Design notes
--   * Categories are a TABLE, not an ENUM, because "allow future expansion
--     (fertilizers, pests, weather guides)" is an explicit requirement and
--     PostgreSQL ENUM values cannot be removed or reordered.
--   * Articles link to crops and diseases through two narrow junction tables
--     rather than a polymorphic (entity_type, entity_id) pair. Polymorphic
--     columns cannot carry a foreign key, so the database could not stop an
--     article pointing at a crop that no longer exists.

BEGIN;

-- ---------------------------------------------------------------------------
-- knowledge_categories
-- ---------------------------------------------------------------------------
CREATE TABLE knowledge_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE
                CHECK (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  icon        TEXT,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_knowledge_categories_updated_at
  BEFORE UPDATE ON knowledge_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE knowledge_category_translations (
  category_id     UUID NOT NULL REFERENCES knowledge_categories (id) ON DELETE CASCADE,
  language_code   TEXT NOT NULL REFERENCES languages (language_code)
                    ON UPDATE CASCADE ON DELETE RESTRICT,
  name            TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (category_id, language_code)
);

CREATE INDEX knowledge_category_translations_language_idx
  ON knowledge_category_translations (language_code);

CREATE TRIGGER trg_knowledge_category_translations_updated_at
  BEFORE UPDATE ON knowledge_category_translations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- knowledge_articles
-- ---------------------------------------------------------------------------
CREATE TABLE knowledge_articles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID NOT NULL REFERENCES knowledge_categories (id) ON DELETE RESTRICT,
  slug          TEXT NOT NULL UNIQUE
                  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  image_url     TEXT,
  author_id     UUID REFERENCES users (id) ON DELETE SET NULL,

  -- NULL means draft. Publishing is a timestamp rather than a boolean so
  -- content can be scheduled.
  published_at  TIMESTAMPTZ,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE TRIGGER trg_knowledge_articles_updated_at
  BEFORE UPDATE ON knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX knowledge_articles_category_idx
  ON knowledge_articles (category_id, published_at DESC)
  WHERE deleted_at IS NULL AND published_at IS NOT NULL;

CREATE INDEX knowledge_articles_published_idx
  ON knowledge_articles (published_at DESC)
  WHERE deleted_at IS NULL AND published_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- knowledge_article_translations
-- ---------------------------------------------------------------------------
CREATE TABLE knowledge_article_translations (
  article_id      UUID NOT NULL REFERENCES knowledge_articles (id) ON DELETE CASCADE,
  language_code   TEXT NOT NULL REFERENCES languages (language_code)
                    ON UPDATE CASCADE ON DELETE RESTRICT,
  title           TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  summary         TEXT,
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (article_id, language_code)
);

CREATE INDEX knowledge_article_translations_language_idx
  ON knowledge_article_translations (language_code);

-- Full-text search per language. `simple` is used rather than `english`
-- because the corpus spans six languages, several of which have no PostgreSQL
-- stemmer; a language-specific configuration can be added per row later.
CREATE INDEX knowledge_article_translations_fts_idx
  ON knowledge_article_translations
  USING gin (to_tsvector('simple', title || ' ' || coalesce(summary, '') || ' ' || body));

CREATE TRIGGER trg_knowledge_article_translations_updated_at
  BEFORE UPDATE ON knowledge_article_translations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Article <-> subject links
-- ---------------------------------------------------------------------------
CREATE TABLE knowledge_article_crops (
  article_id  UUID NOT NULL REFERENCES knowledge_articles (id) ON DELETE CASCADE,
  crop_id     UUID NOT NULL REFERENCES crops (id) ON DELETE CASCADE,

  PRIMARY KEY (article_id, crop_id)
);

CREATE INDEX knowledge_article_crops_crop_idx ON knowledge_article_crops (crop_id);

CREATE TABLE knowledge_article_diseases (
  article_id  UUID NOT NULL REFERENCES knowledge_articles (id) ON DELETE CASCADE,
  disease_id  UUID NOT NULL REFERENCES diseases (id) ON DELETE CASCADE,

  PRIMARY KEY (article_id, disease_id)
);

CREATE INDEX knowledge_article_diseases_disease_idx
  ON knowledge_article_diseases (disease_id);

COMMIT;
