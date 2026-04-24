# Scan2Call

Scan2Call is a monorepo for a QR and NFC-based contact platform with a Next.js web app, a NestJS API, and a shared package.

## Stack

- Next.js web app in `apps/web`
- NestJS API in `apps/api`
- Shared types and validation in `packages/shared`
- Prisma schema and migrations in `prisma`
- Docker production files in `docker`

## Requirements

- Node.js 20+
- pnpm 9+
- PostgreSQL

## Local Development

Install dependencies:

```bash
pnpm install
```

Run development servers:

```bash
pnpm dev
```

Useful commands:

```bash
pnpm build
pnpm lint
pnpm test
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## Environment

Use `.env.example` as the starting point for local or production configuration.

## Production

Production Docker assets are in `docker/`.

Primary files:

- `docker/Dockerfile.api`
- `docker/Dockerfile.web`
- `docker/docker-compose.prod.yml`
- `docker/Caddyfile`
- `docker/.env.production.example`

Typical production compose command:

```bash
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.production up -d --build
```

## Repository Structure

```text
apps/
  api/
  web/
packages/
  shared/
prisma/
docker/
```