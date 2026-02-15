# Vetly — Implementation Guide: Mock Data to Real API

## Overview

This guide details the implementation for each phase of converting Vetly's frontend from hardcoded mock data to real API calls. Phases 1-6 require **frontend wiring only** (backend endpoints exist). Phases 7-10 require **new backend endpoints + frontend**.

**Seed credentials for testing:**

| Role | Email | Password |
|------|-------|----------|
| Pet Owner | maria.papadopoulos@example.com | password123 |
| Pet Owner | nikos.georgiadis@example.com | password123 |
| Vet | dr.antonis.vasilis@vetly.gr | password123 |
| Vet | dr.elena.nikolaou@vetly.gr | password123 |
| Vet | dr.dimitris.papadakis@vetly.gr | password123 |

---

## Phase 1: Owner Appointments Page ✅ DONE

**File:** `vetly-front/app/owner/(dashboard)/appointments/page.tsx`

### Feature Logic
The appointments page is the pet owner's central hub for tracking every vet visit — past and future. When the page loads, it fetches **all** the owner's appointments from the database in a single API call. The response comes back sorted newest-first and includes the full pet and vet details nested inside each appointment object (pet name, image, vet name, specialty, clinic address).

The page splits appointments into two tabs using client-side filtering: **Upcoming** (status = `pending` or `confirmed`) and **History** (status = `completed` or `cancelled`). Each appointment card shows the pet's avatar (or a letter fallback), the appointment type (e.g. "Vaccination", "Checkup"), the vet's name and specialty, the full date with day/month/year in Greek locale, the time, a color-coded status badge, and the vet's clinic address.

In the Upcoming tab, each card has a cancel button (X icon) and a "Details" button. In the History tab, completed appointments show a "Review" button linking to the reviews page so the owner can rate the vet after their visit. If either tab is empty, a friendly empty-state illustration is shown with a "Book Appointment" call-to-action linking to `/owner/book`.

### What was done
- **Backend:** Enriched `GET /owner/appointments` — added `joinedload` for pet/vet relations in repository, added `AppointmentPetInfo` and `AppointmentVetInfo` nested schemas to `AppointmentResponse`
- **Frontend:** Replaced `mockAppointments` with `useMyAppointments()` hook, added loading/error states, proper Greek date formatting with `toLocaleDateString('el-GR', { month: 'long', year: 'numeric' })`
- **Hooks:** Added `useUpcomingAppointments()` to `useOwnerData.ts`

### Files modified
- `vetly-back/app/schemas/owner.py` — Added `AppointmentPetInfo`, `AppointmentVetInfo`, nested fields in `AppointmentResponse`
- `vetly-back/app/repositories/owner.py` — Added `joinedload` for pet + vet
- `vetly-front/hooks/useOwnerData.ts` — Added nested types, `useUpcomingAppointments()`
- `vetly-front/app/owner/(dashboard)/appointments/page.tsx` — Full rewrite

### How to test
1. Login at `/owner/login` as `maria.papadopoulos@example.com`
2. Navigate to `/owner/appointments`
3. Verify: appointments load from DB, dates show day/month/year, pet/vet names display, tabs filter correctly

---

## Phase 2: Owner Pets + Owner Dashboard

### Feature Logic
This phase brings the owner's two most visited pages to life — the **dashboard** (home screen after login) and the **pets page** (pet profile management).

**Dashboard** acts as a command center. The moment the owner logs in and lands on `/owner/dashboard`, the page fires two parallel API calls: one for their pets and one for upcoming appointments. The dashboard renders four stat cards at the top — pets count, upcoming appointment count, medications count (0 until Phase 7), and a prominent "Book" button. Below that, the main area shows the next 2 upcoming appointments with pet name, vet name, appointment type, date/time, and status badges (green for confirmed, amber for pending). A sidebar on the right lists all the owner's pets with their avatar/name/breed and links to the pets detail page. Quick action links let the owner jump to booking, medical history, or vet search with one click. The medication reminders section is intentionally left empty for now — it will display active medication alerts once Phase 7 adds the medications endpoint.

**Pets page** is a master-detail layout. The left column shows a scrollable list of all the owner's pets as selectable cards (name + type + breed). Clicking a pet highlights it and populates the right panel (2-column span) with a detail card: gradient header with the pet's image overlaid, then a stats grid showing age, weight, gender, breed, and microchip number. Below the stats are three quick-action buttons — "Book Appointment" (links to `/owner/book`), "Medical History" (links to `/owner/medical`), and "Medications" (links to `/owner/medications`). A "Recent Activity" section shows the pet's last vet visit and next scheduled appointment, derived client-side by filtering the owner's appointments by `pet_id` and comparing dates. An "Edit Profile" button is present but non-functional until Phase 10 adds pet CRUD endpoints.

### 2A — Owner Pets Page

**File:** `vetly-front/app/owner/(dashboard)/pets/page.tsx`

**Mock to remove:** `mockPets` — array of `{ id, name, type, breed, age, weight, gender, chipNumber, image, lastVisit, nextAppointment }`

**UI features:**
- Left column: selectable pet list with avatars
- Right column (2-span): selected pet detail card with gradient header, image overlay
- Quick action buttons: Book Appointment, Medical History, Medications
- Recent activity: last visit date, next appointment
- Edit profile button

**Backend endpoint (EXISTS):**
```
GET /api/v1/owner/pets
Auth: Pet Owner Bearer Token
Response: [{
  id, name, type, breed, age, weight, gender, image_url, created_at
}]
```

**Hook to use:** `useMyPets()` from `useOwnerData.ts` (already exists)

