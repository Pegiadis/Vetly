# Vetly - Project Structure Guide

## Overview

This document defines the complete project structure for both frontend (Next.js 15) and backend (FastAPI) applications using industry best practices.

**Architecture Style**:
- **Frontend**: Feature-Based with Route Groups (Next.js App Router)
- **Backend**: Layered Architecture (Separation of Concerns)

---

## Repository Structure

```
Vetly/
├── vetly-front/              # Next.js frontend application
├── vetly-back/               # FastAPI backend application
├── vetly-landing-page/       # Marketing landing page (existing)
├── vetly/                    # AI Studio prototype (reference only)
├── .claude/                  # Claude Code configuration
├── ARCHITECTURE.md           # System architecture documentation
├── FEATURE_ROADMAP.md        # Development roadmap
├── DEPLOYMENT.md             # Deployment guide
├── PROJECT_STRUCTURE.md      # This file
├── README.md                 # Project overview
└── .gitignore                # Global gitignore
```

---

# Part 1: Frontend Structure (Next.js 15)

## Complete Directory Tree

```
vetly-front/
├── app/
│   ├── (public)/                    # Route group: Public pages (no auth required)
│   │   ├── layout.tsx               # Public layout (header, footer)
│   │   ├── page.tsx                 # Landing page (/)
│   │   ├── about/
│   │   │   └── page.tsx             # About page (/about)
│   │   ├── blog/
│   │   │   ├── page.tsx             # Blog listing (/blog)
│   │   │   └── [slug]/
│   │   │       └── page.tsx         # Blog post (/blog/post-slug)
│   │   ├── vets/
│   │   │   ├── page.tsx             # Vet directory (/vets)
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Vet profile (/vets/123)
│   │   └── how-it-works/
│   │       └── page.tsx             # How it works page
│   │
│   ├── (auth)/                      # Route group: Authentication pages
│   │   ├── layout.tsx               # Auth layout (centered, minimal)
│   │   ├── login/
│   │   │   └── page.tsx             # Login page (/login)
│   │   ├── register/
│   │   │   ├── user/
│   │   │   │   └── page.tsx         # User registration (/register/user)
│   │   │   └── vet/
│   │   │       └── page.tsx         # Vet registration (/register/vet)
│   │   └── forgot-password/
│   │       └── page.tsx             # Password reset
│   │
│   ├── (user)/                      # Route group: Pet owner dashboard (auth required)
│   │   ├── layout.tsx               # User dashboard layout
│   │   ├── dashboard/
│   │   │   └── page.tsx             # User dashboard (/dashboard)
│   │   ├── pets/
│   │   │   ├── page.tsx             # Pet list (/pets)
│   │   │   ├── new/
│   │   │   │   └── page.tsx         # Add pet (/pets/new)
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # Pet profile (/pets/123)
│   │   │       └── edit/
│   │   │           └── page.tsx     # Edit pet (/pets/123/edit)
│   │   ├── appointments/
│   │   │   ├── page.tsx             # Appointment list (/appointments)
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx         # Calendar view (/appointments/calendar)
│   │   │   └── new/
│   │   │       └── page.tsx         # Book appointment (/appointments/new)
│   │   ├── medications/
│   │   │   ├── page.tsx             # Medication list (/medications)
│   │   │   └── new/
│   │   │       └── page.tsx         # Add medication
│   │   ├── chat/
│   │   │   └── page.tsx             # AI chat assistant (/chat)
│   │   └── profile/
│   │       └── page.tsx             # User profile settings (/profile)
│   │
│   ├── (vet)/                       # Route group: Vet dashboard (auth required)
│   │   ├── layout.tsx               # Vet dashboard layout
│   │   └── vet/
│   │       ├── dashboard/
│   │       │   └── page.tsx         # Vet dashboard (/vet/dashboard)
│   │       ├── patients/
│   │       │   ├── page.tsx         # Patient list (/vet/patients)
│   │       │   ├── new/
│   │       │   │   └── page.tsx     # Add patient
│   │       │   └── [id]/
│   │       │       └── page.tsx     # Patient profile
│   │       ├── appointments/
│   │       │   ├── page.tsx         # All appointments (/vet/appointments)
│   │       │   ├── today/
│   │       │   │   └── page.tsx     # Today's appointments
│   │       │   ├── pending/
│   │       │   │   └── page.tsx     # Pending requests
│   │       │   └── schedule/
│   │       │       └── page.tsx     # Weekly schedule
│   │       ├── analytics/
│   │       │   └── page.tsx         # Analytics dashboard (/vet/analytics)
│   │       ├── reviews/
│   │       │   └── page.tsx         # Reviews management
│   │       └── settings/
│   │           └── page.tsx         # Vet profile settings
│   │
│   ├── api/                         # API routes (Next.js API routes if needed)
│   │   ├── health/
│   │   │   └── route.ts             # Health check endpoint
│   │   └── webhooks/
│   │       └── route.ts             # Webhook handlers
│   │
│   ├── layout.tsx                   # Root layout
│   ├── loading.tsx                  # Global loading UI
│   ├── error.tsx                    # Global error UI
│   ├── not-found.tsx                # 404 page
│   └── globals.css                  # Global styles
│
├── components/
│   ├── ui/                          # Reusable UI components (shadcn/ui style)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── calendar.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   └── index.ts                 # Barrel export
│   │
│   ├── features/                    # Feature-specific components
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   └── password-reset-form.tsx
│   │   ├── pets/
│   │   │   ├── pet-card.tsx
│   │   │   ├── pet-form.tsx
│   │   │   ├── medical-history-timeline.tsx
│   │   │   └── weight-chart.tsx
│   │   ├── appointments/
│   │   │   ├── appointment-card.tsx
│   │   │   ├── booking-form.tsx
│   │   │   ├── appointment-calendar.tsx
│   │   │   └── time-slot-picker.tsx
│   │   ├── vets/
│   │   │   ├── vet-card.tsx
│   │   │   ├── vet-search-filters.tsx
│   │   │   └── vet-map.tsx
│   │   ├── medications/
│   │   │   ├── medication-card.tsx
│   │   │   └── medication-form.tsx
│   │   ├── chat/
│   │   │   ├── chat-interface.tsx
│   │   │   ├── message-bubble.tsx
│   │   │   └── chat-input.tsx
│   │   └── analytics/
│   │       ├── stats-card.tsx
│   │       └── trend-chart.tsx
│   │
│   └── shared/                      # Shared components across features
│       ├── header.tsx               # Main header/navigation
│       ├── footer.tsx               # Footer
│       ├── sidebar.tsx              # Dashboard sidebar
│       ├── user-menu.tsx            # User dropdown menu
│       ├── notification-bell.tsx    # Notifications dropdown
│       ├── mobile-nav.tsx           # Mobile navigation
│       ├── breadcrumbs.tsx          # Breadcrumb navigation
│       ├── page-header.tsx          # Page header component
│       ├── empty-state.tsx          # Empty state component
│       └── loading-spinner.tsx      # Loading spinner
│
├── lib/
│   ├── api/                         # API client and services
│   │   ├── client.ts                # Axios/Fetch client configuration
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── pet.service.ts
│   │   │   ├── vet.service.ts
│   │   │   ├── appointment.service.ts
│   │   │   ├── medication.service.ts
│   │   │   └── chat.service.ts
│   │   └── index.ts
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── use-auth.ts              # Authentication hook
│   │   ├── use-pets.ts              # Pets data hook
│   │   ├── use-appointments.ts      # Appointments hook
│   │   ├── use-notifications.ts     # Notifications hook
│   │   ├── use-media-query.ts       # Responsive design hook
│   │   └── use-debounce.ts          # Debounce hook
│   │
│   ├── utils/                       # Utility functions
│   │   ├── cn.ts                    # Class name merger (clsx + tailwind-merge)
│   │   ├── date.ts                  # Date formatting utilities
│   │   ├── validators.ts            # Validation helpers
│   │   ├── format.ts                # Formatting utilities
│   │   └── constants.ts             # App constants
│   │
│   └── validations/                 # Zod validation schemas
│       ├── auth.schemas.ts
│       ├── pet.schemas.ts
│       ├── appointment.schemas.ts
│       └── index.ts
│
├── stores/                          # Zustand state management
│   ├── auth.store.ts                # Authentication state
│   ├── user.store.ts                # User data state
│   ├── notifications.store.ts       # Notifications state
│   └── ui.store.ts                  # UI state (modals, sidebar, etc.)
│
├── types/                           # TypeScript type definitions
│   ├── api.types.ts                 # API response types
│   ├── auth.types.ts                # Auth types
│   ├── pet.types.ts                 # Pet types
│   ├── vet.types.ts                 # Vet types
│   ├── appointment.types.ts         # Appointment types
│   ├── medication.types.ts          # Medication types
│   └── index.ts                     # Barrel export
│
├── public/                          # Static assets
│   ├── images/
│   ├── icons/
│   └── favicon.ico
│
├── middleware.ts                    # Next.js middleware (auth protection)
├── next.config.ts                   # Next.js configuration
├── tailwind.config.ts               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies
├── .env.local                       # Environment variables (local)
├── .env.example                     # Environment variables template
├── .eslintrc.json                   # ESLint configuration
├── .prettierrc                      # Prettier configuration
└── README.md                        # Frontend documentation
```

