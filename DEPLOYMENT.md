# Deploying the LeafCare backend

The service is a stateless Express API over PostgreSQL. It talks to two external
services — Pl@ntNet for plant identification and a separately deployed
EfficientNetV2-S classifier for disease detection — and degrades predictably
when either is missing.

---

## 1. Environment variables

`src/config/env.ts` validates every variable at boot with zod. A missing or
malformed required variable exits the process with a printed error rather than
starting a half-configured service, so a bad config fails the deploy instead of
surfacing later as a runtime error.

### Required — the service will not start without these

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Pooled connection. On Supabase this is the transaction pooler on port **6543**, with `?pgbouncer=true`. |
| `DIRECT_URL` | Direct connection on port **5432**. Prisma migrations need this; the pooler cannot run DDL. |
| `PLANTNET_API_KEY` | Plant identification fails closed without it. |

### Required in practice for production

| Variable | Value | Why |
| --- | --- | --- |
| `NODE_ENV` | `production` | Enables fail-fast on database errors at startup. |
| `CORS_ORIGIN` | Your frontend origin | Comma-separated for multiple. **If this does not match the deployed frontend exactly, every browser call is blocked.** |
| `TRUST_PROXY` | `1` behind one load balancer | Rate limiting keys on client IP. Left at `0` behind a proxy, every user shares one bucket and the whole service rate-limits together. |

### Optional

| Variable | Default | Notes |
| --- | --- | --- |
| `AI_SERVICE_URL` | *(unset)* | Disease classifier base URL. **Unset is silent** — the API still serves, `/api/v1/ai/health` reports `not_configured`, and scans return no prediction. This is the easiest thing to forget, because nothing errors. |
| `AI_SERVICE_TIMEOUT_MS` | `30000` | Set to `90000` for the Render free tier, which cold-starts in roughly 60s. The 30s default times out on the first request after idle. |
| `PORT` | `5000` | Most platforms inject this. |
| `LOG_LEVEL` | `info` | `debug` logs the classifier's full candidate list. |
| `APP_VERSION` | `1.0.0` | Reported by `/` and `/health`. |
| `RATE_LIMIT_*` | see `.env.example` | Set `RATE_LIMIT_ENABLED=false` only in tests. |

> `.env` is gitignored. Every value above must be set in the deployment
> platform — copying the file is not an option, and is not one you want.

---

## 2. Deploying on Render (blueprint)

`render.yaml` describes the service. Dashboard → **New** → **Blueprint**, point
it at this repository.

Render prompts for the four values marked `sync: false`: `DATABASE_URL`,
`DIRECT_URL`, `PLANTNET_API_KEY` and `CORS_ORIGIN`. Everything else is
committed in the blueprint.

The health check path is `/api/v1/health`, which returns **503** when PostgreSQL
is unreachable — so a deploy that cannot reach its database fails at rollout
rather than going live and serving errors.

---

## 3. Deploying with Docker directly

```bash
docker build -t leafcare-backend .

docker run --rm -p 5000:5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://..." \
  -e DIRECT_URL="postgresql://..." \
  -e PLANTNET_API_KEY="..." \
  -e CORS_ORIGIN="https://your-frontend.example" \
  -e TRUST_PROXY=1 \
  -e AI_SERVICE_URL="https://efficentnet-plant-disease-detection.onrender.com" \
  -e AI_SERVICE_TIMEOUT_MS=90000 \
  leafcare-backend
```

The image is a three-stage build: sources and the TypeScript toolchain stay in
the build stages, and the runtime layer carries only `dist/`, production
dependencies and the generated Prisma client. It runs as the unprivileged
`node` user and binds `0.0.0.0` so it is reachable from outside the container.

`CMD` uses exec form so the process receives `SIGTERM` directly and the graceful
shutdown in `server.ts` runs — shell form would swallow the signal and the
platform would kill the container mid-request.

---

## 4. Database migrations

Migrations are **not** run automatically at boot; a container starting up is the
wrong place to mutate a shared schema, and several replicas starting at once
would race.

```bash
npm run db:status    # what is pending
npm run db:migrate   # prisma migrate deploy — uses DIRECT_URL
```

Run this as a release step before or during rollout. Seeding is separate and
idempotent — every write is an upsert, so re-running converges rather than
duplicating:

```bash
npm run db:seed
```

The seed covers 18 crops and 27 diseases, including every class the disease
model can predict. Without it, a scan returns a label with no guidance attached.

---

## 5. Post-deploy verification

```bash
BASE=https://your-backend.example

curl -s $BASE/api/v1/health   # 200, database.status "up"
curl -s $BASE/api/v1/ready    # 200, required.database up
curl -s $BASE/api/v1/ai/health # 200, status "up" — NOT "not_configured"
curl -s $BASE/api/v1/crops | head -c 200   # 18 crops
```

Then confirm the full pipeline end to end:

```bash
curl -s -X POST $BASE/api/v1/ai/plant-identification -F "image=@leaf.jpg"
```

Expect `plant`, `crop.supported` and `diseaseDetection`. Allow up to 90 seconds
on the first call if the classifier has been idle.

**Check `/api/v1/ai/health` explicitly.** It is the one dependency whose absence
does not raise an error anywhere — the API looks entirely healthy while every
scan silently returns no prediction.

---

## 6. Frontend

The frontend reaches this API only from its own server, never from the browser.
Set in the frontend deployment:

```
LEAFCARE_API_URL=https://your-backend.example
```

It is read server-side only and defaults to `http://localhost:5000`, so if it is
unset in production the frontend will quietly try to call itself and every data
route will fail with a connection error.

Note also that the frontend caches crop and disease responses for one hour, so
newly seeded catalogue data can take that long to appear after a seed.