**Data shape gaps:**
- Mock has `chipNumber` → API returns `chip_number` (not in current `PetResponse` schema — need to add)
- Mock has `lastVisit` and `nextAppointment` → not in API; derive client-side from appointments data
- Mock has `image` → API has `image_url`

**Implementation steps:**
1. Add `chip_number` to `PetResponse` schema in `vetly-back/app/schemas/owner.py`
2. Import `useMyPets()` and `useMyAppointments()` hooks
3. Replace `mockPets` with hook data
4. Compute `lastVisit` / `nextAppointment` per pet from appointments
5. Add loading spinner and error state
6. Map `image_url` instead of `image`, use initial-letter fallback

### 2B — Owner Dashboard

**File:** `vetly-front/app/owner/(dashboard)/dashboard/page.tsx`

**Mocks to remove:**
- `mockOwner` — `{ id, name, email }`
- `mockPets` — `[{ id, name, type, breed, age, image }]`
- `mockAppointments` — `[{ id, petName, vetName, type, date, time, status }]`
- `mockMedications` — `[{ id, petName, name, nextDose, frequency }]`

**UI features:**
- 4 stat cards: Pets count, Appointments count, Medications count, Book button
- Upcoming appointments list (2 items) with status badges
- Medication reminders with next-dose alerts
- My Pets sidebar with avatars
- Quick Actions: Book, Medical History, Find Vet

**Backend endpoints (EXIST):**
```
GET /api/v1/owner/pets → list of pets
GET /api/v1/owner/appointments → all appointments (with pet/vet nested)
GET /api/v1/owner/appointments/upcoming → upcoming only
```

**Hooks to use:**
- `useMyPets()` — for pet count + sidebar list
- `useUpcomingAppointments()` — for upcoming appointments section
- Medications: show count as 0 until Phase 7 (no endpoint yet)

**Implementation steps:**
1. Import `useMyPets()`, `useUpcomingAppointments()`
2. Replace stat card counts with `pets.length`, `appointments.length`, `0` (medications)
3. Replace appointment list with real upcoming data, map `apt.pet?.name`, `apt.vet?.name`
4. Replace pet sidebar with real pets, use `pet.image_url` or initial fallback
5. Hide medication section if empty (or show "no medications" state)
6. Add loading/error states

### How to test Phase 2
1. Login at `/owner/login` as `maria.papadopoulos@example.com`
2. Dashboard (`/owner/dashboard`): verify pet count, appointment list, pet sidebar all show real data
3. Pets page (`/owner/pets`): select a pet, verify details panel shows correct info

---

## Phase 3: Vet Pending Appointments

### Feature Logic
This is the vet's appointment approval workflow — the critical bridge between a pet owner booking a visit and the appointment actually being confirmed. When a pet owner submits a booking through `/owner/book`, the appointment is created in the database with status `pending`. It does **not** automatically appear on the vet's daily schedule. Instead, it lands here, on the vet's pending requests page, waiting for manual approval.

The page loads all appointments with `status = pending` for the logged-in vet. Each request card displays the pet's name and avatar initial, the pet owner's full name, the requested appointment type (e.g. "Vaccination", "Checkup"), the requested date and time formatted with full month/year, and any special notes the owner included during booking (e.g. "My dog has been limping for 2 days").

The vet has two actions per request: **Approve** (green button) or **Reject** (red button). Approving calls `POST /vet/appointments/{id}/approve`, which changes the status from `pending` to `confirmed` in the database — the appointment now appears on the vet's daily schedule and the owner's appointments page shows it as "Confirmed". Rejecting calls `POST /vet/appointments/{id}/reject` with an optional reason string, setting the status to `cancelled`. After either action, the list auto-refreshes and the card disappears. When all requests are handled, an empty state message is shown: "No pending requests."

The header displays a live count of pending requests (e.g. "3 Αιτήματα σε Αναμονή"). This count decreases in real-time as the vet processes each request. This page is the vet's inbox — it should be checked at the start of each workday.

**File:** `vetly-front/app/vet/(dashboard)/pending/page.tsx`

**Mock to remove:** `initialPendingRequests` — `[{ id, petName, ownerName, type, date, time, notes }]`

**UI features:**
- Header with pending count
- Card per request: pet avatar (initial), pet name, owner name, type, date/time, notes
- Approve (green) and Reject (red) buttons per card
- Empty state when no pending requests

**Backend endpoints (EXIST):**
```
GET  /api/v1/vet/appointments/pending → { items: [AppointmentDetailResponse], total, page, page_size }
POST /api/v1/vet/appointments/{id}/approve → AppointmentDetailResponse
POST /api/v1/vet/appointments/{id}/reject  → AppointmentDetailResponse (body: { reason?: string })
```

**AppointmentDetailResponse includes:**
```json
{
  "id": "uuid",
  "scheduled_at": "datetime",
  "type": "string",
  "status": "string",
  "notes": "string|null",
  "pet": { "id", "name", "type", "breed", "image_url" },
  "pet_owner": { "id", "name", "email", "phone" }
}
```

**Hooks (EXIST in `useVetData.ts`):**
- `usePendingAppointments()` → `{ appointments, loading, error, refetch }`
- `approveAppointment(id)` → `Promise<VetAppointment>`
- `rejectAppointment(id, reason?)` → `Promise<VetAppointment>`

**Implementation steps:**
1. Import hooks from `useVetData.ts`
2. Replace `initialPendingRequests` with `usePendingAppointments()` data
3. Wire Approve button → `approveAppointment(id)` then `refetch()`
4. Wire Reject button → `rejectAppointment(id)` then `refetch()`
5. Map fields: `apt.pet?.name`, `apt.pet_owner?.name`, format `apt.scheduled_at`
6. Add loading/error states, fix dates with month/year

