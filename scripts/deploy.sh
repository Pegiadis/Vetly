#!/usr/bin/env bash
# Safe deploy script for Vetly on the Hetzner VPS (moltbot).
#
# What it does, in order:
#   1. pg_dump the Vetly DB to a pre-deploy snapshot under /opt/apps/vetly/backups
#   2. git fetch + git pull --ff-only on the current branch (refuses to clobber local edits)
#   3. validate docker-compose.yml with `docker compose config --quiet`
#   4. docker compose build   (only services whose source changed actually rebuild)
#   5. docker compose up -d   (only services whose config/image changed are recreated)
#   6. run alembic migrations (alembic upgrade head) inside vetly-backend
#   7. wait up to 90s for all three containers to report healthy
#   8. smoke test backend /health + frontend root via the public Caddy URL
#
# What it does NOT touch (data is safe):
#   - /opt/apps/vetly/uploads/          (pet photos, bind mount)
#   - /opt/apps/vetly/backups/          (backups, plain host dir)
#   - postgres_data named volume        (Vetly DB)
#
# Usage:
#   ./scripts/deploy.sh                     # normal deploy (backup + pull + build + up + migrate + verify)
#   ./scripts/deploy.sh --no-backup         # skip the pre-deploy DB backup (not recommended)
#   ./scripts/deploy.sh --skip-pull         # don't git pull; just rebuild from current checkout
#   ./scripts/deploy.sh --skip-migrate      # don't run alembic upgrade
#
# Rollback to the previous commit:
#   git reset --hard HEAD~1 && ./scripts/deploy.sh --no-backup --skip-pull

set -euo pipefail

cd "$(dirname "$0")/.."

BACKUP_DIR="/opt/apps/vetly/backups"
POSTGRES_CONTAINER="vetly-postgres"
POSTGRES_USER="vetly"
POSTGRES_DB="vetly"
BACKEND_CONTAINER="vetly-backend"
PUBLIC_URL="https://vetly.gr"
STAMP=$(date -u +%Y%m%d-%H%M%S)

SKIP_BACKUP=false
SKIP_PULL=false
SKIP_MIGRATE=false
for arg in "$@"; do
  case "$arg" in
    --no-backup)    SKIP_BACKUP=true ;;
    --skip-pull)    SKIP_PULL=true ;;
    --skip-migrate) SKIP_MIGRATE=true ;;
    -h|--help)
      sed -n '2,25p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown arg: $arg" >&2
      echo "Usage: $0 [--no-backup] [--skip-pull] [--skip-migrate]" >&2
      exit 1
      ;;
  esac
done

say() { printf '\n\033[1;34m==>\033[0m \033[1m%s\033[0m\n' "$*"; }
ok()  { printf '  \033[32mok\033[0m  %s\n' "$*"; }
bad() { printf '  \033[31mERR\033[0m %s\n' "$*" >&2; }

fail() {
  bad "$1"
  echo
  echo "Deploy aborted. Data is untouched. Current containers:"
  docker ps --filter name=vetly --format "  {{.Names}}  {{.Status}}"
  echo
  echo "To see logs:  docker logs vetly-backend --tail 100"
  echo "              docker logs vetly-frontend --tail 100"
  exit 1
}

# 1. Pre-deploy DB backup
if [[ "$SKIP_BACKUP" = false ]]; then
  say "Pre-deploy DB backup"
  mkdir -p "$BACKUP_DIR"
  BACKUP_FILE="$BACKUP_DIR/db-predeploy-${STAMP}.sql.gz"
  docker exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" 2>/dev/null \
    | gzip > "$BACKUP_FILE" \
    || fail "pg_dump failed"
  SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
  ok "Saved: $BACKUP_FILE ($SIZE)"
else
  say "Skipping pre-deploy backup (--no-backup)"
fi

# 2. Fetch + fast-forward pull
if [[ "$SKIP_PULL" = false ]]; then
  say "Fetch + fast-forward pull"
  git fetch --quiet origin
  BRANCH=$(git branch --show-current)
  BEFORE=$(git rev-parse HEAD)
  git pull --ff-only origin "$BRANCH" || fail "git pull failed (non-ff? local edits?)"
  AFTER=$(git rev-parse HEAD)
  if [[ "$BEFORE" = "$AFTER" ]]; then
    ok "Already up to date"
  else
    ok "Advanced $BEFORE → $AFTER"
    git --no-pager log --oneline "$BEFORE..$AFTER" | sed 's/^/     /'
  fi
else
  say "Skipping git pull (--skip-pull)"
fi

# 3. Validate compose
say "Validate docker-compose.yml"
docker compose config --quiet || fail "compose file invalid"
ok "syntax valid"

# 4. Build
say "docker compose build"
docker compose build || fail "build failed"
ok "images built"

# 5. Up
say "docker compose up -d"
docker compose up -d || fail "compose up failed"
ok "containers up"

# 6. Migrations
if [[ "$SKIP_MIGRATE" = false ]]; then
  say "Run alembic migrations"
  # Wait briefly for backend to be responsive before running migrations
  for i in $(seq 1 12); do
    if docker exec "$BACKEND_CONTAINER" alembic current >/dev/null 2>&1; then
      break
    fi
    sleep 5
    [[ $i -eq 12 ]] && fail "backend not responsive after 60s"
  done
  docker exec "$BACKEND_CONTAINER" alembic upgrade head || fail "alembic upgrade failed"
  ok "migrations applied"
else
  say "Skipping alembic upgrade (--skip-migrate)"
fi

# 7. Wait for health
say "Waiting for healthchecks (up to 90s)"
for i in $(seq 1 18); do
  sleep 5
  HEALTHY=$(docker ps --filter name=vetly --format '{{.Status}}' | grep -c 'healthy' || true)
  if [[ "$HEALTHY" -eq 3 ]]; then
    ok "all three containers healthy"
    break
  fi
  if [[ $i -eq 18 ]]; then
    fail "containers did not all become healthy in 90s"
  fi
done

# 8. Smoke test
say "Smoke test"
BACKEND_CODE=$(curl -s -o /dev/null -w '%{http_code}' "$PUBLIC_URL/health" || echo "000")
[[ "$BACKEND_CODE" = "200" ]] && ok "backend /health returns 200" || fail "backend /health returns $BACKEND_CODE"

FRONTEND_CODE=$(curl -s -o /dev/null -w '%{http_code}' "$PUBLIC_URL/" || echo "000")
[[ "$FRONTEND_CODE" = "200" ]] && ok "frontend returns 200" || fail "frontend returns $FRONTEND_CODE"

say "Deploy successful"
printf '\nDeployed commit: %s\n\n' "$(git log -1 --oneline)"
