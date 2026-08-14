# Archive — superseded artifacts

Nothing in this directory is used by the application. It is kept for reference
only and should not be edited or applied.

## Why these were archived

`db-legacy-sql/` was a hand-written PostgreSQL schema (25 tables, 9 migrations,
seeds) authored before the Supabase database existed. It was only ever applied to
a throwaway Docker container — **never to Supabase** — and it drifted from the
real database in ways that mattered:

| `db-legacy-sql/` | Live database |
|---|---|
| `water_requirement`, `labour_level` | `water_req`, `labour_req` |
| `row_spacing_min_cm` + `_max_cm` | single `row_spacing_cm` |
| `soil_type`, `planting_method` | not present |
| not present | `growing_duration_days_*`, `sowing_depth_cm`, `icon_name` |

`database_analysis.md` documented that same superseded schema, so its table and
column names no longer describe anything real.

## The canonical schema

`backend/prisma/schema.prisma` is the single source of truth. It was verified to
match the live database exactly (`prisma migrate diff` reported no drift), and
Prisma Migrate now owns the migration history:

```
backend/prisma/migrations/
├── 00000000000000_baseline/                     schema as it existed on adoption
└── 20260814150000_add_business_unique_constraints/
```

All future schema changes go through `prisma migrate`. See
[`backend/README.md`](../backend/README.md).

## What was salvaged

The integrity constraints designed in the legacy SQL were not lost — the three
composite unique constraints it defined (`user_crops`, `reviews`, `order_items`)
were carried into the Prisma schema and applied to the live database.

Ideas from the legacy design still worth considering, which Prisma cannot express
in `schema.prisma` and would need a hand-written migration:

- CHECK constraints (`ph_min <= ph_max`, `rating BETWEEN 1 AND 5`, coordinate pairing)
- Partial indexes (`WHERE deleted_at IS NULL`)
- Trigram/GIN indexes for fuzzy search
- The `set_updated_at()` trigger