---

## Frontend File Examples

### 1. Root Layout (`app/layout.tsx`)

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vetly - Veterinary Care Platform',
  description: 'Connect with veterinarians and manage your pet\'s health',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="el">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### 2. Public Layout (`app/(public)/layout.tsx`)

```typescript
import { Header } from '@/components/shared/header'
import { Footer } from '@/components/shared/footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
```

### 3. User Dashboard Layout (`app/(user)/layout.tsx`)

```typescript
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shared/sidebar'
import { Header } from '@/components/shared/header'
import { getServerSession } from '@/lib/auth'

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  if (!session || session.role !== 'user') {
    redirect('/login')
  }

  return (
    <div className="flex h-screen">
      <Sidebar userType="user" />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### 4. API Client (`lib/api/client.ts`)

```typescript
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or redirect to login
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### 5. Service Example (`lib/api/services/pet.service.ts`)

```typescript
import { apiClient } from '../client'
import { Pet, CreatePetDto, UpdatePetDto } from '@/types'

export const petService = {
  async getAll(): Promise<Pet[]> {
    const response = await apiClient.get('/pets')
    return response.data
  },

  async getById(id: string): Promise<Pet> {
    const response = await apiClient.get(`/pets/${id}`)
    return response.data
  },

  async create(data: CreatePetDto): Promise<Pet> {
    const response = await apiClient.post('/pets', data)
    return response.data
  },

  async update(id: string, data: UpdatePetDto): Promise<Pet> {
    const response = await apiClient.put(`/pets/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/pets/${id}`)
  },

  async uploadImage(id: string, file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post(`/pets/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.url
  },
}
```

### 6. Custom Hook Example (`lib/hooks/use-pets.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { petService } from '@/lib/api/services/pet.service'
import { CreatePetDto, UpdatePetDto } from '@/types'
import { toast } from 'sonner'

