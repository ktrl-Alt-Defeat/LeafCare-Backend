-- 0009_knowledge_base.down.sql

BEGIN;

DROP TABLE IF EXISTS knowledge_article_diseases;
DROP TABLE IF EXISTS knowledge_article_crops;
DROP TABLE IF EXISTS knowledge_article_translations;
DROP TABLE IF EXISTS knowledge_articles;
DROP TABLE IF EXISTS knowledge_category_translations;
DROP TABLE IF EXISTS knowledge_categories;

COMMIT;