### How to test Phase 3
1. Login as owner, book an appointment (it starts as "pending")
2. Login as vet at `/vet/login` (use the same vet you booked with)
3. Navigate to `/vet/pending` — see the pending request
4. Click Approve — appointment disappears from pending, status changes to confirmed
5. Check owner's appointments page — status should show "confirmed"

---

## Phase 4: Vet Dashboard + Vet Patients

### Feature Logic
This phase builds the vet's operational core — the **dashboard** they see immediately after login and the **patients database** they reference throughout the day.

**Vet Dashboard** is a real-time operations view. On page load, it fires four parallel API calls: dashboard stats, today's appointments, pending requests, and the patient list. The top row shows five stat cards — today's appointment count, pending requests awaiting approval, total unique patients, the vet's average star rating, and a link to detailed analytics. These numbers come from `GET /vet/dashboard/stats`, which aggregates counts server-side for performance.

Below the stats, the left column is split into two sections. **Pending Requests** shows up to 3 of the most recent unapproved bookings with inline Approve/Reject buttons (same logic as Phase 3, but abbreviated — the vet can handle quick approvals without leaving the dashboard). **Daily Schedule** renders today's confirmed appointments as a vertical timeline ordered by time, showing each appointment's time slot, pet name, appointment type, and a status indicator. This gives the vet a quick at-a-glance view of their day.

The right sidebar shows the vet's profile card (name, specialty, city, rating pulled from auth context), followed by a "Recent Patients" list — the 3 most recent patients from the patients endpoint, showing pet name, species, and age. Each patient links to the full patients page.

**Patients Page** is the vet's patient database — a searchable table of every pet that has ever had an appointment with this vet. The search bar filters by pet name server-side via the `search` query parameter. The table shows columns: Patient (avatar + name + breed + age), Owner (name + phone), Status (Active/Treatment/Inactive badges), Last Visit date, and an actions column.

Clicking any row opens a **slide-in side panel** from the right edge of the screen (with a dark overlay behind it). The panel header shows the pet's image with a gradient background. Below that, a stats grid displays age, weight, gender, breed, and microchip number. Then the owner's contact info (name, phone, email). At the bottom, a **medical history timeline** lists all medical events for that pet — vaccinations, checkups, surgeries — with dates, event types, titles, and notes, fetched from `GET /vet/patients/{id}/history`. A "New Appointment" button at the bottom lets the vet schedule a follow-up directly.

### 4A — Vet Dashboard

**File:** `vetly-front/app/vet/(dashboard)/dashboard/page.tsx`

**Mocks to remove:**
- `mockVet` — `{ id, name, specialty, city, rating, image }`
- `mockAppointments` — `[{ id, petName, ownerName, type, date, time, status }]`
- `recentPatients` — `[{ name, type, age }]`

**UI features:**
- 5 stat cards: Today's appointments, Pending, Patients, Rating, Analytics link
- Pending requests section with approve/reject
- Daily schedule timeline with time-based layout
- Vet profile sidebar (name, specialty, city, rating)
- Recent patients list

**Backend endpoints (EXIST):**
```
GET /api/v1/vet/dashboard/stats → {
  total_patients, total_appointments, pending_appointments,
  today_appointments, completed_this_month, average_rating, total_reviews
}
GET /api/v1/vet/appointments/today   → { items: [AppointmentDetailResponse] }
GET /api/v1/vet/appointments/pending → { items: [AppointmentDetailResponse] }
GET /api/v1/vet/patients             → { items: [PetResponse], total }
GET /api/v1/auth/me                  → VetResponse (for profile sidebar)
```

**New hooks to add in `useVetData.ts`:**
- `useDashboardStats()` → calls `GET /vet/dashboard/stats`
- `usePatients(search?, page?)` → calls `GET /vet/patients`

**Implementation steps:**
1. Add `useDashboardStats()` hook to `useVetData.ts`
2. Replace stat card values with `stats.today_appointments`, `stats.pending_appointments`, etc.
3. Replace `mockAppointments` with `useTodayAppointments()` for schedule + `usePendingAppointments()` for pending section
4. Replace `mockVet` with auth context user data
5. Replace `recentPatients` with first 3 items from `usePatients()`
6. Fix all dates to show full format

### 4B — Vet Patients Page

**File:** `vetly-front/app/vet/(dashboard)/patients/page.tsx`

**Mock to remove:** `mockPatients` — `[{ id, name, breed, type, age, weight, gender, ownerName, ownerPhone, lastVisit, status, chipNumber, image, history: [{ date, type, description }] }]`

**UI features:**
- Search bar (by pet name or owner)
- Table: Patient, Owner, Status, Last Visit, Actions columns
- Status badges: Active (green), Treatment (amber), Inactive (gray)
- Click row → side panel slides in from right with overlay
- Side panel: pet image header, stats grid (age/weight/gender), chip number, owner info, medical history timeline, New Appointment button

**Backend endpoints (EXIST):**
```
GET /api/v1/vet/patients                → { items: [PetResponse], total, page, page_size }
GET /api/v1/vet/patients?search=query   → filtered results
GET /api/v1/vet/patients/{pet_id}       → PetWithOwnerResponse (includes owner: { id, name, email, phone, image_url })
GET /api/v1/vet/patients/{pet_id}/history → { items: [{ id, pet_id, vet_id, date, title, notes, event_type, created_at }], total }
```

**New hooks to add in `useVetData.ts`:**
- `usePatients(search?, page?)` → calls `GET /vet/patients`
- `usePatient(petId)` → calls `GET /vet/patients/{petId}`
- `usePatientHistory(petId)` → calls `GET /vet/patients/{petId}/history`