export function usePets() {
  const queryClient = useQueryClient()

  const { data: pets, isLoading, error } = useQuery({
    queryKey: ['pets'],
    queryFn: petService.getAll,
  })

  const createPet = useMutation({
    mutationFn: (data: CreatePetDto) => petService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      toast.success('Pet added successfully!')
    },
    onError: () => {
      toast.error('Failed to add pet')
    },
  })

  const updatePet = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePetDto }) =>
      petService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      toast.success('Pet updated successfully!')
    },
  })

  const deletePet = useMutation({
    mutationFn: (id: string) => petService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      toast.success('Pet deleted successfully!')
    },
  })

  return {
    pets,
    isLoading,
    error,
    createPet: createPet.mutate,
    updatePet: updatePet.mutate,
    deletePet: deletePet.mutate,
  }
}
```

### 7. Zustand Store Example (`stores/auth.store.ts`)

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'vet'
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem('access_token', token)
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
)
```

### 8. Middleware (`middleware.ts`)

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value
  const { pathname } = request.nextUrl

  // Protected routes
  const protectedRoutes = ['/dashboard', '/pets', '/appointments', '/vet']
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to dashboard if accessing auth pages with token
  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

---

# Part 2: Backend Structure (FastAPI)

## Complete Directory Tree

```
vetly-back/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/              # Route handlers
│   │       │   ├── __init__.py
│   │       │   ├── auth.py             # Authentication endpoints
│   │       │   ├── users.py            # User endpoints
│   │       │   ├── pets.py             # Pet endpoints
│   │       │   ├── vets.py             # Vet endpoints
│   │       │   ├── appointments.py     # Appointment endpoints
│   │       │   ├── medications.py      # Medication endpoints
│   │       │   ├── reviews.py          # Review endpoints
│   │       │   ├── blog.py             # Blog endpoints
│   │       │   ├── notifications.py    # Notification endpoints
│   │       │   └── ai_chat.py          # AI chat endpoints
│   │       │
│   │       └── router.py               # Main API router
│   │
│   ├── core/                           # Core configuration
│   │   ├── __init__.py
│   │   ├── config.py                   # Settings and configuration
│   │   ├── security.py                 # Security utilities (JWT, hashing)
│   │   ├── deps.py                     # FastAPI dependencies
│   │   └── exceptions.py               # Custom exceptions
│   │
│   ├── models/                         # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── base.py                     # Base model class
│   │   ├── user.py                     # User model
│   │   ├── vet.py                      # Vet model
│   │   ├── pet.py                      # Pet model
│   │   ├── appointment.py              # Appointment model
│   │   ├── medication.py               # Medication model
│   │   ├── medical_event.py            # Medical event model
│   │   ├── review.py                   # Review model
│   │   ├── notification.py             # Notification model
│   │   ├── blog_post.py                # Blog post model
│   │   └── session.py                  # Session model
│   │
│   ├── schemas/                        # Pydantic schemas (request/response)
│   │   ├── __init__.py
│   │   ├── auth.py                     # Auth schemas (login, register)
│   │   ├── user.py                     # User schemas
│   │   ├── vet.py                      # Vet schemas
│   │   ├── pet.py                      # Pet schemas
│   │   ├── appointment.py              # Appointment schemas
│   │   ├── medication.py               # Medication schemas
│   │   ├── review.py                   # Review schemas
│   │   ├── notification.py             # Notification schemas
│   │   └── common.py                   # Common/shared schemas
│   │
│   ├── services/                       # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py             # Authentication logic
│   │   ├── user_service.py             # User business logic
│   │   ├── pet_service.py              # Pet business logic
│   │   ├── vet_service.py              # Vet business logic
│   │   ├── appointment_service.py      # Appointment logic
│   │   ├── medication_service.py       # Medication logic
│   │   ├── notification_service.py     # Notification logic
│   │   ├── email_service.py            # Email sending
│   │   ├── sms_service.py              # SMS sending
│   │   ├── storage_service.py          # File upload/storage
│   │   └── ai_service.py               # AI chat integration
│   │
│   ├── repositories/                   # Data access layer
│   │   ├── __init__.py
│   │   ├── base.py                     # Base repository with CRUD
│   │   ├── user_repository.py
│   │   ├── pet_repository.py
│   │   ├── vet_repository.py
│   │   ├── appointment_repository.py
│   │   └── medication_repository.py
│   │
│   ├── db/                             # Database configuration
│   │   ├── __init__.py
│   │   ├── base.py                     # Import all models
│   │   └── session.py                  # Database session
│   │
│   ├── utils/                          # Utility functions
│   │   ├── __init__.py
│   │   ├── validators.py               # Validation helpers
│   │   ├── formatters.py               # Data formatters
│   │   └── helpers.py                  # General helpers
│   │
│   ├── websockets/                     # WebSocket handlers
│   │   ├── __init__.py
│   │   ├── connection_manager.py       # WebSocket manager
│   │   └── notifications.py            # Notification WebSocket
│   │
│   └── main.py                         # FastAPI application entry point
│
├── alembic/                            # Database migrations
│   ├── versions/                       # Migration files
│   ├── env.py                          # Alembic environment
│   └── script.py.mako                  # Migration template
│
├── tests/                              # Test suite
│   ├── __init__.py
│   ├── conftest.py                     # Pytest fixtures
│   ├── test_auth.py
│   ├── test_pets.py
│   ├── test_appointments.py
│   └── test_services/
│       ├── test_auth_service.py
│       └── test_pet_service.py
│
├── scripts/                            # Utility scripts
│   ├── seed_data.py                    # Database seeding
│   ├── create_admin.py                 # Create admin user
│   └── backup_db.py                    # Database backup
│
├── .env                                # Environment variables (production)
├── .env.example                        # Environment variables template
├── .gitignore                          # Git ignore file
├── pyproject.toml                      # Python dependencies (uv)
├── uv.lock                             # Lock file
├── alembic.ini                         # Alembic configuration
├── Dockerfile                          # Docker configuration
└── README.md                           # Backend documentation
```

