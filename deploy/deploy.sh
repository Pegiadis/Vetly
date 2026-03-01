#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.prod.yml"
BACKUP_DIR="$SCRIPT_DIR/backups"

echo "=== Vetly Deployment ==="
echo "Project: $PROJECT_DIR"
echo ""

# Check .env exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "ERROR: deploy/.env not found. Copy .env.production.example to .env and fill in values."
    exit 1
fi

# Load env vars
set -a
source "$SCRIPT_DIR/.env"
set +a

# Pull latest code
echo "[1/6] Pulling latest code..."
cd "$PROJECT_DIR"
git pull origin main

# Backup database (skip if postgres isn't running)
echo "[2/6] Backing up database..."
if docker ps --format '{{.Names}}' | grep -q vetly-postgres; then
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/vetly_pre_deploy_$(date +%Y%m%d_%H%M%S).sql.gz"
    docker exec vetly-postgres pg_dump -U vetly vetly | gzip > "$BACKUP_FILE"
    echo "  Backup saved to $BACKUP_FILE"
else
    echo "  Skipping backup (database not running)"
fi

# Build images
echo "[3/6] Building Docker images..."
docker compose -f "$COMPOSE_FILE" --env-file "$SCRIPT_DIR/.env" build

# Run migrations
echo "[4/6] Running database migrations..."
docker compose -f "$COMPOSE_FILE" --env-file "$SCRIPT_DIR/.env" up -d postgres
sleep 5
docker compose -f "$COMPOSE_FILE" --env-file "$SCRIPT_DIR/.env" run --rm backend alembic upgrade head

# Restart all services
echo "[5/6] Starting services..."
docker compose -f "$COMPOSE_FILE" --env-file "$SCRIPT_DIR/.env" up -d

# Health check
echo "[6/6] Verifying deployment..."
echo "  Waiting for services to start..."
sleep 10

HEALTH_URL="http://localhost:8000/health"
if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
    echo "  Backend health check: OK"
else
    echo "  WARNING: Backend health check failed. Check logs with:"
    echo "    docker compose -f $COMPOSE_FILE logs backend"
fi

if curl -sf "http://localhost:3000" > /dev/null 2>&1; then
    echo "  Frontend health check: OK"
else
    echo "  WARNING: Frontend health check failed. Check logs with:"
    echo "    docker compose -f $COMPOSE_FILE logs frontend"
fi

# Prune old images
echo ""
echo "Pruning unused Docker images..."
docker image prune -f

# Prune old backups (keep last 30 days)
if [ -d "$BACKUP_DIR" ]; then
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete 2>/dev/null || true
fi

echo ""
echo "=== Deployment complete ==="
docker compose -f "$COMPOSE_FILE" ps