**Implementation steps:**
1. Add 3 new hooks to `useVetData.ts`
2. Replace `mockPatients` with `usePatients()`, wire search input to `search` param
3. On row click, fetch `usePatient(id)` and `usePatientHistory(id)` for side panel
4. Map response fields: `pet.owner?.name`, `pet.owner?.phone`, `pet.chip_number`
5. Medical history: map `event_type`, `title`, `date`, `notes`

### How to test Phase 4
1. Login as vet at `/vet/login`
2. Dashboard (`/vet/dashboard`): verify all stat cards show real numbers, today's schedule, pending requests
3. Patients (`/vet/patients`): search for a pet name, click a row, verify side panel shows real patient data and medical history

---

## Phase 5: Vet Reviews + Vet Analytics

### Feature Logic

**Vet Reviews** is the vet's reputation management page. After a pet owner completes an appointment, they can leave a star rating (1-5) and a written comment. This page aggregates all reviews for the logged-in vet in one place.

At the top, a stats bar provides a snapshot: the overall average rating displayed as a large number (e.g. "4.8"), a breakdown of how many reviews fall into each star tier (5-star, 4-star, etc.) visualized as horizontal progress bars with percentages, and the total review count. This data comes from `GET /vet/reviews/stats`, which computes the distribution server-side.

Below the stats, each review card shows the pet owner's avatar and name, their star rating rendered as filled/empty star icons, the review date, and their written comment. If the vet has already replied, the reply appears in a visually distinct box below the comment. If not, a "Reply" button is shown. Clicking it reveals an inline textarea where the vet types their response and submits it via `POST /vet/reviews/{id}/reply`. After submission, the reply immediately appears on the card. Replies are one-per-review — once replied, the button disappears and the reply text is shown. This lets the vet engage with their clients publicly, which is important for building trust with future pet owners browsing the vet's profile.

**Vet Analytics** gives the vet insight into their practice performance over time. The page calls `GET /vet/analytics`, which returns a bundled response containing all analytics data in a single request. The page renders four sections:

1. **KPI Cards** — appointments this month, new patients, average appointment duration, cancellation rate. Each card shows the current value and a percentage change compared to the previous period (green = positive, red = negative).
2. **Monthly Trends** — a bar chart showing appointment counts per month over the last 6 months, rendered using CSS-width bars. This helps the vet spot seasonal patterns or growth trends.
3. **Top Services** — a ranked list of the most common appointment types (e.g. "Vaccination 35%", "Checkup 25%") with percentage bars. This shows the vet what services drive their practice.
4. **Peak Hours** — a horizontal bar chart showing which hours of the day have the most appointments (e.g. 10:00-11:00 at 22%), helping with scheduling and staffing decisions.
5. **Patient Types** — a breakdown of pet species (Dogs 65%, Cats 30%, Other 5%) with emoji icons, showing the vet's patient demographic.

### 5A — Vet Reviews

**File:** `vetly-front/app/vet/(dashboard)/reviews/page.tsx`

**Mock to remove:** `mockReviews` — `[{ id, userName, userImage, rating, date, comment, reply }]`

**UI features:**
- Stats bar: average rating (large), 5-star distribution with progress bars, total count
- Review cards: user avatar, name, stars, date, comment, reply box
- Reply button opens inline textarea
- Submit reply

**Backend endpoints (EXIST):**
```
GET  /api/v1/vet/reviews       → { items: [ReviewDetailResponse], total, page, page_size }
GET  /api/v1/vet/reviews/stats → { total_reviews, average_rating, rating_distribution: [{ rating, count, percentage }] }
POST /api/v1/vet/reviews/{id}/reply → body: { reply: string } → ReviewDetailResponse
```

**ReviewDetailResponse:**
```json
{
  "id": "uuid", "rating": 5, "comment": "string", "reply": "string|null",
  "created_at": "datetime",
  "pet_owner": { "id": "uuid", "name": "string", "image_url": "string|null" }
}
```

**New hooks to add in `useVetData.ts`:**
- `useVetReviews(page?)` → calls `GET /vet/reviews`
- `useVetReviewStats()` → calls `GET /vet/reviews/stats`
- `replyToReview(reviewId, reply)` → calls `POST /vet/reviews/{id}/reply`

**Implementation steps:**
1. Add hooks to `useVetData.ts`
2. Replace stats bar with `useVetReviewStats()` data — map `rating_distribution` to progress bars
3. Replace review list with `useVetReviews()` — map `review.pet_owner?.name`, `review.pet_owner?.image_url`
4. Wire reply form to `replyToReview()` then `refetch()`

### 5B — Vet Analytics

**File:** `vetly-front/app/vet/(dashboard)/analytics/page.tsx`

**Mocks to remove:**
- `stats` — `[{ label, value, change, positive }]`
- `monthlyData` — `[{ month, appointments }]`
- `topServices` — `[{ name, count, percentage }]`
- Peak hours and patient types: hardcoded inline

**Backend endpoint (EXISTS):**
```
GET /api/v1/vet/analytics → FullAnalyticsResponse {
  dashboard: { total_patients, total_appointments, pending_appointments, today_appointments, completed_this_month, average_rating, total_reviews },
  appointment_trends: { items: [{ date, count }], total, period_start, period_end },
  service_breakdown: { items: [{ service_type, count, percentage }], total },
  peak_hours: { items: [{ hour, count, percentage }], busiest_hour, total_appointments },
  patient_types: { items: [{ pet_type, count, percentage }], total }
}
```

**New hook to add in `useVetData.ts`:**
- `useFullAnalytics()` → calls `GET /vet/analytics`

