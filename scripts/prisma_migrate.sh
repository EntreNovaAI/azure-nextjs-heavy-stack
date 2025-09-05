#!/usr/bin/env bash
set -euo pipefail
export DATABASE_URL=${DATABASE_URL:-""}
if [ -z "$DATABASE_URL" ]; then
  echo "Set DATABASE_URL first (local .env or export)"; exit 1
fi
pnpm prisma generate
pnpm prisma migrate deploy
