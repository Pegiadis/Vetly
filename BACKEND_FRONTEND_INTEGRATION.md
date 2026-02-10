# Vetly - Backend to Frontend Integration Documentation

This document outlines which backend APIs are actively used by the frontend and which features are currently mocked.

---

## Quick Summary

| Feature Area   | Backend Status | Frontend Status | Integration |
| -------------- | -------------- | --------------- | ----------- |
| Vet Listing    | Implemented    | Connected       | REAL        |
| Vet Details    | Implemented    | Connected       | REAL        |
| Authentication | Implemented    | Not Connected   | MOCKED      |
| Vet Dashboard  | Implemented    | Not Connected   | MOCKED      |
| Appointments   | Implemented    | Not Connected   | MOCKED      |
| Patients       | Implemented    | Not Connected   | MOCKED      |
| Reviews        | Implemented    | Not Connected   | MOCKED      |
| Analytics      | Implemented    | Not Connected   | MOCKED      |

---

## Real API Integration

### 1. Vet Listing (`/vets`)

**Backend Endpoint:** `GET /api/v1/vets`

**Frontend File:** `vetly-front/app/vets/page.tsx`

**Integration:** Server-side fetch with no caching

```typescript
const res = await fetch(`${API_URL}/vets`, { cache: 'no-store' });
```

**Response Type:**
```typescript
interface VetListResponse {
  items: Vet[];
  total: number;
  page: number;
  page_size: number;
}
```

---

### 2. Vet Details (`/vets/[id]`)

**Backend Endpoint:** `GET /api/v1/vets/{id}`

**Frontend File:** `vetly-front/app/vets/[id]/page.tsx`

**Integration:** Server-side fetch with 404 handling

```typescript
const res = await fetch(`${API_URL}/vets/${id}`, { cache: 'no-store' });
if (res.status === 404) return null;
```

---

## Mocked Features (Backend Ready, Frontend Not Connected)

### 1. Authentication

**Backend Endpoints Available:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/auth/vet/login` | Vet login with JWT token |
| POST | `/api/v1/auth/vet/login/form` | OAuth2 form-based login |
| POST | `/api/v1/auth/vet/register` | New vet registration |
| GET | `/api/v1/auth/me` | Get current authenticated vet |

**Frontend Status:** No authentication flow implemented. No token management, no protected routes.

---

### 2. Vet Dashboard

**Backend Endpoints Available:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/vet/dashboard/stats` | Dashboard summary stats |
| GET | `/api/v1/vets/me` | Current vet profile |
| PUT | `/api/v1/vets/me` | Update vet profile |
| PUT | `/api/v1/vets/me/hours` | Update working hours |
| PATCH | `/api/v1/vets/me/on-call` | Toggle on-call status |

**Frontend File:** `vetly-front/app/vet/(dashboard)/dashboard/page.tsx`

**Mock Data Used:**
```typescript
const mockVet = {
  name: "Dr. Νίκος Παπαδόπουλος",
  specialty: "Γενικός Κτηνίατρος",
  // ... hardcoded values
};

const mockAppointments = [
  { id: '1', petName: 'Max', petType: 'Σκύλος', ... },
  // ... hardcoded appointments
];
```

---

### 3. Appointments Management

**Backend Endpoints Available:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/vet/appointments` | Get vet's appointments (with filters) |
| GET | `/api/v1/vet/appointments/today` | Get today's appointments |
| GET | `/api/v1/vet/appointments/pending` | Get pending requests |
| GET | `/api/v1/vet/appointments/{id}` | Get specific appointment |
| PATCH | `/api/v1/vet/appointments/{id}/status` | Update status |
| POST | `/api/v1/vet/appointments/{id}/approve` | Approve appointment |
| POST | `/api/v1/vet/appointments/{id}/reject` | Reject appointment |

**Frontend File:** `vetly-front/app/vet/(dashboard)/appointments/page.tsx`

**Mock Data Used:**
```typescript
const todayAppointments = [
  {
    id: '1',
    time: '09:00',
    petName: 'Max',
    petType: 'Σκύλος',
    ownerName: 'Μαρία Παπαδοπούλου',
    reason: 'Ετήσιος εμβολιασμός',
    status: 'confirmed' as const,
  },
  // ... more hardcoded appointments
];
```

---

### 4. Patient Management

**Backend Endpoints Available:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/vet/patients` | Get vet's patients (with search) |
| GET | `/api/v1/vet/patients/{pet_id}` | Get patient with owner details |
| GET | `/api/v1/vet/patients/{pet_id}/history` | Get medical history |

**Frontend File:** `vetly-front/app/vet/(dashboard)/patients/page.tsx`

**Mock Data Used:**
```typescript
const mockPatients = [
  {
    id: '1',
    name: 'Max',
    type: 'Σκύλος',
    breed: 'Golden Retriever',
    age: 5,
    owner: { name: 'Μαρία Παπαδοπούλου', phone: '6912345678' },
    lastVisit: '2024-01-15',
    history: [ /* hardcoded medical history */ ],
  },
  // ... 3 more patients
];
```

---

### 5. Reviews Management