**Implementation steps:**
1. Add `useFullAnalytics()` hook
2. Map `dashboard` stats to the 4 stat cards
3. Map `appointment_trends.items` to bar chart (date → count)
4. Map `service_breakdown.items` to top services section
5. Map `peak_hours.items` to peak hours bars
6. Map `patient_types.items` to patient type breakdown

### How to test Phase 5
1. Login as vet
2. Reviews (`/vet/reviews`): verify reviews load, stats bar shows distribution, reply to a review
3. Analytics (`/vet/analytics`): verify all sections show real data from the database

---

## Phase 6: Vet Settings + Vet Schedule

### Feature Logic

**Vet Settings** is where the vet manages their professional profile — the information that pet owners see when browsing the vet directory or viewing the vet's detail page. On page load, the form is pre-filled by fetching the current profile from `GET /vets/me`. The form has two distinct sections:

1. **Profile Info** — name, specialty, email (read-only), phone, address, city, description (bio text), and license number (read-only). A profile photo section at the top shows the current avatar with an upload button. The vet edits fields inline and clicks "Save" to submit via `PUT /vets/me`. Only changed fields are sent. After a successful save, a success notification confirms the update. The vet's public profile on `/vets/{id}` immediately reflects these changes.

2. **Working Hours** — a grid showing Monday through Sunday, each row with an "Open" checkbox, an opening time input, and a closing time input. When the checkbox is unchecked, the day shows "Closed" and the time inputs are hidden. This data is stored as a JSON object in the `hours` column of the vets table and saved via `PUT /vets/me/hours`. Pet owners see these hours on the vet's public profile page, helping them understand when the clinic is open before booking. The on-call toggle (`PATCH /vets/me/on-call`) lets the vet mark themselves as available for emergency calls.

**Vet Schedule** is a weekly calendar view that gives the vet a bird's-eye view of their appointment load across the entire week. The page computes the current week's Monday-through-Sunday date range and fetches all appointments within that window using `GET /vet/appointments?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`.

The calendar renders as a grid: the leftmost column shows time slots from 09:00 to 17:00 (one row per hour), and the remaining 7 columns represent each day of the week with the actual date shown in the header (e.g. "Mon 10/2"). Today's column is visually highlighted with a distinct background color. Each appointment is placed in the correct cell based on its `scheduled_at` datetime — the day determines the column, the hour determines the row. The cell shows the pet's name and the appointment type in a colored block.

Navigation buttons let the vet move to the previous week, jump to "Today" (current week), or advance to the next week. Each navigation action recalculates the date range and re-fetches appointments. This view helps the vet plan their week, identify busy days, and spot gaps for scheduling new patients.

### 6A — Vet Settings

**File:** `vetly-front/app/vet/(dashboard)/settings/page.tsx`

**Mocks to remove:**
- `formData` — `{ name, specialty, email, phone, address, city, description, licenseNumber }`
- `hours` — working hours per day `{ open, close, closed }`

**UI features:**
- Profile photo with upload button
- Form: Name, Specialty, Email, Phone, Address, City, Description, License Number
- Working hours: each day has checkbox (open/closed) + open/close time inputs
- Save button

**Backend endpoints (EXIST):**
```
GET  /api/v1/vets/me        → VetResponse (all vet fields + hours JSON)
PUT  /api/v1/vets/me        → body: { name?, specialty?, phone?, address?, city?, description?, image_url? }
PUT  /api/v1/vets/me/hours  → body: { hours: { monday: { open, close, closed }, ... } }
PATCH /api/v1/vets/me/on-call → body: { is_on_call: boolean }
```

**New hooks to add in `useVetData.ts`:**
- `useVetProfile()` → calls `GET /vets/me`
- `updateVetProfile(data)` → calls `PUT /vets/me`
- `updateVetHours(data)` → calls `PUT /vets/me/hours`

**Implementation steps:**
1. Add hooks
2. On mount, fetch profile with `useVetProfile()`, populate form
3. Wire Save button → `updateVetProfile()` for basic info + `updateVetHours()` for hours
4. Show success/error toast on save

### 6B — Vet Schedule

**File:** `vetly-front/app/vet/(dashboard)/schedule/page.tsx`

**Mocks to remove:**
- `mockSchedule` — `[{ time, appointments: [{ day, name, type }] }]`

**UI features:**
- Week navigation: Previous/Today/Next buttons
- Weekly grid: time column (09:00-17:00) + 7 day columns
- Today's column highlighted
- Appointment blocks in grid cells (pet name + type)

**Backend endpoint (EXISTS):**
```
GET /api/v1/vet/appointments?date_from=2024-02-10&date_to=2024-02-16
→ { items: [AppointmentDetailResponse], total, page, page_size }
```

Each `AppointmentDetailResponse` has `scheduled_at` (datetime), `type`, `pet: { name }`.

**New hook to add in `useVetData.ts`:**
- `useWeekAppointments(weekStart, weekEnd)` → calls `GET /vet/appointments?date_from=X&date_to=Y`

**Implementation steps:**
1. Add `useWeekAppointments()` hook
2. Compute current week start/end dates, update on prev/next click
3. Fetch appointments for the week range
4. Map each appointment to its grid cell by extracting day-of-week and hour from `scheduled_at`
5. Highlight today's column

### How to test Phase 6
1. Login as vet
2. Settings (`/vet/settings`): verify form pre-fills with real profile data, change a field, save, refresh to confirm persistence
3. Schedule (`/vet/schedule`): verify weekly grid shows real appointments, navigate weeks

---

## Phase 7: Owner Medical History + Medications *(NEW BACKEND)*

### Feature Logic

**Owner Medical History** gives pet owners a chronological timeline of every medical event across all their pets — vaccinations, checkups, surgeries, dental procedures, dermatology visits. This is the owner's "health diary" and one of the most valuable features for responsible pet ownership.

