# Vetly - Veterinary Care Platform

<div align="center">
  <h3>🐾 Connecting Pet Owners with Veterinary Services in Greece 🇬🇷</h3>
  <p>A comprehensive platform for managing veterinary appointments, pet health records, and connecting pet owners with veterinary professionals.</p>
</div>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Development](#development)
- [Documentation](#documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 About

**Vetly** is a modern veterinary practice management platform designed to streamline the connection between pet owners and veterinary professionals. The platform provides comprehensive tools for:

- **Pet Owners**: Manage pet health records, book appointments, track medications, and get AI-powered pet health advice
- **Veterinarians**: Manage patients, appointments, schedules, and provide quality care with digital tools

**Target Market**: Greece (initially), with plans for international expansion

---

## ✨ Features

### For Pet Owners
- 🐕 **Pet Management** - Complete digital pet profiles with medical history
- 📅 **Appointment Booking** - Easy scheduling with veterinarians
- 💊 **Medication Tracking** - Reminders and medication schedules
- 📊 **Health Analytics** - Weight tracking and health trends
- 🤖 **AI Assistant** - Get instant answers to pet health questions
- 📱 **Mobile Responsive** - Access from any device

### For Veterinarians
- 👥 **Patient Management** - Digital patient records and history
- 📆 **Schedule Management** - Manage appointments and availability
- 📈 **Analytics Dashboard** - Business insights and trends
- ⭐ **Review System** - Build reputation with client reviews
- 🔔 **Real-time Notifications** - Stay updated on appointments
- 💼 **Practice Tools** - Everything needed to run a modern practice

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Charts**: [Recharts](https://recharts.org/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Language**: Python 3.11+
- **Package Manager**: [uv](https://github.com/astral-sh/uv)
- **Database**: PostgreSQL 15+
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Cache**: Redis
- **Task Queue**: Celery
- **AI**: Google Gemini API

### DevOps
- **Hosting**: Hetzner VPS
- **Containerization**: Docker + Docker Compose
- **Deployment**: [Coolify](https://coolify.io/)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry
- **SSL**: Let's Encrypt

---

## 📁 Project Structure

```
Vetly/
├── vetly-front/              # Next.js frontend application
│   ├── app/                  # Next.js App Router
│   │   ├── (public)/         # Public pages (landing, blog, vet directory)
│   │   ├── (auth)/           # Authentication pages (login, register)
│   │   ├── (user)/           # Pet owner dashboard and features
│   │   ├── (vet)/            # Veterinary dashboard and tools
│   │   └── api/              # Next.js API routes
│   ├── components/           # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── features/         # Feature-specific components
│   │   └── shared/           # Shared components
│   ├── lib/                  # Utilities and helpers
│   │   ├── api/              # API client and services
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Utility functions
│   │   └── validations/      # Zod schemas
│   ├── stores/               # Zustand state stores
│   └── types/                # TypeScript type definitions
│
├── vetly-back/               # FastAPI backend application
│   ├── app/
│   │   ├── api/v1/           # API routes and endpoints
│   │   ├── core/             # Core configuration and security
│   │   ├── models/           # SQLAlchemy database models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── services/         # Business logic layer
│   │   ├── repositories/     # Data access layer
│   │   ├── db/               # Database configuration
│   │   └── main.py           # FastAPI application entry
│   ├── alembic/              # Database migrations
│   ├── tests/                # Test suite
│   └── scripts/              # Utility scripts
│
├── vetly-landing-page/       # Marketing landing page (Next.js)
├── vetly/                    # AI Studio prototype (reference only)
│
├── .claude/                  # Claude Code configuration
├── ARCHITECTURE.md           # System architecture documentation
├── FEATURE_ROADMAP.md        # Development roadmap
├── DEPLOYMENT.md             # Deployment guide (Hetzner + Coolify)
├── PROJECT_STRUCTURE.md      # Detailed structure guide
└── README.md                 # This file
```

### Directory Purposes

| Directory | Purpose |
|-----------|---------|
| `vetly-front/` | Main frontend application for production |
| `vetly-back/` | Main backend API for production |
| `vetly-landing-page/` | Public-facing marketing website |
| `vetly/` | Original AI Studio prototype (for reference) |
| `.claude/` | Claude Code AI agent configuration |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### For Frontend Development
- **Node.js** 20+ ([Download](https://nodejs.org/))
- **npm** or **pnpm** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### For Backend Development
- **Python** 3.11+ ([Download](https://www.python.org/))
- **uv** package manager ([Install](https://github.com/astral-sh/uv))
  ```bash
  # Install uv
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/))
- **Redis** ([Download](https://redis.io/))

### Optional (for full local development)
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/))

---

## 🚀 Getting Started

### Clone the Repository

```bash
git clone https://github.com/your-username/Vetly.git
cd Vetly
```

---

## 🔧 Backend Setup

### 1. Navigate to Backend Directory

```bash
cd vetly-back
```

### 2. Install Python Dependencies with uv

```bash
# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -r pyproject.toml
```

Or install manually:

```bash
uv pip install fastapi uvicorn sqlalchemy alembic psycopg2-binary pydantic pydantic-settings python-jose passlib redis celery
```

### 3. Set Up Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://vetly:password@localhost:5432/vetly

# Redis
REDIS_URL=redis://:password@localhost:6379

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
ALLOWED_ORIGINS=["http://localhost:3000"]

# AI (optional)
GEMINI_API_KEY=your-gemini-api-key-here

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 4. Set Up PostgreSQL Database

#### Option A: Using Docker (Recommended)

```bash
docker run --name vetly-postgres \
  -e POSTGRES_USER=vetly \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=vetly \
  -p 5432:5432 \
  -d postgres:15-alpine
```

#### Option B: Local PostgreSQL Installation

```bash
# Create database
createdb vetly

# Or using psql
psql -U postgres
CREATE DATABASE vetly;
CREATE USER vetly WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE vetly TO vetly;
\q
```

### 5. Run Database Migrations

```bash
# Initialize Alembic (first time only)
alembic init alembic

# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Run migrations
alembic upgrade head
```

### 6. (Optional) Seed Sample Data

```bash
python scripts/seed_data.py
```

### 7. Start the Backend Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at:
- **API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc

---

## 💻 Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd vetly-front
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Set Up Environment Variables

Create `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Environment
NODE_ENV=development

# Optional: Sentry (for error tracking)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### 4. Start the Development Server

```bash
npm run dev
# or
pnpm dev
```

Frontend will be available at:
- **App**: http://localhost:3000

### 5. Build for Production

```bash
npm run build
npm run start
```

---

## 🐳 Docker Setup (Alternative)

### Using Docker Compose for Full Stack

Create `docker-compose.yml` in the root directory:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## 🔨 Development

### Running Tests

#### Backend Tests
```bash
cd vetly-back
pytest
pytest --cov=app tests/  # With coverage
```

#### Frontend Tests
```bash
cd vetly-front
npm run test
npm run test:watch
```

### Code Quality

#### Backend
```bash
# Format code
black app/
isort app/

# Lint
mypy app/
```

#### Frontend
```bash
# Format code
npm run format

# Lint
npm run lint
npm run lint:fix

# Type check
npm run type-check
```

### Database Management

```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# View migration history
alembic history
```

---

## 📚 Documentation

Comprehensive documentation is available in the following files:

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Complete system architecture, database schema, API design |
| [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) | Development roadmap with prioritized features |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Detailed project structure and code examples |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment guide for Hetzner VPS with Coolify |

### Quick Links

- **API Documentation**: http://localhost:8000/docs (when backend is running)
- **Database Schema**: See [ARCHITECTURE.md](./ARCHITECTURE.md#database-schema-postgresql)
- **API Endpoints**: See [ARCHITECTURE.md](./ARCHITECTURE.md#api-structure-fastapi)
- **Development Phases**: See [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md)

---

## 🚢 Deployment

The application is designed to be deployed on **Hetzner VPS** using **Docker** and **Coolify**.

### Quick Deployment Steps

1. **Provision Hetzner VPS** (CX31 or higher recommended)
2. **Install Coolify** on the server
3. **Configure PostgreSQL and Redis** via Coolify
4. **Deploy Backend and Frontend** via Coolify
5. **Configure SSL certificates** (Let's Encrypt)
6. **Set up automated backups**

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Estimated Monthly Cost
- **Hetzner VPS CX31**: €11/month
- **Storage Box (100GB)**: €3.81/month
- **Total**: ~€15-20/month

---

## 🗺️ Development Roadmap

### Phase 1: Core Infrastructure (Weeks 1-2)
- ✅ Authentication system
- ✅ Database setup
- ✅ Basic API structure

### Phase 2: Pet Management (Weeks 3-4)
- Pet CRUD operations
- Medical history tracking
- Weight tracking charts

### Phase 3: Vet Directory & Booking (Weeks 5-6)
- Vet search and filtering
- Appointment booking system
- Real-time notifications

### Phase 4: Vet Dashboard (Weeks 7-8)
- Patient management
- Schedule management
- Appointment approval system

### Phase 5-12: Enhanced Features
- Medication tracking
- Reviews & ratings
- Analytics dashboard
- AI chat assistant
- Blog & content

For the complete roadmap, see [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md).

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Development Guidelines

- Follow the established code structure (see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md))
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow code style guidelines (Black for Python, Prettier for TypeScript)

---

## 📝 Environment Variables Reference

### Backend (.env)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ | - |
| `REDIS_URL` | Redis connection string | ✅ | - |
| `SECRET_KEY` | JWT secret key | ✅ | - |
| `ALLOWED_ORIGINS` | CORS allowed origins | ✅ | `[]` |
| `GEMINI_API_KEY` | Google Gemini API key | ❌ | - |
| `SMTP_HOST` | Email SMTP host | ❌ | - |
| `SMTP_USER` | Email SMTP username | ❌ | - |
| `SMTP_PASSWORD` | Email SMTP password | ❌ | - |

### Frontend (.env.local)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | ✅ | - |
| `NODE_ENV` | Environment | ✅ | `development` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking | ❌ | - |

---

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Check Python version
python --version  # Should be 3.11+

# Reinstall dependencies
uv pip install -r pyproject.toml --force-reinstall
```

#### Frontend build errors
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 20+
```

#### Database migration errors
```bash
# Check current migration status
alembic current

# Reset database (WARNING: destroys data)
alembic downgrade base
alembic upgrade head
```

#### Port already in use
```bash
# Find process using port 8000 (backend)
lsof -i :8000
kill -9 <PID>

# Find process using port 3000 (frontend)
lsof -i :3000
kill -9 <PID>
```

---

## 📞 Support

- **Documentation**: Check the docs in this repository
- **Issues**: [GitHub Issues](https://github.com/your-username/Vetly/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/Vetly/discussions)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [FastAPI](https://fastapi.tiangolo.com/)
- AI capabilities by [Google Gemini](https://ai.google.dev/)
- Deployed with [Coolify](https://coolify.io/)
- Hosted on [Hetzner](https://www.hetzner.com/)

---

## 📊 Project Status

**Current Version**: 1.0.0-alpha
**Status**: 🚧 Active Development
**Target Launch**: Q2 2026

### Development Progress

- [x] Project structure defined
- [x] Documentation completed
- [ ] Phase 1: Core Infrastructure (In Progress)
- [ ] Phase 2: Pet Management
- [ ] Phase 3: Appointment Booking
- [ ] Phase 4: Vet Dashboard
- [ ] Phase 5-12: Enhanced Features
- [ ] Production Deployment

---

<div align="center">
  <p>Made with ❤️ for pets and their humans</p>
  <p>🐾 Vetly - Your Pet's Health, Simplified 🐾</p>
</div>
