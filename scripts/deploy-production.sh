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

# An interrupted recreate leaves the old fixed-name container renamed to
# "<hex>_scan2call-<svc>", which then blocks the next deploy with a name
# conflict. Remove any such leftovers before bringing the stack up.
echo "==> Removing stale half-recreated containers (if any)"
stale="$(docker ps -a --format '{{.Names}}' \
  | grep -E '_scan2call-(api|web|caddy|postgres|redis|minio)$' || true)"
if [ -n "$stale" ]; then
  echo "    found: $stale"
  echo "$stale" | xargs -r docker rm -f
fi

echo "==> Building and starting production services"
docker compose "${COMPOSE_ARGS[@]}" up -d --build --remove-orphans postgres api web caddy

echo "==> Running production Prisma migrations"
docker compose "${COMPOSE_ARGS[@]}" run --rm api sh -lc "./node_modules/.bin/prisma migrate deploy"

echo "==> Restarting app services after migrations"
docker compose "${COMPOSE_ARGS[@]}" up -d --build api web caddy

echo "==> Deployment complete"