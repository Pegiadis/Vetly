# Vetly - PostgreSQL Database Setup Instructions

This guide will help you get the Vetly backend PostgreSQL database up and running.

## 🎯 What's Been Set Up

✅ Docker & Docker Compose configuration
✅ PostgreSQL 15 database container
✅ FastAPI backend with SQLAlchemy 2.0
✅ Complete database models (11 tables)
✅ Alembic migrations system
✅ Database seeding script with test data
✅ Database verification script
✅ JWT authentication & password hashing
✅ Core configuration files

## 📋 Prerequisites

Before you start, make sure you have:

- **Docker Desktop** installed and running ([Download](https://www.docker.com/products/docker-desktop))
- **Python 3.11+** installed ([Download](https://www.python.org/downloads/))
- **Git** installed

## 🚀 Quick Start (5 Minutes)

### Step 1: Start PostgreSQL Database

```bash
# Navigate to the project root
cd C:\Users\player\Source\portfolio\Vetly

# Start PostgreSQL with Docker
docker-compose up -d postgres
```

Wait for the message "database system is ready to accept connections"

### Step 2: Set Up Python Environment

```bash
# Navigate to backend directory
cd vetly-back

# Copy environment template
copy .env.example .env

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Configure Environment

Edit `vetly-back\.env` and set a secure SECRET_KEY:

```bash
# Generate a secure key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and paste it into `.env`:

```env
SECRET_KEY=your-generated-secret-key-here
DATABASE_URL=postgresql://vetly:vetly_dev_password@localhost:5432/vetly
```

### Step 4: Create Database Tables

```bash
# Generate initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migration to database
alembic upgrade head
```

You should see output showing all 11 tables being created.

### Step 5: Seed Database with Test Data

```bash
python scripts/seed_data.py
```

This creates:
- 2 test users (Maria and Nikos)
- 3 test veterinarians
- 5 pets
- Medical records, appointments, reviews, and blog posts

### Step 6: Verify Everything Works

```bash
python scripts/verify_db.py
```

You should see all tests pass:

```
✓ Database connection successful
✓ All 11 tables verified
✓ Sample data queries working
✓ Relationships working correctly
```

### Step 7: Start the Backend API

```bash
uvicorn app.main:app --reload
```

Visit http://localhost:8000/api/v1/docs to see the API documentation!

## 🎓 Test Credentials

After seeding, you can test with:

**Pet Owners:**
- Email: `maria.papadopoulos@example.com` | Password: `password123`
- Email: `nikos.georgiadis@example.com` | Password: `password123`

**Veterinarians:**
- Email: `dr.antonis.vasilis@vetly.gr` | Password: `vet123`
- Email: `dr.elena.nikolaou@vetly.gr` | Password: `vet123`
- Email: `dr.dimitris.papadakis@vetly.gr` | Password: `vet123`

## 🗄️ Database Schema Overview

The database includes these tables:

1. **users** - Pet owners with profiles
2. **vets** - Veterinarians with specialties and locations
3. **pets** - Pet profiles (Dog, Cat, Other)
4. **medical_events** - Medical history timeline
5. **weight_history** - Weight tracking over time
6. **medications** - Medication schedules and reminders
7. **appointments** - Booking system with statuses
8. **reviews** - Vet ratings and reviews
9. **notifications** - System notifications
10. **blog_posts** - Educational content
11. **sessions** - Authentication sessions

## 🔧 Useful Commands

### Docker

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Stop PostgreSQL
docker-compose down

# View logs
docker logs vetly-postgres

# Connect to database
docker exec -it vetly-postgres psql -U vetly -d vetly
```

### Alembic (Migrations)

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current version
alembic current

# Show history
alembic history
```

### Database Scripts

```bash
# Re-seed database (clears and re-populates)
python scripts/seed_data.py

# Verify database setup
python scripts/verify_db.py
```

### Development Server

```bash
# Start with hot reload
uvicorn app.main:app --reload

# Start on different port
uvicorn app.main:app --reload --port 8001
```

## 🐛 Troubleshooting

### Issue: Port 5432 already in use

**Solution:** Another PostgreSQL instance is running.

```bash
# Windows: Find and stop the process
netstat -ano | findstr :5432
taskkill /PID <PID> /F

# Or use a different port in docker-compose.yml
ports:
  - "5433:5432"  # Change left side to 5433
# Then update DATABASE_URL in .env to use port 5433
```

### Issue: Docker can't start container

**Solution:** Make sure Docker Desktop is running.

```bash
# Restart Docker Desktop, then:
docker-compose down
docker-compose up -d postgres
```

### Issue: Alembic can't connect to database

**Solution:** Check DATABASE_URL in .env matches docker-compose.yml:

```env
DATABASE_URL=postgresql://vetly:vetly_dev_password@localhost:5432/vetly
```

### Issue: Import errors in Python

**Solution:** Make sure you're in the virtual environment:

```bash
# Should show (venv) in prompt
# If not, activate:
.\venv\Scripts\activate

# Then reinstall
pip install -r requirements.txt
```

### Issue: Migration fails with "target database is not empty"

**Solution:** Reset the database:

```bash
# Connect to database
docker exec -it vetly-postgres psql -U vetly -d vetly

# Drop all tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Exit psql
\q

# Run migrations again
alembic upgrade head
```

## 📚 Project Structure

```
Vetly/
├── docker-compose.yml          # Docker services configuration
├── .dockerignore              # Docker build exclusions
├── vetly-back/                # Backend application
│   ├── app/
│   │   ├── core/              # Core configuration
│   │   │   ├── config.py      # Settings management
│   │   │   ├── security.py    # JWT & password hashing
│   │   │   ├── deps.py        # FastAPI dependencies
│   │   │   └── exceptions.py  # Custom exceptions
│   │   ├── db/
│   │   │   ├── session.py     # Database session
│   │   │   └── base.py        # Model imports
│   │   ├── models/            # 11 SQLAlchemy models
│   │   └── main.py            # FastAPI app
│   ├── alembic/               # Database migrations
│   ├── scripts/               # Utility scripts
│   │   ├── seed_data.py       # Seed database
│   │   └── verify_db.py       # Verify setup
│   ├── .env                   # Environment variables (create from .env.example)
│   ├── .env.example           # Environment template
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile             # Backend container
└── SETUP_INSTRUCTIONS.md      # This file
```

## ✅ Verification Checklist

After setup, verify:

- [ ] Docker container is running: `docker ps | grep vetly-postgres`
- [ ] Can connect to database: `python scripts/verify_db.py`
- [ ] All 11 tables exist with data
- [ ] API server starts: `uvicorn app.main:app --reload`
- [ ] API docs accessible: http://localhost:8000/api/v1/docs
- [ ] Health check passes: http://localhost:8000/health

## 🎯 Next Steps

Now that the database is set up:

1. **Phase 1**: Implement authentication endpoints (login, register)
2. **Phase 2**: Create API routes for users and vets
3. **Phase 3**: Add pet management endpoints
4. **Phase 4**: Implement appointment booking system
5. **Phase 5**: Build the Next.js frontend

See `ARCHITECTURE.md` for the complete development roadmap.

## 📖 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/en/20/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Docker Documentation](https://docs.docker.com/)

## 🆘 Need Help?

Check these files:
- `vetly-back/README.md` - Detailed backend documentation
- `ARCHITECTURE.md` - System architecture and design
- `PROJECT_STRUCTURE.md` - Complete project structure guide
- `DEPLOYMENT.md` - Production deployment guide

## 🎉 Success!

If all steps completed successfully, you now have:

✅ PostgreSQL database running in Docker
✅ 11 database tables with proper relationships
✅ Sample data for testing
✅ FastAPI backend with database connectivity
✅ Migration system for schema changes
✅ Authentication system ready

**You're ready to start building the API endpoints!** 🚀