**Backend Endpoints Available:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/vet/reviews` | Get vet's reviews |
| GET | `/api/v1/vet/reviews/stats` | Get review statistics |
| POST | `/api/v1/vet/reviews/{id}/reply` | Reply to a review |

**Frontend File:** `vetly-front/app/vet/(dashboard)/reviews/page.tsx`

**Mock Data Used:**
```typescript
const mockReviews = [
  {
    id: '1',
    author: 'Μαρία Π.',
    rating: 5,
    date: '2024-01-18',
    petName: 'Max',
    comment: 'Εξαιρετικός κτηνίατρος! ...',
    reply: null,
  },
  // ... 3 more reviews
];
```

---

### 6. Analytics

**Backend Endpoints Available:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/vet/analytics` | Full analytics data |
| GET | `/api/v1/vet/analytics/appointments` | Appointment trends |
| GET | `/api/v1/vet/analytics/services` | Service breakdown |
| GET | `/api/v1/vet/analytics/peak-hours` | Peak hours analysis |
| GET | `/api/v1/vet/analytics/patient-types` | Patient type distribution |

**Frontend File:** `vetly-front/app/vet/(dashboard)/analytics/page.tsx`

**Mock Data Used:**
```typescript
const stats = [
  { label: 'Συνολικά Ραντεβού', value: '1,234', change: '+12%' },
  { label: 'Νέοι Ασθενείς', value: '89', change: '+8%' },
  // ... more stats
];

const monthlyData = [
  { month: 'Ιαν', appointments: 45, revenue: 2250 },
  // ... 12 months of data
];
```

---

## API Utility (Unused)

**File:** `vetly-front/lib/api.ts`

A complete API client is prepared but NOT used by any dashboard pages:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint),
  post: <T>(endpoint: string, data: unknown) => fetchApi<T>(endpoint, { method: 'POST', body }),
  put: <T>(endpoint: string, data: unknown) => fetchApi<T>(endpoint, { method: 'PUT', body }),
  delete: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'DELETE' }),
};
```

---

## Backend Endpoints Summary (28 Total)

### Root & Health (3)
- `GET /` - API welcome
- `GET /health` - Health check
- `GET /api/v1/` - API v1 root

### Authentication (4)
- `POST /api/v1/auth/vet/login`
- `POST /api/v1/auth/vet/login/form`
- `POST /api/v1/auth/vet/register`
- `GET /api/v1/auth/me`

### Vet Profiles (7)
- `GET /api/v1/vets` - List vets (USED)
- `GET /api/v1/vets/search` - Search vets
- `GET /api/v1/vets/me` - Current vet profile
- `PUT /api/v1/vets/me` - Update profile
- `PUT /api/v1/vets/me/hours` - Update hours
- `PATCH /api/v1/vets/me/on-call` - Toggle on-call
- `GET /api/v1/vets/{id}` - Get vet by ID (USED)

### Vet Appointments (7)
- `GET /api/v1/vet/appointments`
- `GET /api/v1/vet/appointments/today`
- `GET /api/v1/vet/appointments/pending`
- `GET /api/v1/vet/appointments/{id}`
- `PATCH /api/v1/vet/appointments/{id}/status`
- `POST /api/v1/vet/appointments/{id}/approve`
- `POST /api/v1/vet/appointments/{id}/reject`

### Vet Patients (3)
- `GET /api/v1/vet/patients`
- `GET /api/v1/vet/patients/{pet_id}`
- `GET /api/v1/vet/patients/{pet_id}/history`

### Vet Reviews (3)
- `GET /api/v1/vet/reviews`
- `GET /api/v1/vet/reviews/stats`
- `POST /api/v1/vet/reviews/{id}/reply`

### Vet Analytics (6)
- `GET /api/v1/vet/dashboard/stats`
- `GET /api/v1/vet/analytics`
- `GET /api/v1/vet/analytics/appointments`
- `GET /api/v1/vet/analytics/services`
- `GET /api/v1/vet/analytics/peak-hours`
- `GET /api/v1/vet/analytics/patient-types`

---

## Integration Roadmap

To connect the frontend to the backend, the following work is needed:

### Phase 1: Authentication
1. Implement login page with `/api/v1/auth/vet/login`
2. Add JWT token storage (localStorage/cookies)
3. Create auth context/provider
4. Add protected route middleware

### Phase 2: Dashboard Integration
1. Replace `mockVet` with `/api/v1/vets/me`
2. Replace `mockAppointments` with `/api/v1/vet/appointments/today`
3. Replace `recentPatients` with `/api/v1/vet/patients?page_size=5`

### Phase 3: Feature Pages
1. Connect appointments page to `/api/v1/vet/appointments`
2. Connect patients page to `/api/v1/vet/patients`
3. Connect reviews page to `/api/v1/vet/reviews`
4. Connect analytics page to `/api/v1/vet/analytics`

### Phase 4: Actions
1. Implement appointment approve/reject
2. Implement review reply functionality
3. Implement profile updates
4. Implement on-call toggle

---

## Notes

- **Backend is feature-complete** - All vet dashboard functionality exists
- **Frontend has UI ready** - All pages are built with mock data
- **Missing layer**: Authentication flow and API integration in dashboard
- **No client HTTP library**: Only native `fetch()` is used
- **No state management**: Each page manages its own local state