---

## Backend File Examples

### 1. Main Application (`app/main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import engine
from app.db.base import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")
    # Create tables (for development - use Alembic in production)
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    print("Shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.VERSION}

@app.get("/")
async def root():
    return {
        "message": "Vetly API",
        "version": settings.VERSION,
        "docs": f"{settings.API_V1_STR}/docs",
    }
```

### 2. Configuration (`app/core/config.py`)

```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Project
    PROJECT_NAME: str = "Vetly API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Email
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # Storage
    STORAGE_PROVIDER: str = "local"  # 'local' or 's3'
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = ""

    # AI
    GEMINI_API_KEY: str = ""

    # Environment
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

### 3. Security Utilities (`app/core/security.py`)

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
```

### 4. Dependencies (`app/core/deps.py`)

```python
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.core.security import decode_token
from app.models.user import User
from app.models.vet import Vet

security = HTTPBearer()

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    user_id: str = payload.get("sub")
    user_type: str = payload.get("type")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    if user_type == "user":
        user = db.query(User).filter(User.id == user_id).first()
    elif user_type == "vet":
        user = db.query(Vet).filter(Vet.id == user_id).first()
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user type",
        )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user

async def get_current_vet(
    current_user = Depends(get_current_user),
) -> Vet:
    if not isinstance(current_user, Vet):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. Vet access required.",
        )
    return current_user
