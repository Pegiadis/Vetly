#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/vetly_${TIMESTAMP}.sql.gz"

# Check if postgres container is running
if ! docker ps --format '{{.Names}}' | grep -q vetly-postgres; then
    echo "ERROR: vetly-postgres container is not running"
    exit 1
fi

# Dump and compress
echo "Backing up database to $BACKUP_FILE..."
docker exec vetly-postgres pg_dump -U vetly vetly | gzip > "$BACKUP_FILE"

# Verify backup
if [ -s "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Backup complete: $BACKUP_FILE ($SIZE)"
else
    echo "ERROR: Backup file is empty"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Prune old backups
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "Pruned $DELETED backup(s) older than ${RETENTION_DAYS} days"
fi