The page starts with a row of pet filter buttons: "All" (default) plus one button per pet with its avatar and name. When "All" is selected, the timeline shows events from every pet, with each event card including the pet's avatar so the owner can distinguish which pet the event belongs to. When a specific pet is selected, only that pet's events are shown and the pet avatar is hidden from individual cards since it's redundant.

The timeline itself is a vertical layout with a thin line running down the left side, and colored dots marking each event. Events are sorted newest-first. Each event card shows: an event type badge with a color-coded icon (green for vaccination, blue for checkup, red for surgery, purple for dental, amber for dermatology), the event title (e.g. "Rabies Vaccination"), the veterinarian who performed it, the date with full month/year, and detailed notes. This layout makes it easy to scan a pet's complete medical history at a glance.

This phase requires a **new backend endpoint** because the existing medical history endpoint (`GET /vet/patients/{pet_id}/history`) is vet-facing — it verifies that the pet has had appointments with that vet. The owner-facing endpoint instead verifies that the pet belongs to the logged-in owner.

**Owner Medications** is a medication tracking and reminder system. Pet owners often manage daily or weekly medications for their pets (anti-parasitic, vitamins, chronic condition drugs), and forgetting a dose can have health consequences. This page makes it easy to see what's due and when.

The page has two tabs: **Active** (currently prescribed medications) and **Inactive** (completed or discontinued). Each medication card shows the pet's avatar and name, the medication name, dosage instructions (e.g. "1 tablet, 250mg"), frequency (daily/weekly/monthly), start date (and end date if applicable, or "Continuous" if open-ended), any special notes from the vet, and — crucially — a **next dose countdown**. The countdown is computed client-side from the medication's `frequency` and `time` fields: "Today" (highlighted in amber as urgent), "Tomorrow", "In 2 days", etc. Medications due within 24 hours get a visual urgency highlight (amber border and background). Each active medication has a "Log Dose" button that the owner clicks when they administer the medication, creating a record.

This phase requires a **new backend endpoint** because no owner-facing medications endpoint exists yet. The `Medication` model already stores all needed fields (`name`, `dosage`, `frequency`, `time`, `start_date`, `end_date`, `is_active`), so the backend work is writing the query that joins medications through pets to the current owner.

### 7A — Owner Medical History

**File:** `vetly-front/app/owner/(dashboard)/medical/page.tsx`

**Mock to remove:**
- `mockPets` — `[{ id, name, image }]`
- `mockMedicalEvents` — `[{ id, petId, date, type, title, vet, notes }]`

**Event types:** Vaccination (green), Checkup (blue), Surgery (red), Dental (purple), Dermatology (amber)

**UI features:**
- Pet filter buttons (All + per-pet)
- Timeline view: vertical line with dots, events sorted newest-first
- Each event: type badge, title, vet name, date, notes
- Pet avatar shown in "All" mode

**Backend endpoints to CREATE:**
```
GET /api/v1/owner/pets/{pet_id}/medical-history
Auth: Pet Owner
Response: { items: [{ id, pet_id, vet_id, date, title, notes, event_type, created_at }], total }
```
- Reuse `MedicalEventResponse` schema from `vetly-back/app/schemas/pet.py`
- Repository: query `MedicalEvent` where `pet.pet_owner_id == current_owner.id`
- Verify pet ownership before returning

**New hook to add in `useOwnerData.ts`:**
- `usePetMedicalHistory(petId?)` → if no petId, fetch for all owner's pets

**Implementation steps:**
1. Backend: Add endpoint to `owner.py`, add repo method, add service method
2. Frontend: Add hook, replace mocks, wire pet filter buttons

### 7B — Owner Medications

**File:** `vetly-front/app/owner/(dashboard)/medications/page.tsx`

**Mock to remove:** `mockMedications` — `[{ id, petId, petName, petImage, name, dosage, frequency, startDate, endDate, nextDose, notes, isActive }]`

**UI features:**
- Tabs: Active / Inactive
- Cards: pet image, medication name, dosage, frequency, start/end dates, next dose countdown, notes
- "Log Dose" button for active meds
- Urgent highlight for meds due within 24hrs

**Backend endpoints to CREATE:**
```
GET /api/v1/owner/medications?active=true|false
Auth: Pet Owner
Response: [{
  id, pet_id, name, dosage, frequency, time, start_date, end_date, notes, is_active,
  pet: { id, name, image_url }
}]
```
- Join `Medication → Pet` where `pet.pet_owner_id == current_owner.id`
- DB model `Medication` already has: name, dosage, frequency, time, start_date, end_date, notes, is_active

**New hook to add in `useOwnerData.ts`:**
- `useMyMedications(active?)` → calls `GET /owner/medications`

**Implementation steps:**
1. Backend: Create `OwnerMedicationResponse` schema with nested pet info
2. Backend: Add repo/service/endpoint for medications
3. Frontend: Add hook, replace mocks, compute days-until-next-dose client-side

### How to test Phase 7
1. Login as owner
2. Medical (`/owner/medical`): verify timeline shows events from DB, pet filter works
3. Medications (`/owner/medications`): verify active/inactive tabs, pet info, dosage details

---

## Phase 8: Owner Reviews *(NEW BACKEND)*

### Feature Logic
This is the counterpart to Phase 5's vet reviews page — here the pet owner sees all the reviews **they** have written, and can create new ones. The review system is a two-sided conversation: the owner writes a review after a completed appointment, and the vet can reply (Phase 5). This page manages the owner's side of that exchange.

