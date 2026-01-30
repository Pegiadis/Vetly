# Vetly - Architecture & Development Roadmap

## Executive Summary

**Vetly** is a veterinary practice management platform connecting pet owners with veterinary services in Greece.

---

## Current State

### Technology Stack (Backend)
- **Backend**: FastAPI + Python 3.11+
- **Database**: PostgreSQL 17
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Containerization**: Docker

### Existing Features (Frontend - React)
The frontend currently exists as a React prototype with:
- Pet owner UI (dashboard, pet management, appointments)
- Vet UI (dashboard, patient management, scheduling)
- Mock data and basic functionality

---

## Target Architecture

### Technology Stack

#### **Backend**
- **Framework**: FastAPI
- **Database**: PostgreSQL 17
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Containerization**: Docker

#### **Frontend** (Future)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query + Zustand

#### **Infrastructure**
- **Hosting**: Docker containers
- **Database**: PostgreSQL (containerized)
- **Reverse Proxy**: Nginx

---

## Database Schema (PostgreSQL)

### Core Tables

```sql
-- Users (Pet Owners)
users
  - id (UUID, PK)
  - email (VARCHAR, UNIQUE)
  - name (VARCHAR)
  - phone (VARCHAR)
  - address (TEXT)
  - image_url (VARCHAR)
  - email_verified (BOOLEAN)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

-- Veterinarians
vets
  - id (UUID, PK)
  - email (VARCHAR, UNIQUE)
  - name (VARCHAR)
  - specialty (VARCHAR)
  - license_number (VARCHAR, UNIQUE)
  - phone (VARCHAR)
  - address (TEXT)
  - city (VARCHAR)
  - coordinates_lat (DECIMAL)
  - coordinates_lng (DECIMAL)
  - hours (JSONB)
  - description (TEXT)
  - image_url (VARCHAR)
  - is_on_call (BOOLEAN)
  - is_verified (BOOLEAN)
  - rating_average (DECIMAL)
  - reviews_count (INTEGER)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

-- Pets
pets
  - id (UUID, PK)
  - user_id (UUID, FK -> users.id)
  - name (VARCHAR)
  - type (ENUM: 'Dog', 'Cat', 'Other')
  - breed (VARCHAR)
  - age (INTEGER)
  - weight (DECIMAL)
  - gender (ENUM: 'Male', 'Female')
  - chip_number (VARCHAR, UNIQUE, NULLABLE)
  - image_url (VARCHAR)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

-- Medical Events
medical_events
  - id (UUID, PK)
  - pet_id (UUID, FK -> pets.id)
  - vet_id (UUID, FK -> vets.id, NULLABLE)
  - date (DATE)
  - title (VARCHAR)
  - notes (TEXT)
  - event_type (VARCHAR)
  - created_at (TIMESTAMP)

-- Weight History
weight_history
  - id (UUID, PK)
  - pet_id (UUID, FK -> pets.id)
  - weight (DECIMAL)
  - recorded_at (DATE)
  - created_at (TIMESTAMP)

-- Appointments
appointments
  - id (UUID, PK)
  - vet_id (UUID, FK -> vets.id)
  - user_id (UUID, FK -> users.id)
  - pet_id (UUID, FK -> pets.id)
  - scheduled_at (TIMESTAMP)
  - duration_minutes (INTEGER)
  - type (VARCHAR)
  - status (ENUM: 'pending', 'confirmed', 'completed', 'cancelled')
  - notes (TEXT, NULLABLE)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

-- Medications
medications
  - id (UUID, PK)
  - pet_id (UUID, FK -> pets.id)
  - name (VARCHAR)
  - dosage (VARCHAR)
  - frequency (ENUM: 'daily', 'weekly', 'once')
  - time (TIME)
  - start_date (DATE)
  - end_date (DATE, NULLABLE)
  - notes (TEXT)
  - is_active (BOOLEAN)
  - created_at (TIMESTAMP)

-- Reviews
reviews
  - id (UUID, PK)
  - vet_id (UUID, FK -> vets.id)
  - user_id (UUID, FK -> users.id)
  - appointment_id (UUID, FK -> appointments.id, NULLABLE)
  - rating (INTEGER, 1-5)
  - comment (TEXT)
  - reply (TEXT, NULLABLE)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

-- Blog Posts
blog_posts
  - id (UUID, PK)
  - title (VARCHAR)
  - excerpt (TEXT)
  - content (TEXT)
  - author (VARCHAR)
  - author_id (UUID, FK -> vets.id, NULLABLE)
  - image_url (VARCHAR)
  - category (VARCHAR)
  - read_time (VARCHAR)
  - published_at (TIMESTAMP)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

-- Notifications
notifications
  - id (UUID, PK)
  - user_id (UUID, FK -> users.id, NULLABLE)
  - vet_id (UUID, FK -> vets.id, NULLABLE)
  - type (VARCHAR)
  - title (VARCHAR)
  - message (TEXT)
  - is_read (BOOLEAN)
  - created_at (TIMESTAMP)
```

