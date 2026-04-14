# Operational scripts

Ops scripts for the Vetly deployment on the Hetzner VPS (`moltbot`). Intended
to be run on the VPS itself, from inside the repo at
`/home/moltbot/source/Vetly`.

## What's here

| Script | Purpose | Invocation |
|---|---|---|
| `deploy.sh` | Safe deploy: backup → pull → build → up → migrate → smoke test | `./scripts/deploy.sh` |
| `backup.sh` | Daily DB dump + uploads mirror with retention | cron (nightly) |

## deploy.sh

Performs a safe deploy of the latest commit to the running containers.

What it does, in order:

1. Takes a pre-deploy snapshot of the Vetly DB via `pg_dump`
2. `git fetch` + `git pull --ff-only` (refuses to clobber local edits)
3. Validates `docker-compose.yml`
4. `docker compose build` — only services whose source changed actually rebuild
5. `docker compose up -d` — only services whose config/image changed are recreated
6. Runs `alembic upgrade head` inside `vetly-backend`
7. Waits up to 90s for all three containers to report `healthy`
8. Smoke tests the backend `/health` and frontend root via the public Caddy URL

**What it never touches (data is safe):**

- `/opt/apps/vetly/uploads/` — user-uploaded pet photos (bind mount)
- `/opt/apps/vetly/backups/` — the backups themselves
- `postgres_data` named volume — the Vetly database

### Normal deploy

```bash
./scripts/deploy.sh
```

### Skipping the pre-deploy backup (not recommended)

```bash
./scripts/deploy.sh --no-backup
```

### Deploying the current checkout without pulling (e.g. after a rollback)

```bash
./scripts/deploy.sh --skip-pull
```

### Skipping migrations (e.g. for a no-schema-change deploy)

```bash
./scripts/deploy.sh --skip-migrate
```

### Rollback to the previous commit

```bash
git reset --hard HEAD~1
./scripts/deploy.sh --no-backup --skip-pull
```

### Rollback to a specific commit

```bash
git reset --hard <sha>
./scripts/deploy.sh --no-backup --skip-pull
```

## backup.sh

Produces artifacts under `/opt/apps/vetly/backups`:

- `db-YYYYMMDD-HHMMSS.sql.gz` — gzipped `pg_dump` of the `vetly` database (daily)
- `uploads-mirror/` — rsync mirror of `/opt/apps/vetly/uploads` (updated every run)
- `uploads-weekly-YYYYMMDD.tar.gz` — tarball snapshot of the mirror (Sundays only)

Retention (configurable via env vars at the top of the script):

- DB dumps: 30 days
- Weekly snapshots: 28 days (4 snapshots)

### Install the cron job

```bash
sudo tee /etc/cron.d/vetly-backup > /dev/null <<'EOF'
# Daily Vetly backup at 03:27 UTC
27 3 * * * moltbot /home/moltbot/source/Vetly/scripts/backup.sh >> /var/log/vetly-backup.log 2>&1
EOF
sudo touch /var/log/vetly-backup.log
sudo chown moltbot:moltbot /var/log/vetly-backup.log
```

### Run manually to test

```bash
./scripts/backup.sh
```

### Off-site rsync (optional, recommended)

If `STORAGE_BOX_TARGET` is set in the environment, the script will `rsync` the
backup dir to that target. Intended for Hetzner Storage Box or similar.

Example cron entry with off-site:

```
27 3 * * * moltbot STORAGE_BOX_TARGET=u123456@u123456.your-storagebox.de:vetly/ /home/moltbot/source/Vetly/scripts/backup.sh >> /var/log/vetly-backup.log 2>&1
```

## Things you must NEVER run on this VPS

These commands can destroy data. Avoid them.

| Never run | Why |
|---|---|
| `docker compose down -v` | `-v` deletes named volumes — would wipe Postgres |
| `docker volume rm postgres_data` | Permanent DB loss |
| `docker system prune -a --volumes` | The `--volumes` flag is destructive |
| `rm -rf /opt/apps/vetly/uploads` | Wipes user-uploaded photos |
| `rm -rf /opt/apps/vetly/backups` | Wipes the safety net |
| `git push --force` on shared branches | Loses history, confuses rollbacks |

Plain `docker system prune` (no `--volumes`, no `-a`) is safe.

## Related

Server-level runbook (Caddy, monitoring, firewall, security posture, incidents)
lives in the separate `vps-manager` repo. Do not duplicate that content here.