The page lists all reviews the owner has submitted. Each review card shows the vet's photo, name, and specialty (so the owner remembers which clinic they reviewed), the pet name and appointment type that the review is for, the date the review was written, a star rating (1-5 rendered as filled star icons), the owner's written comment, and — if the vet has replied — the vet's response in a visually distinct reply box. Each card has Edit and Delete buttons so the owner can modify or remove their feedback.

At the top, a "Write Review" button opens a modal form. The form has a star selector (clickable stars, 1-5) and a textarea for the comment. The owner selects which vet/appointment they're reviewing (from their completed appointments that don't yet have reviews). On submit, the review is created via `POST /owner/reviews` and immediately appears in the list. Editing opens the same modal pre-filled with the existing rating and comment. Deleting shows a confirmation dialog before calling `DELETE /owner/reviews/{id}`.

This phase requires **new backend CRUD endpoints** because the existing review endpoints are vet-facing (list reviews *about* a vet, reply to reviews). The owner needs endpoints to list reviews *they wrote*, create new reviews, and edit/delete their own. The backend must validate that the owner can only review vets they've actually had appointments with, and can only edit/delete their own reviews.

**File:** `vetly-front/app/owner/(dashboard)/reviews/page.tsx`

**Mock to remove:** `mockReviews` — `[{ id, vetId, vetName, vetSpecialty, vetImage, petName, appointmentType, rating, comment, reply, date }]`

**UI features:**
- Review list: vet image, vet name + specialty, pet name, appointment type, date
- Star rating display
- Comment text + vet reply (if exists)
- Edit / Delete buttons
- "Write Review" modal with star selector + textarea

**Backend endpoints to CREATE:**
```
GET    /api/v1/owner/reviews         → [{ id, vet_id, rating, comment, reply, created_at, vet: { id, name, specialty, image_url }, appointment: { type, pet: { name } } }]
POST   /api/v1/owner/reviews         → body: { vet_id, appointment_id?, rating (1-5), comment }
PUT    /api/v1/owner/reviews/{id}    → body: { rating?, comment? }
DELETE /api/v1/owner/reviews/{id}    → 204
```

**New hooks to add in `useOwnerData.ts`:**
- `useMyReviews()` → `GET /owner/reviews`
- `createReview(data)` → `POST /owner/reviews`
- `updateReview(id, data)` → `PUT /owner/reviews/{id}`
- `deleteReview(id)` → `DELETE /owner/reviews/{id}`

**Implementation steps:**
1. Backend: Create `OwnerReviewResponse` schema with nested vet info
2. Backend: Add owner review repo/service/endpoints (CRUD)
3. Backend: Validate owner can only edit/delete their own reviews
4. Frontend: Add hooks, replace mocks, wire form + edit/delete actions

### How to test Phase 8
1. Login as owner
2. Reviews (`/owner/reviews`): verify existing reviews load
3. Write a new review, verify it appears
4. Edit the review, delete it

---

## Phase 9: Owner Notifications *(NEW BACKEND)*

