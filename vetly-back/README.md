# Vetly Backend API

FastAPI backend for the Vetly veterinary care platform.

## Features

- ✅ PostgreSQL database with SQLAlchemy 2.0 ORM
- ✅ Alembic database migrations
- ✅ Docker & Docker Compose configuration
- ✅ Complete database models (10 tables)
- ✅ Seed data script for development
- ✅ Database verification script
- ✅ Clean, simple architecture

## Technology Stack

- **Framework**: FastAPI 0.110
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Validation**: Pydantic 2.6
- **Server**: Uvicorn

## Project Structure

```
vetly-back/
├── alembic/              # Database migrations
│   ├── versions/         # Migration files
│   └── env.py           # Migration environment
├── app/
│   ├── api/             # API routes
│   ├── core/            # Core configuration
│   │   ├── config.py    # Settings
│   │   ├── deps.py      # FastAPI dependencies
│   │   └── exceptions.py # Custom exceptions
│   ├── db/              # Database configuration
│   │   ├── session.py   # SQLAlchemy session
│   │   └── base.py      # Import all models
│   ├── models/          # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── vet.py
│   │   ├── pet.py
│   │   ├── medical_event.py
│   │   ├── weight_history.py
│   │   ├── medication.py
│   │   ├── appointment.py
│   │   ├── review.py
│   │   ├── notification.py
│   │   └── blog_post.py
│   ├── repositories/    # Data access layer (future)
│   ├── schemas/         # Pydantic schemas (future)
│   ├── services/        # Business logic (future)
│   └── main.py          # Application entry point
├── scripts/             # Utility scripts
│   ├── seed_data.py     # Database seeding
│   ├── verify_db.py     # Database verification
│   └── quick_test.py    # Quick connection test
└── tests/               # Test suite
```

## Database Schema

The application uses 10 tables:

- **users** - Pet owners (no passwords for now)
- **vets** - Veterinarians (no passwords for now)
- **pets** - Pet profiles
- **medical_events** - Medical history
- **weight_history** - Weight tracking
- **medications** - Medication schedules
- **appointments** - Booking system
- **reviews** - Vet reviews
- **notifications** - System notifications
- **blog_posts** - Educational content

## Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- Git

### 1. Clone & Setup

```bash
cd vetly-back
cp .env.example .env
```

### 2. Start PostgreSQL with Docker

```bash
# From the root Vetly directory
docker-compose up -d postgres
```

This will start PostgreSQL on port 5432.

### 3. Install Dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Run Migrations

```bash
# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head
```

### 5. Seed Database (Optional)

```bash
python scripts/seed_data.py
```

This creates:
- 2 test users (pet owners)
- 3 test veterinarians
- 5 pets
- Sample appointments, medical records, reviews, and blog posts

### 6. Verify Setup

```bash
python scripts/verify_db.py
```

Should output:
```
✓ Database connection successful
✓ All 10 tables verified
✓ Sample data queries working
✓ Relationships working correctly
```

### 7. Start API Server

```bash
uvicorn app.main:app --reload
```

API will be available at:
- **API Root**: http://localhost:8000/api/v1
- **API Docs (Swagger)**: http://localhost:8000/api/v1/docs
- **API Docs (ReDoc)**: http://localhost:8000/api/v1/redoc
- **Health Check**: http://localhost:8000/health

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Project
PROJECT_NAME=Vetly API
VERSION=1.0.0
ENVIRONMENT=development
API_V1_STR=/api/v1

# Database
DATABASE_URL=postgresql://vetly:vetly_dev_password@localhost:5432/vetly

# CORS
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:8000"]
```

## Development Commands

### Database Migrations

```bash
# Create new migration after model changes
alembic revision --autogenerate -m "Description of changes"

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View current migration version
alembic current

# View migration history
alembic history
```

### Database Management

```bash
# Re-seed database (clears existing data)
python scripts/seed_data.py

# Verify database setup
python scripts/verify_db.py

# Quick connection test
python scripts/quick_test.py

# Connect to PostgreSQL with psql
docker exec -it vetly-postgres psql -U vetly -d vetly
```

### Docker Commands

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Stop PostgreSQL
docker-compose down

# View PostgreSQL logs
docker logs vetly-postgres

# Follow PostgreSQL logs
docker logs -f vetly-postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Development Server

```bash
# Start with auto-reload
uvicorn app.main:app --reload

# Start on specific port
uvicorn app.main:app --reload --port 8001

# Start with custom host
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_database.py

# Run with verbose output
pytest -v
```

## Troubleshooting

### Port 5432 Already in Use

```bash
# Windows: Find process
netstat -ano | findstr :5432
taskkill /PID <PID> /F

# Linux/Mac: Find and kill process
lsof -i :5432
kill -9 <PID>

# Or use different port in docker-compose.yml
```

### Cannot Connect to Database

```bash
# Check if PostgreSQL is running
docker ps | grep vetly-postgres

# Check PostgreSQL logs
docker logs vetly-postgres

# Verify DATABASE_URL in .env matches docker-compose.yml
```

### Migration Errors

```bash
# Reset database (WARNING: deletes all data)
docker exec -it vetly-postgres psql -U vetly -d vetly -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migrations
alembic upgrade head

# Re-seed data
python scripts/seed_data.py
```

### Import Errors

```bash
# Make sure virtual environment is activated
# You should see (venv) in your terminal

# Reinstall dependencies
pip install -r requirements.txt --upgrade
```

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc

## Sample Data

After running `seed_data.py`, you'll have:

- **2 Pet Owners**:
  - maria.papadopoulos@example.com
  - nikos.georgiadis@example.com

- **3 Veterinarians**:
  - dr.antonis.vasilis@vetly.gr (General Practice)
  - dr.elena.nikolaou@vetly.gr (Surgery)
  - dr.dimitris.papadakis@vetly.gr (Emergency - 24/7)

- **5 Pets** (3 dogs, 2 cats)
- **Medical Events** and **Weight History**
- **Active Medications**
- **Appointments** (past, today, upcoming)
- **Reviews** with ratings
- **Blog Posts**

## Next Steps

Now that the database is set up:

1. **Add Authentication** (when needed)
2. **Build API Endpoints** for CRUD operations
3. **Add Business Logic** in services layer
4. **Create Pydantic Schemas** for validation
5. **Implement Repositories** for data access

## Documentation

- [Database Setup Complete](../docs/DATABASE_SETUP_COMPLETE.md)
- [Setup Instructions](../docs/SETUP_INSTRUCTIONS.md)
- [Architecture](../docs/ARCHITECTURE.md)
- [Deployment Guide](../docs/DEPLOYMENT.md)

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review logs: `docker logs vetly-postgres`
3. Run verification script: `python scripts/verify_db.py`

---

**Status**: ✅ Database layer complete, ready for API development
**Last Updated**: January 27, 2026
