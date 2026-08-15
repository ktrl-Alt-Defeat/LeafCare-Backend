# syntax=docker/dockerfile:1

# LeafCare backend production image.
#
# Three stages so the shipped image carries neither the TypeScript sources nor
# the build toolchain: `deps` resolves packages, `build` compiles, and `runtime`
# holds only compiled output plus production dependencies.

# ---------------------------------------------------------------- dependencies
FROM node:22-alpine AS deps

# Prisma's query engine is a native binary and needs OpenSSL; without these it
# fails at runtime with a confusing "engine not found" error rather than at build.
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# The schema is copied before `npm ci` because the postinstall hook runs
# `prisma generate`, which reads it.
COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm ci


# ---------------------------------------------------------------------- build
FROM node:22-alpine AS build

RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


# -------------------------------------------------------------------- runtime
FROM node:22-alpine AS runtime

RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY prisma ./prisma

# `--ignore-scripts` skips the postinstall `prisma generate`: the Prisma CLI is a
# devDependency and is absent here. The client generated in `build` is copied in
# below instead, which is both faster and guaranteed to match the build.
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/dist ./dist

# `node` is an unprivileged user that ships with the base image.
USER node

# Documentation only — the platform injects PORT and the app binds to it.
EXPOSE 5000

# Exec form, so the process receives SIGTERM directly and the graceful shutdown
# handler in server.ts runs. The shell form would swallow the signal.
CMD ["node", "dist/server.js"]