### Feature Logic
Notifications keep the pet owner informed about events that need their attention without requiring them to manually check each page. The notification system covers five categories, each with its own color-coded icon: **appointment** (green — booking confirmations, cancellations, reminders), **medication** (amber — dose reminders, prescription updates), **reply** (indigo — when a vet replies to the owner's review), **reminder** (blue — general reminders like annual checkup due), and **system** (gray — platform announcements, account updates).

The page loads all notifications for the logged-in owner, sorted newest-first. Each notification card shows the type icon, a title (e.g. "Appointment Confirmed"), a message body with details, and a relative timestamp ("5 minutes ago", "2 hours ago", "3 days ago") computed client-side from `created_at`. Unread notifications are visually distinct — they have a teal dot indicator on the left edge and a subtle teal-tinted background, making them immediately scannable.

The interaction model is simple: clicking an unread notification marks it as read via `PATCH /owner/notifications/{id}/read`, which removes the dot and background highlight. The header shows a count of unread notifications (e.g. "3 Μη αναγνωσμένες"). When there are unread notifications, a "Mark all as read" button appears in the header — clicking it calls `POST /owner/notifications/mark-all-read` and clears all indicators at once.

This phase requires **new backend endpoints**. The `Notification` model already exists in the database with all needed fields (`pet_owner_id`, `type`, `title`, `message`, `is_read`, `created_at`), and the seed script already creates sample notifications. The backend work is exposing these through owner-authenticated API endpoints and adding the mark-as-read mutation logic.

**File:** `vetly-front/app/owner/(dashboard)/notifications/page.tsx`

**Mock to remove:** `mockNotifications` — `[{ id, type, title, message, date, isRead }]`

**Notification types:** medication (amber), appointment (green), reply (indigo), reminder (blue), system (slate)

**UI features:**
- Notification list sorted newest-first
- Unread dot indicator (teal), highlighted background
- Click to mark as read
- "Mark all as read" button
- Unread count in header
- Relative time format (minutes/hours/days ago)

**Backend endpoints to CREATE:**
```
GET   /api/v1/owner/notifications              → [{ id, type, title, message, is_read, created_at }]
PATCH /api/v1/owner/notifications/{id}/read    → mark single as read
POST  /api/v1/owner/notifications/mark-all-read → mark all as read
```
- DB model `Notification` already has: pet_owner_id, vet_id, type, title, message, is_read

**New hooks to add in `useOwnerData.ts`:**
- `useMyNotifications()` → `GET /owner/notifications`
- `markNotificationRead(id)` → `PATCH /owner/notifications/{id}/read`
- `markAllNotificationsRead()` → `POST /owner/notifications/mark-all-read`

**Implementation steps:**
1. Backend: Add notification repo/service/endpoints
2. Frontend: Add hooks, replace mocks, wire click-to-read + mark-all

### How to test Phase 9
1. Login as owner
2. Notifications (`/owner/notifications`): verify notifications load from DB
3. Click a notification → mark as read (dot disappears)
4. Click "Mark all as read"

---

## Phase 10: Owner Settings + Pet CRUD *(NEW BACKEND)*

### Feature Logic
This final phase completes the owner's self-service capabilities — managing their own profile and having full control over their pet records.

**Owner Settings** is the account management page. On load, it fetches the owner's current profile from `GET /auth/pet-owner/me` and pre-fills a form with their name, email (read-only — used for login), phone number, and address. A profile photo section at the top shows the owner's avatar (or initials fallback) with an upload button. The owner edits fields and clicks "Save" to persist via `PUT /owner/profile`.

Below the profile form, a **Notification Preferences** section has three toggles: appointment reminders (email before upcoming visits), medication reminders (alerts when a dose is due), and marketing newsletters. These are boolean flags that let the owner control what notifications they receive.

A **Security** section provides buttons for "Change Password" (opens a form with current password + new password + confirm, submitted via `PUT /owner/password`) and "Device Management" (future feature showing active sessions). At the bottom, a red **Danger Zone** section has an "Delete Account" button with a confirmation dialog — this is destructive and requires explicit confirmation.

**Pet CRUD** extends the existing Pets page (Phase 2) with create, edit, and delete capabilities. Currently the pets page only displays pets — after this phase, the owner can fully manage their pet records:

- **Add Pet**: An "Add Pet" button at the bottom of the pet list opens a modal form with fields for name, type (Dog/Cat/Other dropdown), breed, age, weight, gender (Male/Female), microchip number (optional), and photo URL. On submit, `POST /owner/pets` creates the pet and it immediately appears in the list.
- **Edit Pet**: The "Edit Profile" button in the pet detail panel (already present but non-functional since Phase 2) opens the same modal pre-filled with the pet's current data. On submit, `PUT /owner/pets/{id}` updates the record. Only the pet's owner can edit it — the backend validates ownership.
- **Delete Pet**: A delete button (red, in the detail panel) shows a confirmation dialog warning that this will also remove all associated medical history, medications, and appointments. On confirm, `DELETE /owner/pets/{id}` removes the pet. The list auto-refreshes and selects the next available pet, or shows an empty state if no pets remain.

This phase requires the most new backend endpoints of any phase (5 total), covering both profile management and full pet lifecycle CRUD with ownership validation on every mutation.

### 10A — Owner Settings

**File:** `vetly-front/app/owner/(dashboard)/settings/page.tsx`

**Mocks to remove:** `formData` state, `notifications` preferences state

**UI features:**
- Profile section: avatar, name, email
- Form: Name, Email, Phone, Address
- Notification toggles: appointments, medications, marketing
- Security: Change Password, Device Management
- Danger zone: Delete Account
- Save button

**Backend endpoints to CREATE:**
```
GET /api/v1/auth/pet-owner/me          → PetOwnerResponse (already exists)
PUT /api/v1/owner/profile              → body: { name?, phone?, address?, image_url? }
PUT /api/v1/owner/password             → body: { current_password, new_password }
```

### 10B — Pet CRUD

Extends the existing **Pets page** (`vetly-front/app/owner/(dashboard)/pets/page.tsx`).

**Backend endpoints to CREATE:**
```
POST   /api/v1/owner/pets           → body: { name, type, breed, age, weight, gender, chip_number?, image_url? }
PUT    /api/v1/owner/pets/{id}      → body: { name?, breed?, age?, weight?, image_url? }
DELETE /api/v1/owner/pets/{id}      → 204
```
- Validate pet ownership on update/delete

**New hooks to add in `useOwnerData.ts`:**
- `updateOwnerProfile(data)` → `PUT /owner/profile`
- `createPet(data)` → `POST /owner/pets`
- `updatePet(id, data)` → `PUT /owner/pets/{id}`
- `deletePet(id)` → `DELETE /owner/pets/{id}`

**Implementation steps:**
1. Backend: Add profile update endpoint + pet CRUD endpoints
2. Frontend Settings: fetch profile on mount, prefill form, wire Save
3. Frontend Pets: add "Add Pet" modal, "Edit" button in detail panel, "Delete" with confirmation dialog

### How to test Phase 10
1. Login as owner
2. Settings (`/owner/settings`): change name, save, refresh to verify
3. Pets (`/owner/pets`): add a new pet, edit its details, delete it

---

## Architecture Reference

### Backend Pattern (for new endpoints)

```
Repository (DB queries) → Service (business logic) → Endpoint (HTTP handler)
```

**Files to touch for a new feature:**
1. `vetly-back/app/schemas/owner.py` — add request/response Pydantic models
2. `vetly-back/app/repositories/owner.py` — add DB query methods
3. `vetly-back/app/services/owner.py` — add business logic
4. `vetly-back/app/api/v1/endpoints/owner.py` — add route handlers

### Frontend Pattern (for wiring)

```
Hook (API call + state) → Page (UI + data binding)
```

**Files to touch:**
1. `vetly-front/hooks/useOwnerData.ts` or `useVetData.ts` — add hook
2. `vetly-front/app/owner|vet/(dashboard)/*/page.tsx` — import hook, replace mocks

### Hook Pattern
```typescript
export function useMyData() {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await api.get<DataType[]>('/endpoint');
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  return { data, loading, error, refetch: fetchData };
}
```

### Date Formatting (Greek locale)
```typescript
// Full date: "Τρί 25 Φεβρουαρίου 2026"
new Date(dateStr).toLocaleDateString('el-GR', {
  weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
});

// Time: "10:30"
new Date(dateStr).toLocaleTimeString('el-GR', {
  hour: '2-digit', minute: '2-digit'
});
```
