# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vetly is a veterinary practice management platform for the Greek market. It connects pet owners with veterinarians for appointments, health records, medications, and AI-powered advice. All UI text is in Greek.

## Commands

### Backend (from `vetly-back/`)
```bash
# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Database migrations
alembic revision --autogenerate -m "Description"
alembic upgrade head
alembic downgrade -1

# Tests
pytest                        # all tests
pytest tests/test_foo.py      # single file
pytest tests/test_foo.py::test_bar -v  # single test

# Formatting & linting
black app/
isort app/
mypy app/
```

### Frontend (from `vetly-front/`)
```bash
npm run dev          # dev server on :3000
npm run build        # production build
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier
npm run type-check   # TypeScript check
```

### Docker (from repo root)
```bash
docker-compose up -d          # start all services
docker-compose up -d --build  # rebuild and start
docker-compose down           # stop all
```

## Architecture

### Backend: 4-Layer Pattern (FastAPI + SQLAlchemy 2.0 + PostgreSQL)

```
Model (app/models/) → Repository (app/repositories/) → Service (app/services/) → Endpoint (app/api/v1/endpoints/)
```

- **Models**: SQLAlchemy ORM with UUID PKs, `created_at`/`updated_at` timestamps, JSONB for flexible data (e.g. working hours)
- **Repositories**: Data access layer with query methods, one per model
- **Services**: Business logic. Instantiated per-request with `db: Session` and compose other services/repos internally
- **Endpoints**: Thin FastAPI route handlers. Use `Depends()` for auth and DB session, delegate to services
- **Schemas** (`app/schemas/`): Pydantic v2 models for request/response validation

All endpoints are **synchronous** (`def`, not `async def`). Uses SQLAlchemy 2.0 `select()` syntax.

### Frontend: Next.js 15 App Router + TypeScript + Tailwind CSS

Route groups organize the app:
- `(auth)` - login/register pages
- `(user)` - pet owner dashboard
- `(vet)` - veterinarian dashboard
- `(public)` - public pages (landing, vet directory)

Key data-fetching hooks: `hooks/useVetData.ts` (vet dashboard), `hooks/useOwnerData.ts` (owner dashboard). API calls go through `lib/api.ts` which wraps fetch with auth headers.

Types are in `types/vet.ts` and `types/pet-owner.ts`.

### Authentication

JWT tokens with two user types: `"vet"` and `"pet_owner"`. Backend dependencies `get_current_vet()` and `get_current_pet_owner()` in `app/core/deps.py` handle token validation and user resolution.

### API Structure

All routes under `/api/v1/`. Router assembly in `app/api/v1/router.py`. Main groups:
- `/auth` - login, register
- `/vet/*` - authenticated vet endpoints (patients, appointments, services, reminders, chat, documents, analytics)
- `/owner/*` - authenticated owner endpoints (appointments, reminders, chat, notifications)
- `/public` - no-auth endpoints (vet profiles by slug, search)

### Database

13 models registered in `app/db/base.py`. Migrations via Alembic (`vetly-back/alembic/`). Session factory in `app/db/session.py`. Enums stored as strings. Seed data via `scripts/seed_data.py`.

## Conventions

- **Color scheme**: Teal for pet owner UI, Indigo for vet UI
- **Language**: All frontend user-facing text in Greek
- **Git commits**: No `Co-Authored-By` line. Imperative mood.
- **Backend style**: Synchronous endpoints, SQLAlchemy 2.0 select() pattern, type hints throughout
- **Frontend style**: TypeScript strict mode, Tailwind classes (no CSS modules), native fetch via `lib/api.ts`

## Adding a New Feature (typical flow)

1. **Model**: Add SQLAlchemy model in `app/models/`, register in `app/db/base.py`
2. **Migration**: `alembic revision --autogenerate -m "Add X"` then `alembic upgrade head`
3. **Schema**: Add Pydantic schemas in `app/schemas/`
4. **Repository**: Add data access in `app/repositories/`
5. **Service**: Add business logic in `app/services/`
6. **Endpoint**: Add routes in `app/api/v1/endpoints/`, wire into `app/api/v1/router.py`
7. **Frontend types**: Add to `types/vet.ts` or `types/pet-owner.ts`
8. **Frontend API**: Add calls in `lib/api.ts` and hook functions in `hooks/`
9. **Frontend UI**: Add page/components under appropriate route group

## Environment

- Backend `.env`: `DATABASE_URL`, `SECRET_KEY`, `ALLOWED_ORIGINS`, `GEMINI_API_KEY` (optional)
- Frontend `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`
- Docker exposes: PostgreSQL :5432, Backend :8000, Frontend :3000 (all bound to `127.0.0.1` in production)
- Full list of prod env vars: see `.env.example`

## Deployment

**Convention: app-owned deployment.** This repo owns its compose file, scripts,
and deploy conventions. Server-level concerns (Caddy, monitoring, firewall,
incidents) live in the separate `vps-manager` repo — do not duplicate them here.

### Server layout (moltbot, Hetzner Cloud)

| Path | Purpose |
|------|---------|
| `/home/moltbot/source/Vetly/` | Source checkout — `git pull` updates here |
| `/home/moltbot/source/Vetly/docker-compose.yml` | Canonical prod compose |
| `/home/moltbot/source/Vetly/.env` | Prod secrets (chmod 600) |
| `/home/moltbot/source/Vetly/scripts/` | Deploy + backup scripts |
| `/opt/apps/vetly/uploads/` | Bind-mounted user photos (persists across redeploys) |
| `/opt/apps/vetly/backups/` | DB dumps + uploads snapshots |

There must be **exactly one** compose file on the server. If you see a
`/opt/apps/vetly/docker-compose.yml`, it's a leftover from an older convention
and should be deleted — the one at `/home/moltbot/source/Vetly/` is canonical.

### Deploy

```bash
ssh moltbot 'cd /home/moltbot/source/Vetly && ./scripts/deploy.sh'
```

The script does pre-deploy `pg_dump`, fast-forward pull, `compose build + up -d`,
`alembic upgrade head`, health-check wait, and smoke-tests `https://vetly.gr/health`.
See `scripts/README.md` for flags and rollback.

### Shared infrastructure on moltbot

- **Postgres**: the `vetly-postgres` container currently hosts both Vetly's DB
  and sports-holics' `sportsholics_cms` DB. This coupling is an accident, not a
  design — a future migration will give sports-holics its own Postgres.
  Meanwhile, DO NOT `docker compose down -v` on this stack: it would destroy
  sports-holics' data too.
- **Network**: `vetly_default` is declared with an explicit name in this
  compose. sports-holics joins it via `networks: vetly_default` with
  `external: true`. Keep the name stable.
- **Caddy**: reverse-proxy at `vetly.gr` points to `127.0.0.1:8000` (backend)
  and `127.0.0.1:3000` (frontend). Managed in the `vps-manager` repo.

### Port bindings (production)

All container ports bind to `127.0.0.1` only — never public. Public access
goes through Caddy at `https://vetly.gr`.

| Container | Host port | Container port |
|-----------|-----------|----------------|
| vetly-postgres | 127.0.0.1:5432 | 5432 |
| vetly-backend | 127.0.0.1:8000 | 8000 |
| vetly-frontend | 127.0.0.1:3000 | 3000 |
