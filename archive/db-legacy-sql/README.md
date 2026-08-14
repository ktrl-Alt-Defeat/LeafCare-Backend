# LeafCare Database

PostgreSQL 16 schema. Design rationale, ER diagram and scalability notes live in
[`docs/database-design.md`](../docs/database-design.md).

```
db/
├── schema.sql              Applies every migration in order
├── migrations/             Source of truth — paired .up.sql / .down.sql
└── seeds/                  Reference data, idempotent
```

## Requirements

- PostgreSQL 13 or later (`gen_random_uuid()` is built in from 13; `pgcrypto`
  is created for 11–12 compatibility)
- Extensions `pgcrypto` and `pg_trgm`, both created by `0001_foundation`

## Apply the schema

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/schema.sql
```

`schema.sql` includes the migrations with `\ir` rather than duplicating their
DDL, so it can never drift from them. For a flattened snapshot of a live
database:

```bash
pg_dump --schema-only --no-owner --no-privileges "$DATABASE_URL" > snapshot.sql
```

## Load seed data

Order matters — crops and diseases reference `languages`.

```bash
for f in db/seeds/*.sql; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
```

Seeds are idempotent (`ON CONFLICT`), so re-running them is safe.

## Migrations

Each migration is a pair:

```
NNNN_name.up.sql     forward
NNNN_name.down.sql   rollback
```

Every file wraps its work in `BEGIN`/`COMMIT`, so a failed migration leaves no
partial state. The naming works as-is with `golang-migrate`, `dbmate` and
`node-pg-migrate`, or can be driven by the loop above.

Roll back one step:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0009_knowledge_base.down.sql
```

Roll back everything (reverse order):

```bash
for f in $(ls -r db/migrations/*.down.sql); do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
```

## Conventions

| Rule | Detail |
|---|---|
| Primary keys | `UUID DEFAULT gen_random_uuid()`, except `languages` (ISO code) and junction tables (composite) |
| Timestamps | `TIMESTAMPTZ`, never naive `TIMESTAMP` |
| `updated_at` | Maintained by the `set_updated_at()` trigger, never by the application |
| Soft delete | `deleted_at TIMESTAMPTZ` on user-facing content; queries filter `WHERE deleted_at IS NULL` |
| Naming | `snake_case`; indexes `<table>_<columns>_idx`, constraints `<table>_<rule>` |
| Money | `NUMERIC(12,2)` with an explicit `currency_code`, never floating point |
| Translations | `<entity>_translations` keyed `(entity_id, language_code)` |

## Verified against

PostgreSQL 16.14. Schema apply, seed apply, seed re-apply, full rollback and 12
constraint-violation cases were all executed — see the Verification section of
the design document.

```bash
docker run -d --name leafcare-pg -e POSTGRES_PASSWORD=pw -e POSTGRES_DB=leafcare \
  -p 55432:5432 postgres:16-alpine
docker cp db leafcare-pg:/db
docker exec leafcare-pg sh -c 'cd /db && psql -U postgres -d leafcare -v ON_ERROR_STOP=1 -f schema.sql'
```