---

## API Structure (FastAPI)

### Planned Endpoints

#### User (Pet Owner)
```
POST   /api/v1/users/profile
GET    /api/v1/users/profile
PUT    /api/v1/users/profile
```

#### Pet Management
```
GET    /api/v1/pets
POST   /api/v1/pets
GET    /api/v1/pets/{pet_id}
PUT    /api/v1/pets/{pet_id}
DELETE /api/v1/pets/{pet_id}
GET    /api/v1/pets/{pet_id}/history
POST   /api/v1/pets/{pet_id}/history
GET    /api/v1/pets/{pet_id}/weight
POST   /api/v1/pets/{pet_id}/weight
```

#### Vet
```
GET    /api/v1/vets
GET    /api/v1/vets/{vet_id}
GET    /api/v1/vets/{vet_id}/reviews
PUT    /api/v1/vets/profile
GET    /api/v1/vets/patients
```

#### Appointments
```
POST   /api/v1/appointments
GET    /api/v1/appointments/{id}
PUT    /api/v1/appointments/{id}
DELETE /api/v1/appointments/{id}
```

#### Medications
```
GET    /api/v1/medications
POST   /api/v1/medications
PUT    /api/v1/medications/{id}
DELETE /api/v1/medications/{id}
```

#### Reviews
```
POST   /api/v1/reviews
GET    /api/v1/reviews/{id}
```

#### Blog
```
GET    /api/v1/blog/posts
GET    /api/v1/blog/posts/{id}
```

#### Notifications
```
GET    /api/v1/notifications
PUT    /api/v1/notifications/{id}/read
```

---

## Development Roadmap

### Phase 1: Database Foundation ✅ COMPLETE
- PostgreSQL setup
- SQLAlchemy models
- Alembic migrations
- Seed data

### Phase 2: Core API
- User endpoints
- Pet CRUD
- Vet profiles
- Basic queries

### Phase 3: Appointments
- Booking system
- Status management
- Notifications

### Phase 4: Additional Features
- Medication tracking
- Reviews system
- Weight history charts

### Phase 5: Frontend
- Next.js setup
- API integration
- User interfaces

---

## Priority Features

| Feature | Priority | Phase |
|---------|----------|-------|
| Database Models | ✅ Complete | 1 |
| Pet Management | High | 2 |
| Vet Profiles | High | 2 |
| Appointments | High | 3 |
| Medications | Medium | 4 |
| Reviews | Medium | 4 |

---

## Technical Considerations

### Performance
- Database indexes on foreign keys
- Pagination for large lists
- Query optimization

### Security
- Input validation
- SQL injection prevention (ORM)
- Data sanitization

### Scalability
- Database connection pooling
- Efficient queries
- Proper indexing

---

## Success Metrics

**User Metrics**:
- Pet profiles created
- Appointments booked
- Active users

**Technical Metrics**:
- API response time < 200ms
- Database query efficiency
- System uptime

---

## Conclusion

This architecture provides a solid, maintainable foundation for Vetly. The focus is on:
- Simple, clean data models
- Efficient database design
- Scalable API structure
- Room for future growth

**Current Status**: Database foundation complete, ready for API development
