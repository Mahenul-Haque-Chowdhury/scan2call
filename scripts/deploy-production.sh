#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_ARGS=(
  -f "$ROOT_DIR/docker/docker-compose.yml"
  -f "$ROOT_DIR/docker/docker-compose.prod.yml"
  --env-file "$ROOT_DIR/docker/.env.production"
)

echo "==> Deploying Scan2Call from $ROOT_DIR"

cd "$ROOT_DIR"

echo "==> Building and starting production services"
docker compose "${COMPOSE_ARGS[@]}" up -d --build postgres api web caddy

echo "==> Running production Prisma migrations"
docker compose "${COMPOSE_ARGS[@]}" run --rm api sh -lc "./node_modules/.bin/prisma migrate deploy"

echo "==> Restarting app services after migrations"
docker compose "${COMPOSE_ARGS[@]}" up -d --build api web caddy

echo "==> Deployment complete"