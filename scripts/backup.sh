#!/usr/bin/env bash
# Daily backup script for Vetly on the Hetzner VPS (moltbot).
#
# Artifacts produced under /opt/apps/vetly/backups:
#
#   db-YYYYMMDD-HHMMSS.sql.gz       Gzipped pg_dump of the Vetly database.
#                                   Created every run. Kept for DB_RETENTION_DAYS
#                                   days (default 30).
#
#   uploads-mirror/                 Single rsync mirror of /opt/apps/vetly/uploads.
#                                   Updated every run with rsync --delete so it
#                                   always reflects the current state. Only deltas
#                                   are transferred day-to-day.
#
#   uploads-weekly-YYYYMMDD.tar.gz  Compressed snapshot of the uploads mirror.
#                                   Created only on WEEKLY_SNAPSHOT_DAY (default Sun).
#                                   Kept for WEEKLY_SNAPSHOT_RETENTION_DAYS days
#                                   (default 28 = 4 weekly snapshots).
#
# Intended to be invoked by cron nightly.
#
# Environment variables:
#   BACKUP_DIR                         default /opt/apps/vetly/backups
#   UPLOADS_DIR                        default /opt/apps/vetly/uploads
#   POSTGRES_CONTAINER                 default vetly-postgres
#   POSTGRES_USER                      default vetly
#   POSTGRES_DB                        default vetly
#   DB_RETENTION_DAYS                  default 30
#   WEEKLY_SNAPSHOT_DAY                default 0 (Sun; 0-6 where 0 is Sunday)
#   WEEKLY_SNAPSHOT_RETENTION_DAYS     default 28
#   STORAGE_BOX_TARGET                 e.g. u573928@u573928.your-storagebox.de:vetly/
#   STORAGE_BOX_PORT                   default 23 (Hetzner Storage Box SSH port)
#   STORAGE_BOX_SSH_KEY                default $HOME/.ssh/vetly-backup

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/apps/vetly/backups}"
UPLOADS_DIR="${UPLOADS_DIR:-/opt/apps/vetly/uploads}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-vetly-postgres}"
POSTGRES_USER="${POSTGRES_USER:-vetly}"
POSTGRES_DB="${POSTGRES_DB:-vetly}"
DB_RETENTION_DAYS="${DB_RETENTION_DAYS:-30}"
WEEKLY_SNAPSHOT_DAY="${WEEKLY_SNAPSHOT_DAY:-0}"
WEEKLY_SNAPSHOT_RETENTION_DAYS="${WEEKLY_SNAPSHOT_RETENTION_DAYS:-28}"

STAMP=$(date -u +%Y%m%d-%H%M%S)
DAY_STAMP=$(date -u +%Y%m%d)
TODAY_DOW=$(date -u +%w)

log() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }
fail() { log "ERROR: $*" >&2; exit 1; }

log "vetly backup start"

mkdir -p "$BACKUP_DIR"

# 1. Database dump
DB_FILE="$BACKUP_DIR/db-${STAMP}.sql.gz"
log "pg_dump -> $DB_FILE"
if ! docker exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" 2>/dev/null | gzip > "$DB_FILE"; then
  rm -f "$DB_FILE"
  fail "pg_dump failed"
fi
if [[ ! -s "$DB_FILE" ]]; then
  rm -f "$DB_FILE"
  fail "pg_dump produced an empty file"
fi
DB_SIZE=$(du -h "$DB_FILE" | awk '{print $1}')
log "pg_dump ok ($DB_SIZE)"

# 2. Uploads mirror
UPLOADS_MIRROR="$BACKUP_DIR/uploads-mirror"
if [[ -d "$UPLOADS_DIR" ]]; then
  mkdir -p "$UPLOADS_MIRROR"
  log "rsync uploads -> $UPLOADS_MIRROR (delta transfer)"
  rsync -a --delete "$UPLOADS_DIR/" "$UPLOADS_MIRROR/" || fail "uploads rsync to mirror failed"
  MIRROR_SIZE=$(du -sh "$UPLOADS_MIRROR" 2>/dev/null | awk '{print $1}')
  FILE_COUNT=$(find "$UPLOADS_MIRROR" -type f 2>/dev/null | wc -l)
  log "uploads mirror ok ($MIRROR_SIZE, $FILE_COUNT files)"
else
  log "WARNING: uploads dir $UPLOADS_DIR does not exist, skipping"
fi

# 3. Weekly snapshot
if [[ -d "$UPLOADS_MIRROR" ]] && { [[ "$TODAY_DOW" == "$WEEKLY_SNAPSHOT_DAY" ]] || [[ -n "${FORCE_WEEKLY:-}" ]]; }; then
  SNAP_FILE="$BACKUP_DIR/uploads-weekly-${DAY_STAMP}.tar.gz"
  if [[ -f "$SNAP_FILE" ]]; then
    log "weekly snapshot for $DAY_STAMP already exists, skipping"
  else
    log "weekly snapshot -> $SNAP_FILE"
    tar -C "$BACKUP_DIR" -czf "$SNAP_FILE" uploads-mirror 2>/dev/null || fail "weekly snapshot tar failed"
    SNAP_SIZE=$(du -h "$SNAP_FILE" | awk '{print $1}')
    log "weekly snapshot ok ($SNAP_SIZE)"
  fi
else
  log "not a weekly snapshot day (today dow=$TODAY_DOW, snapshot day=$WEEKLY_SNAPSHOT_DAY), skipping snapshot"
fi

# 4. Retention cleanup
log "retention: delete db-*.sql.gz older than ${DB_RETENTION_DAYS}d"
PRUNED_DB=$(find "$BACKUP_DIR" -maxdepth 1 -name 'db-*.sql.gz' -mtime "+${DB_RETENTION_DAYS}" -print -delete | wc -l)
log "pruned $PRUNED_DB db dumps"

log "retention: delete uploads-weekly-*.tar.gz older than ${WEEKLY_SNAPSHOT_RETENTION_DAYS}d"
PRUNED_WEEKLY=$(find "$BACKUP_DIR" -maxdepth 1 -name 'uploads-weekly-*.tar.gz' -mtime "+${WEEKLY_SNAPSHOT_RETENTION_DAYS}" -print -delete | wc -l)
log "pruned $PRUNED_WEEKLY weekly snapshots"

# 5. Summary
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | awk '{print $1}')
log "backup dir total: $TOTAL_SIZE"

# 6. Off-site rsync hook
if [[ -n "${STORAGE_BOX_TARGET:-}" ]]; then
  SB_PORT="${STORAGE_BOX_PORT:-23}"
  SB_KEY="${STORAGE_BOX_SSH_KEY:-$HOME/.ssh/vetly-backup}"
  log "rsync -> $STORAGE_BOX_TARGET (port $SB_PORT, key $SB_KEY)"
  rsync -a --delete \
    --exclude='backup.log' \
    --exclude='transfer-*.log' \
    --exclude='*.tmp' \
    -e "ssh -i $SB_KEY -p $SB_PORT -oStrictHostKeyChecking=accept-new -oPasswordAuthentication=no" \
    "$BACKUP_DIR/" "$STORAGE_BOX_TARGET" \
    && log "rsync ok" \
    || log "rsync FAILED (continuing)"
fi

log "vetly backup done"