```

### 5. Database Session (`app/db/session.py`)

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

### 6. Base Model (`app/models/base.py`)

```python
from datetime import datetime
from sqlalchemy import Column, DateTime
from sqlalchemy.ext.declarative import declarative_base
import uuid
from sqlalchemy.dialects.postgresql import UUID

Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
```

### 7. Model Example (`app/models/pet.py`)

```python
from sqlalchemy import Column, String, Integer, Float, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.models.base import BaseModel

class PetType(str, enum.Enum):
    DOG = "Dog"
    CAT = "Cat"
    OTHER = "Other"

class Gender(str, enum.Enum):
    MALE = "Male"
    FEMALE = "Female"

class Pet(BaseModel):
    __tablename__ = "pets"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(Enum(PetType), nullable=False)
    breed = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    weight = Column(Float, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    chip_number = Column(String(50), unique=True, nullable=True)
    image_url = Column(String(500), nullable=True)

    # Relationships
    owner = relationship("User", back_populates="pets")
    medical_events = relationship("MedicalEvent", back_populates="pet", cascade="all, delete-orphan")
    weight_history = relationship("WeightHistory", back_populates="pet", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="pet")
    medications = relationship("Medication", back_populates="pet", cascade="all, delete-orphan")
```

### 8. Schema Example (`app/schemas/pet.py`)

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum

class PetType(str, Enum):
    DOG = "Dog"
    CAT = "Cat"
    OTHER = "Other"

class Gender(str, Enum):
    MALE = "Male"
    FEMALE = "Female"

class PetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: PetType
    breed: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=0, le=30)
    weight: float = Field(..., gt=0)
    gender: Gender
    chip_number: Optional[str] = Field(None, max_length=50)

class PetCreate(PetBase):
    pass

class PetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[PetType] = None
    breed: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=30)
    weight: Optional[float] = Field(None, gt=0)
    gender: Optional[Gender] = None
    chip_number: Optional[str] = Field(None, max_length=50)

class PetResponse(PetBase):
    id: UUID
    user_id: UUID
    image_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

### 9. Repository Example (`app/repositories/pet_repository.py`)

```python
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.pet import Pet
from app.schemas.pet import PetCreate, PetUpdate

class PetRepository(BaseRepository[Pet, PetCreate, PetUpdate]):
    def get_by_user(self, db: Session, user_id: UUID) -> List[Pet]:
        return db.query(Pet).filter(Pet.user_id == user_id).all()

    def get_by_chip_number(self, db: Session, chip_number: str) -> Optional[Pet]:
        return db.query(Pet).filter(Pet.chip_number == chip_number).first()

pet_repository = PetRepository(Pet)
```

### 10. Service Example (`app/services/pet_service.py`)

```python
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.pet_repository import pet_repository
from app.schemas.pet import PetCreate, PetUpdate, PetResponse
from app.models.user import User

class PetService:
    def get_user_pets(self, db: Session, user: User) -> List[PetResponse]:
        pets = pet_repository.get_by_user(db, user.id)
        return [PetResponse.from_orm(pet) for pet in pets]

    def get_pet(self, db: Session, pet_id: UUID, user: User) -> PetResponse:
        pet = pet_repository.get(db, pet_id)

        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found",
            )

        # Check ownership
        if pet.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this pet",
            )

        return PetResponse.from_orm(pet)

    def create_pet(self, db: Session, pet_data: PetCreate, user: User) -> PetResponse:
        # Check if chip number already exists
        if pet_data.chip_number:
            existing = pet_repository.get_by_chip_number(db, pet_data.chip_number)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Chip number already registered",
                )

        # Create pet
        pet_dict = pet_data.dict()
        pet_dict["user_id"] = user.id
        pet = pet_repository.create(db, pet_data)

        return PetResponse.from_orm(pet)

    def update_pet(
        self, db: Session, pet_id: UUID, pet_data: PetUpdate, user: User
    ) -> PetResponse:
        pet = pet_repository.get(db, pet_id)

        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found",
            )

        if pet.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this pet",
            )

        updated_pet = pet_repository.update(db, pet, pet_data)
        return PetResponse.from_orm(updated_pet)

    def delete_pet(self, db: Session, pet_id: UUID, user: User) -> None:
        pet = pet_repository.get(db, pet_id)

        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found",
            )

        if pet.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this pet",
            )

        pet_repository.delete(db, pet_id)

