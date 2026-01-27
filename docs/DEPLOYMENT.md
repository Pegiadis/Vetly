# Vetly - Deployment Guide

## Overview

This guide covers deploying the Vetly application using Docker.

---

## Local Development Deployment

### Prerequisites
- Docker Desktop installed
- Git
- Python 3.11+

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd Vetly

# Start PostgreSQL
docker-compose up -d postgres

# Set up backend
cd vetly-back
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt

# Configure environment
copy .env.example .env

# Run migrations
alembic upgrade head

# Seed database
python scripts/seed_data.py

# Start API
uvicorn app.main:app --reload
```

Visit http://localhost:8000/api/v1/docs

---

## Docker Configuration

### docker-compose.yml

The project includes a `docker-compose.yml` for running PostgreSQL:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: vetly-postgres
    environment:
      POSTGRES_DB: vetly
      POSTGRES_USER: vetly
      POSTGRES_PASSWORD: ${DB_PASSWORD:-vetly_dev_password}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vetly -d vetly"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### Environment Variables

Create `.env` file in `vetly-back/`:

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

---

## Production Deployment (Future)

### Basic Production Setup

1. **Server Requirements**
   - Linux server (Ubuntu 22.04 recommended)
   - Docker installed
   - 2GB RAM minimum
   - 20GB storage

2. **Security Considerations**
   - Change database passwords
   - Use environment variables
   - Enable HTTPS
   - Set up firewall rules

3. **Database Backups**
   - Regular PostgreSQL backups
   - Store backups securely
   - Test restore procedures

---

## Monitoring

### Health Check

The API includes a health check endpoint:

```bash
curl http://localhost:8000/health
```

### Database Status

```bash
# Check if PostgreSQL is running
docker ps | grep vetly-postgres

# View PostgreSQL logs
docker logs vetly-postgres

# Connect to database
docker exec -it vetly-postgres psql -U vetly -d vetly
```

---

## Troubleshooting

### Container Issues

```bash
# Stop all containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build
```

### Database Connection Issues

```bash
# Check database is ready
docker exec vetly-postgres pg_isready -U vetly

# Check connection from Python
python scripts/verify_db.py
```

---

## Backup and Restore

### Backup Database

```bash
# Create backup
docker exec vetly-postgres pg_dump -U vetly vetly > backup.sql

# Or with timestamp
docker exec vetly-postgres pg_dump -U vetly vetly > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

```bash
# Restore from backup
docker exec -i vetly-postgres psql -U vetly vetly < backup.sql
```

---

## Update Procedures

### Updating Database Schema

```bash
# After model changes
cd vetly-back

# Create migration
alembic revision --autogenerate -m "Description of changes"

# Review migration file in alembic/versions/

# Apply migration
alembic upgrade head
```

### Updating Dependencies

```bash
# Update requirements.txt
pip install <package>
pip freeze > requirements.txt

# Reinstall in production
pip install -r requirements.txt --upgrade
```

---

## Maintenance

### Regular Tasks

1. **Daily**
   - Monitor application logs
   - Check API health endpoint

2. **Weekly**
   - Review database performance
   - Check disk space

3. **Monthly**
   - Update dependencies
   - Review and archive old logs
   - Test backup restore

---

## Support

For issues:
1. Check logs: `docker logs vetly-postgres`
2. Review documentation in `/docs`
3. Check database with verification script

---

*Last updated: January 27, 2026*
