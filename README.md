# LeafCare Backend

Express + TypeScript + Prisma API over PostgreSQL (Supabase).

## Quick start

```bash
cp .env.example .env      # fill in DATABASE_URL and DIRECT_URL
npm install               # runs prisma generate via postinstall
npm run db:migrate        # apply migrations
npm run db:seed           # load development data (idempotent)
npm run dev               # http://localhost:5000
```

| Script | Purpose |
|---|---|
| `npm run dev` | Watch mode via tsx |
| `npm run build` / `start` | Compile to `dist/` and run |
| `npm run typecheck` / `lint` / `format` | Static checks |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run db:status` | Show migration state |
| `npm run db:seed` | Load development data |
| `npm run db:generate` | Regenerate the Prisma client |

## Database

`prisma/schema.prisma` is the **single source of truth**. The previous
hand-written SQL schema has been moved to [`../archive/`](../archive/README.md)
and must not be used — it drifted from the real database.

### Changing the schema

```bash
# 1. edit prisma/schema.prisma
# 2. generate a migration from the live DB to the new model
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/$(date +%Y%m%d%H%M%S)_your_change/migration.sql

# 3. review the SQL, then apply and regenerate
npm run db:migrate
npm run db:generate
```

`prisma migrate dev` is avoided deliberately: it can reset a database, which is
not acceptable against a shared Supabase instance.

**Regenerate the client after every schema edit.** A stale client is the most
likely cause of "Unknown argument" errors at runtime.

### What Prisma cannot express

Keep these in hand-written migrations if you add them: CHECK constraints,
partial indexes, trigram/GIN indexes, triggers and generated columns. The
archived SQL has working examples.

## Operational endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/v1` | Service metadata and endpoint index |
| `GET /api/v1/health` | Liveness + database ping. 503 if the database is down |
| `GET /api/v1/ready` | Readiness. Required deps must be up; optional ones are reported only |
| `GET /api/v1/ai/health` | Status of the external inference service |

Health and readiness are exempt from rate limiting so an orchestrator polling
them never sees a 429.

## Rate limiting

Four tiers, all configurable from the environment and sharing one window
(`RATE_LIMIT_WINDOW_MS`, default 60s):

| Tier | Variable | Default |
|---|---|---|
| General | `RATE_LIMIT_GENERAL_MAX` | 100/min |
| Auth | `RATE_LIMIT_AUTH_MAX` | 20/min |
| AI | `RATE_LIMIT_AI_MAX` | 10/min |
| Upload | `RATE_LIMIT_UPLOAD_MAX` | 5/min |

Only the general tier is currently wired, because no auth, AI or upload routes
exist yet — the other three limiters are ready to attach.

Set `TRUST_PROXY` to the number of proxies in front of the app in production, or
every client will share one rate-limit bucket.

## AI inference

Disease prediction runs on a **separate inference service** that is not part of
this codebase. This API only observes it:

- `AI_SERVICE_URL` unset → `/ready` and `/ai/health` report `not_configured`
- set → the health probe reports whatever that service says about its model

Nothing here performs, proxies or simulates inference. Model name, version,
device and load time are passed through verbatim and never fabricated.

### Scan pipeline

`POST /api/v1/ai/plant-identification` runs one image through five stages, each
of which can stop it early:

| Stage | Service | Stops the scan when |
|---|---|---|
| 0. Leaf localization | YOLO11x (`YOLO_SERVICE_URL`) | no leaf found, and `YOLO_GATE_ENABLED=true` |
| 1. Plant identification | Pl@ntNet | confidence below `PLANTNET_MIN_CONFIDENCE` |
| 2. Crop normalization | in-process | — |
| 3. Supported-crop gate | in-process | crop is outside the supported list |
| 4. Disease classification | `AI_SERVICE_URL` | — |

Stage 0 exists to keep a photo of a wall from costing a Pl@ntNet call. It is
**advisory**: a detector that is unset, unreachable or mid-restart falls through
to stage 1 rather than failing the scan, so an outage there degrades cost, not
availability. Only a confident "there is no leaf in this frame" stops anything.

Every response carries a `leafDetection` block regardless of outcome, so a client
can distinguish "we looked and found nothing" from "we never looked" — those
warrant different advice to the user.

Note the two model services disagree on their upload field name: the classifier
takes `image`, the detector takes `file`. Both are correct against their own
deployment; neither is a typo.

## Architecture

```
src/
├── app.ts                 Express wiring: security, CORS, rate limit, routes
├── server.ts              Bootstrap, graceful shutdown
├── config/                env validation, Prisma client, swagger
├── controllers/           health, readiness, AI status
├── middleware/            error handling, validation, logging, rate limiting
├── modules/<feature>/     controller → service → repository per feature
├── repositories/          BaseRepository generic CRUD
├── services/              cross-cutting services (AI status probe)
└── utils/                 responses, errors, logger, query parsing
```

Each feature module owns its routes, validation, types, controller, service and
repository. Validation is Zod at the edge; Prisma errors are translated to
meaningful HTTP codes by the global error handler.
