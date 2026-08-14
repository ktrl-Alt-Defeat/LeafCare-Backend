-- schema.sql
-- Applies the complete LeafCare schema in dependency order.
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/schema.sql
--
-- This file deliberately includes the migrations rather than duplicating their
-- DDL: a hand-maintained copy would drift from the migrations the moment one
-- changed. For a flattened snapshot of a live database, use:
--
--   pg_dump --schema-only --no-owner --no-privileges "$DATABASE_URL"

\set ON_ERROR_STOP on

\ir migrations/0001_foundation.up.sql
\ir migrations/0002_auth.up.sql
\ir migrations/0003_crops.up.sql
\ir migrations/0004_diseases.up.sql
\ir migrations/0005_predictions.up.sql
\ir migrations/0006_community.up.sql
\ir migrations/0007_marketplace.up.sql
\ir migrations/0008_notifications.up.sql
\ir migrations/0009_knowledge_base.up.sql
