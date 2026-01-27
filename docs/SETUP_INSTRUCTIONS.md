# Vetly - PostgreSQL Database Setup Instructions

This guide will help you get the Vetly backend PostgreSQL database up and running.

## 🎯 What's Been Set Up

✅ Docker & Docker Compose configuration
✅ PostgreSQL 15 database container
✅ FastAPI backend with SQLAlchemy 2.0
✅ Complete database models (10 tables)
✅ Alembic migrations system
✅ Database seeding script with test data
✅ Database verification script
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

### Step 3: Create Database Tables

```bash
# Generate initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migration to database
alembic upgrade head
```

You should see output showing all 10 tables being created.

### Step 4: Seed Database with Test Data

```bash
python scripts/seed_data.py
```

This creates:
- 2 test users (Maria and Nikos)
- 3 test veterinarians
- 5 pets
- Medical records, appointments, reviews, and blog posts

### Step 5: Verify Everything Works

```bash
python scripts/verify_db.py
```

You should see all tests pass:

```
✓ Database connection successful
✓ All 10 tables verified
✓ Sample data queries working
✓ Relationships working correctly
```

### Step 6: Start the Backend API

```bash
uvicorn app.main:app --reload
```

Visit http://localhost:8000/api/v1/docs to see the API documentation!

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

## 📚 Project Structure

```
Vetly/
├── docker-compose.yml          # Docker services configuration
├── .dockerignore              # Docker build exclusions
├── vetly-back/                # Backend application
│   ├── app/
│   │   ├── core/              # Core configuration
│   │   │   ├── config.py      # Settings management
│   │   │   ├── deps.py        # FastAPI dependencies
│   │   │   └── exceptions.py  # Custom exceptions
│   │   ├── db/
│   │   │   ├── session.py     # Database session
│   │   │   └── base.py        # Model imports
│   │   ├── models/            # 10 SQLAlchemy models
│   │   └── main.py            # FastAPI app
│   ├── alembic/               # Database migrations
│   ├── scripts/               # Utility scripts
│   │   ├── seed_data.py       # Seed database
│   │   └── verify_db.py       # Verify setup
│   ├── .env                   # Environment variables (create from .env.example)
│   ├── .env.example           # Environment template
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile             # Backend container
└── docs/                      # Documentation
```

## ✅ Verification Checklist

After setup, verify:

- [ ] Docker container is running: `docker ps | grep vetly-postgres`
- [ ] Can connect to database: `python scripts/verify_db.py`
- [ ] All 10 tables exist with data
- [ ] API server starts: `uvicorn app.main:app --reload`
- [ ] API docs accessible: http://localhost:8000/api/v1/docs
- [ ] Health check passes: http://localhost:8000/health

## 🎯 Next Steps

Now that the database is set up:

1. **Add Authentication** (when needed)
2. **Create API Routes** for users, vets, pets
3. **Build Appointment System**
4. **Develop the Frontend**

## 📖 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/en/20/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Docker Documentation](https://docs.docker.com/)

## 🎉 Success!

If all steps completed successfully, you now have:

✅ PostgreSQL database running in Docker
✅ 10 database tables with proper relationships
✅ Sample data for testing
✅ FastAPI backend with database connectivity
✅ Migration system for schema changes

**You're ready to start building the API endpoints!** 🚀
