# Vetly Backend API

FastAPI backend for the Vetly veterinary care platform.

## Features

- ✅ PostgreSQL database with SQLAlchemy 2.0 ORM
- ✅ Alembic database migrations
- ✅ JWT authentication with bcrypt password hashing
- ✅ Docker & Docker Compose configuration
- ✅ Complete database models (11 tables)
- ✅ Seed data script for development
- ✅ Database verification script

## Technology Stack

- **Framework**: FastAPI 0.110
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Authentication**: JWT (python-jose) + bcrypt (passlib)
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
│   │   ├── security.py  # JWT & password hashing
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
│   │   ├── blog_post.py
│   │   └── session.py
│   ├── repositories/    # Data access layer
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   └── main.py          # Application entry point
├── scripts/             # Utility scripts
│   ├── seed_data.py     # Database seeding
│   └── verify_db.py     # Database verification
└── tests/               # Test suite
```

## Database Schema

The application uses 11 tables:

- **users** - Pet owners
- **vets** - Veterinarians
- **pets** - Pet profiles
- **medical_events** - Medical history
- **weight_history** - Weight tracking
- **medications** - Medication schedules
- **appointments** - Booking system
- **reviews** - Vet reviews
- **notifications** - System notifications
- **blog_posts** - Educational content
- **sessions** - Authentication sessions

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

Edit `.env` and set your `SECRET_KEY`:
```bash
# Generate a secure secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
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

### 7. Start Development Server

```bash
uvicorn app.main:app --reload
```

The API will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## Using Docker (Full Stack)

To run both the database and backend in Docker:

```bash
# From root directory
docker-compose up --build
```

This starts:
- PostgreSQL on port 5432
- Backend API on port 8000

## Test Credentials

After running the seed script:

**Pet Owners:**
- Email: `maria.papadopoulos@example.com`
- Email: `nikos.georgiadis@example.com`
- Password: `password123`

**Veterinarians:**
- Email: `dr.antonis.vasilis@vetly.gr`
- Email: `dr.elena.nikolaou@vetly.gr`
- Email: `dr.dimitris.papadakis@vetly.gr`
- Password: `vet123`

## Development Commands

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current migration
alembic current

# Show migration history
alembic history
```

### Database Management

```bash
# Seed database
python scripts/seed_data.py

# Verify database
python scripts/verify_db.py
```

### Running Tests

```bash
pytest
pytest --cov=app tests/
```

### Code Quality

```bash
# Format code
black app/
isort app/

# Lint
flake8 app/
pylint app/

# Type checking
mypy app/
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc

## Environment Variables

Key environment variables (see `.env.example`):

```env
# Security
SECRET_KEY=your-secret-key-here-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database
DATABASE_URL=postgresql://vetly:password@localhost:5432/vetly

# CORS
ALLOWED_ORIGINS=["http://localhost:3000"]
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker logs vetly-postgres

# Connect to database
docker exec -it vetly-postgres psql -U vetly -d vetly
```

### Migration Issues

```bash
# Reset database (WARNING: destroys all data)
alembic downgrade base
alembic upgrade head
```

### Port Already in Use

```bash
# Find process using port 8000
netstat -ano | findstr :8000  # Windows
lsof -i :8000                  # Linux/Mac

# Kill the process
taskkill /PID <PID> /F         # Windows
kill -9 <PID>                  # Linux/Mac
```

## Next Steps

1. ✅ Database setup complete
2. ⏭️ Implement authentication endpoints
3. ⏭️ Create API routes for users and vets
4. ⏭️ Add pet management endpoints
5. ⏭️ Implement appointment booking system

See `ARCHITECTURE.md` in the root directory for the complete development roadmap.

## License

Proprietary - Vetly Platform