pet_service = PetService()
```

### 11. Endpoint Example (`app/api/v1/endpoints/pets.py`)

```python
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.schemas.pet import PetCreate, PetUpdate, PetResponse
from app.services.pet_service import pet_service
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[PetResponse])
async def get_pets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all pets for the current user."""
    return pet_service.get_user_pets(db, current_user)

@router.post("/", response_model=PetResponse, status_code=status.HTTP_201_CREATED)
async def create_pet(
    pet_data: PetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new pet."""
    return pet_service.create_pet(db, pet_data, current_user)

@router.get("/{pet_id}", response_model=PetResponse)
async def get_pet(
    pet_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific pet by ID."""
    return pet_service.get_pet(db, pet_id, current_user)

@router.put("/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: UUID,
    pet_data: PetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a pet."""
    return pet_service.update_pet(db, pet_id, pet_data, current_user)

@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pet(
    pet_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a pet."""
    pet_service.delete_pet(db, pet_id, current_user)
```

### 12. API Router (`app/api/v1/router.py`)

```python
from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    pets,
    vets,
    appointments,
    medications,
    reviews,
    notifications,
    ai_chat,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(pets.router, prefix="/pets", tags=["Pets"])
api_router.include_router(vets.router, prefix="/vets", tags=["Vets"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
api_router.include_router(medications.router, prefix="/medications", tags=["Medications"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(ai_chat.router, prefix="/ai/chat", tags=["AI Chat"])
```

---

## Configuration Files

### Frontend `.env.example`

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Environment
NODE_ENV=development

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=

# Optional: Sentry
NEXT_PUBLIC_SENTRY_DSN=
```

### Backend `.env.example`

```env
# Project
PROJECT_NAME=Vetly API
VERSION=1.0.0
ENVIRONMENT=development

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database
DATABASE_URL=postgresql://vetly:password@localhost:5432/vetly

# Redis
REDIS_URL=redis://:password@localhost:6379

# CORS
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:8000"]

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Storage
STORAGE_PROVIDER=local
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# AI
GEMINI_API_KEY=your-gemini-api-key

# Twilio (Optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### Backend `pyproject.toml`

```toml
[project]
name = "vetly-backend"
version = "1.0.0"
description = "Vetly API - Veterinary Platform Backend"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.110.0",
    "uvicorn[standard]>=0.27.0",
    "sqlalchemy>=2.0.0",
    "alembic>=1.13.0",
    "psycopg2-binary>=2.9.9",
    "pydantic>=2.6.0",
    "pydantic-settings>=2.1.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "python-multipart>=0.0.9",
    "redis>=5.0.0",
    "celery>=5.3.0",
    "python-dotenv>=1.0.0",
    "pillow>=10.2.0",
    "boto3>=1.34.0",
    "sendgrid>=6.11.0",
    "twilio>=8.13.0",
    "google-generativeai>=0.3.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "httpx>=0.26.0",
    "black>=24.0.0",
    "isort>=5.13.0",
    "mypy>=1.8.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.black]
line-length = 88
target-version = ['py311']

[tool.isort]
profile = "black"

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
```

---

## Naming Conventions

### Frontend
- **Files**: kebab-case (`pet-card.tsx`, `use-pets.ts`)
- **Components**: PascalCase (`PetCard`, `AppointmentForm`)
- **Functions/Variables**: camelCase (`getUserPets`, `petData`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`, `MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase (`Pet`, `UserProfile`)

### Backend
- **Files**: snake_case (`pet_service.py`, `auth.py`)
- **Classes**: PascalCase (`PetService`, `User`)
- **Functions/Variables**: snake_case (`get_user_pets`, `pet_data`)
- **Constants**: UPPER_SNAKE_CASE (`DATABASE_URL`, `API_VERSION`)
- **Endpoints**: kebab-case in URL (`/api/v1/pets`, `/auth/forgot-password`)

---

## Best Practices

### Frontend
1. **Use Server Components by default**, Client Components when needed (interactivity)
2. **Colocate related files** (component + styles + tests)
3. **Use barrel exports** (`index.ts`) for cleaner imports
4. **Implement proper error boundaries**
5. **Use TypeScript strictly** (avoid `any`)
6. **Lazy load heavy components**
7. **Optimize images** with Next.js Image component
8. **Use React Hook Form + Zod** for forms

### Backend
1. **Separate concerns**: Routes → Services → Repositories → Models
2. **Use Pydantic for validation** (request/response)
3. **Implement proper error handling** (custom exceptions)
4. **Use dependency injection** (FastAPI dependencies)
5. **Write async code** where appropriate
6. **Add comprehensive docstrings**
7. **Use type hints** everywhere
8. **Implement logging** (not just print statements)

---

## Import Order

### Frontend (TypeScript)
```typescript
// 1. External libraries
import React from 'react'
import { useRouter } from 'next/navigation'

// 2. Internal modules (absolute imports)
import { Button } from '@/components/ui/button'
import { usePets } from '@/lib/hooks/use-pets'
import { Pet } from '@/types'

// 3. Relative imports
import { PetCard } from './pet-card'

// 4. Styles
import './styles.css'
```

### Backend (Python)
```python
# 1. Standard library
from typing import List, Optional
from datetime import datetime

# 2. Third-party packages
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

# 3. Local application
from app.core.deps import get_db, get_current_user
from app.schemas.pet import PetCreate, PetResponse
from app.services.pet_service import pet_service
```

---

## Summary

This structure provides:
- ✅ **Clear separation of concerns**
- ✅ **Scalability** for team growth
- ✅ **Maintainability** with organized code
- ✅ **Type safety** with TypeScript/Pydantic
- ✅ **Testability** with layered architecture
- ✅ **Performance** with proper optimization
- ✅ **Security** with best practices

**Next Steps**:
1. Initialize both projects with this structure
2. Set up configuration files
3. Begin Phase 1 development (Authentication)

Good luck with the implementation! 🚀
