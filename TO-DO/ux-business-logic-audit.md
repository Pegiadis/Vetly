# Vetly UX & Business Logic Audit

> Generated: 2026-03-13
> Branch: `feature/add-sign-up-logic`
> Perspective: Pet Owner & Vet user journeys

---

## A. PET OWNER JOURNEY

### Registration & Login

- [ ] **A1. Double API call on registration**
  - **Files:** `vetly-front/app/register/page.tsx:71-82`
  - After registering, the frontend makes a separate login call to get a token. If the login call fails (network hiccup), the user is stuck — account created but not logged in, with no feedback.
  - **Fix:** Backend should return a token directly on registration.

- [ ] **A2. "Forgot password?" is a dead link**
  - **File:** `vetly-front/app/owner/login/page.tsx:130`
  - Links to `#`. Users who forget their password are permanently locked out.
  - **Fix:** Implement password reset flow or remove the link to avoid confusion.

- [ ] **A3. "Remember Me" checkbox does nothing**
  - **File:** `vetly-front/app/owner/login/page.tsx:120-127`
  - The checkbox state is tracked but never used. Token always goes to `localStorage` regardless.
  - **Fix:** Implement (use `sessionStorage` when unchecked) or remove the checkbox.

- [ ] **A4. No visible password strength indicator**
  - **Files:** Registration pages for both owner and vet
  - Minimum is 6 characters but user gets no feedback about password strength. For a production app handling personal/medical data, this is weak.
  - **Suggestion:** Add a strength meter or at least require uppercase + number.

- [ ] **A4b. Auth context detects user type from URL, not from API**
  - **File:** `vetly-front/contexts/AuthContext.tsx:36-42`
  - `detectUserTypeFromPath()` determines if you're a vet or owner based on the URL. If a vet accidentally logs in from `/owner/login`, the token is stored under the wrong key. This causes silent auth failures when navigating to vet pages.
  - **Fix:** Determine user type from the JWT payload or API response, not URL path.

### Homepage & Public Pages (New User Experience)

- [ ] **A4c. Homepage hero search does nothing**
  - **File:** `vetly-front/components/HomePage.tsx:22-28`
  - The main search bar's submit handler is `console.log('Search:', searchText)`. Clicking "Αναζήτηση" does nothing. This is the primary CTA on the landing page.
  - **Fix:** Navigate to `/vets?search=${searchText}`.

- [ ] **A4d. Homepage quick tags and service cards are placeholders**
  - **File:** `vetly-front/components/HomePage.tsx:99,125,143`
  - Quick search tags ("Εμβολιασμός", "Έκτακτη Ανάγκη", etc.) all `console.log`. Two of three service cards ("Βρείτε Κτηνίατρο", "Έκτακτη Ανάγκη") don't navigate.
  - **Impact:** New visitors can't use any of the homepage actions. App appears broken.

- [ ] **A4e. "Είσοδος / Εγγραφή Ιατρού" button routes to owner login**
  - **File:** `vetly-front/components/HomePage.tsx:268`
  - The vet signup CTA on the homepage routes to `/login` (which is the owner login). Vets trying to register from the homepage land on the wrong page.
  - **Fix:** Route to `/vet/register`.

- [ ] **A4f. Vet public profile doesn't show services/pricing**
  - **File:** `vetly-front/app/vets/[id]/page.tsx`
  - Backend has a public services endpoint (`/public/vets/{id}/services`) but the vet profile page never calls it. Owners can't see pricing before booking.

- [ ] **A4g. Invite registration allows changing the email**
  - **File:** `vetly-front/app/invite/[token]/page.tsx:209-221`
  - When a vet invites a client, the pre-filled email is fully editable. The invited person can register with a different email, breaking the vet-client link.
  - **Fix:** Make the email field `readOnly` when pre-filled from invite.

- [ ] **A4h. `/pet-owners` page is completely empty**
  - **File:** `vetly-front/app/pet-owners/page.tsx`
  - Just shows `<h1>Pet Owners</h1>` with no content. Discoverable via URL.
  - **Fix:** Delete or redirect to homepage.

- [ ] **A4i. Page title says "Vetly - Είσοδος" on all pages**
  - **File:** `vetly-front/app/layout.tsx:8-11`
  - Browser tab shows login text even on homepage. Bad for SEO and branding.

### Booking Appointments

- [ ] **A5. Duration hardcoded to 30 minutes**
  - **Files:** `vetly-front/app/owner/(dashboard)/book/page.tsx:530`, `on-call/page.tsx:56`
  - Every appointment is created with `duration_minutes: 30`, even though services have their own durations. A surgery and a simple checkup both show as 30 minutes.
  - **Impact:** Vet's schedule is inaccurate; appointments can overlap in reality even if the system says they don't.
  - **Fix:** Use the selected service's duration, or let the owner/vet choose.

- [ ] **A6. Newly registered vets are invisible to owners**
  - **File:** `vetly-back/app/repositories/owner.py` — `get_all_vets(verified_only=True)`
  - New vets have `is_verified=False` by default. No verification mechanism exists. Vets who register will never appear in the booking flow or search results.
  - **Impact:** Complete blocker — new vets can't receive any appointments from non-invited owners.
  - **Fix:** Either auto-verify vets on registration, or build an admin panel to manage verification.

- [ ] **A7. Owner can't see vet's working hours during booking**
  - **File:** `vetly-front/app/owner/(dashboard)/book/page.tsx`
  - The booking flow shows available slots but doesn't display the vet's working hours. The owner can't tell if a vet works mornings or evenings before selecting them.
  - **Suggestion:** Show working hours on the vet card in step 2.

- [ ] **A8. No appointment type selection linked to vet services**
  - **File:** `vetly-front/app/owner/(dashboard)/book/page.tsx`
  - Step 1 lets the owner select from generic hardcoded types (Εξέταση, Εμβολιασμός, etc.). These are not linked to the vet's actual services or pricing.
  - **Impact:** Owner might select a type the vet doesn't offer. Prices shown may not match.
  - **Fix:** After selecting a vet, show only that vet's available services with prices.

- [ ] **A9. Booking past dates is possible**
  - **File:** `vetly-back/app/schemas/appointment.py`
  - No `@field_validator` on `scheduled_at`. Users can book appointments in the past (e.g., 2020). The frontend uses `minDate={new Date()}` but the backend doesn't validate.
  - **Fix:** Add server-side validation: `scheduled_at > now()`.

- [ ] **A10. On-call booking uses teal accent instead of red**
  - **File:** `vetly-front/app/owner/(dashboard)/on-call/page.tsx:318`
  - The on-call page uses red theme for the progress bar and buttons (emergency feel), but the calendar picker uses `accentColor="teal"` — inconsistent.
  - **Fix:** Use `accentColor="red"` for the on-call calendar to match the emergency theme.

- [ ] **A11. On-call type is hardcoded to "Emergency"**
  - **File:** `vetly-front/app/owner/(dashboard)/on-call/page.tsx:55`
  - Every on-call appointment gets `type: 'Emergency'`. Owner can't specify if it's a different urgency level.

### Appointments Management

- [ ] **A12. Reschedule doesn't check for vet conflicts (backend)**
  - **File:** `vetly-back/app/services/owner.py:252-281`
  - `reschedule_appointment` changes the time but doesn't call `has_conflicting_appointment()`. Double-booking is possible.
  - **Impact:** Vet could end up with two appointments at the same time.

- [ ] **A13. Rescheduled appointment goes back to PENDING**
  - **File:** `vetly-back/app/services/owner.py`
  - After reschedule, status becomes PENDING again. The user isn't clearly told they need to wait for re-confirmation.
  - **Fix:** Show a clear message: "Your appointment has been rescheduled and is awaiting confirmation."

- [ ] **A14. No way to view appointment details (expanded view)**
  - **File:** `vetly-front/app/owner/(dashboard)/appointments/page.tsx`
  - The appointments list shows basic info but there's no detailed view with medical notes, prescriptions, medications from completed appointments.
  - **Suggestion:** Add a detail panel/page showing full appointment history including examination results.

### Pets Management

- [ ] **A15. Pet type only supports Dog/Cat/Other**
  - **File:** `vetly-front/app/owner/(dashboard)/pets/page.tsx`
  - The pet type dropdown only offers Dog, Cat, Other. Missing common pets: Bird, Rabbit, Hamster, Fish, Reptile, etc.
  - **Impact:** Greek pet owners with birds or rabbits must select "Other" with no emoji or icon support.

- [ ] **A16. No confirmation when soft-deleting a pet**
  - **File:** `vetly-front/app/owner/(dashboard)/pets/page.tsx`
  - Deleting a pet requires only a single click. For a destructive action (even if soft-delete), a confirmation dialog should be shown.
  - **Note:** Actually confirmed there IS a confirm dialog — this is OK. Skip.

### Settings

- [ ] **A17. Notification toggles don't persist**
  - **File:** `vetly-front/app/owner/(dashboard)/settings/page.tsx`
  - The notification preferences (Ειδοποιήσεις Ραντεβού, Υπενθυμίσεις, Ενημερώσεις) are cosmetic toggles. They reset on page refresh because they're not saved to the backend.
  - **Impact:** Users think they've configured notifications, but nothing actually changed.
  - **Fix:** Either connect to a backend endpoint to save preferences, or remove the toggles.

### Reviews

- [ ] **A18. Delete review has no confirmation dialog**
  - **File:** `vetly-front/app/owner/(dashboard)/reviews/page.tsx:101-111`
  - Clicking "Διαγραφή" immediately deletes the review with no confirmation. Silent failure on error (empty `catch {}`).
  - **Fix:** Add confirmation dialog before deletion. Show error toast on failure.

- [ ] **A19. All review operations silently fail**
  - **File:** `vetly-front/app/owner/(dashboard)/reviews/page.tsx:69,94,106`
  - Create, update, and delete all have `catch { // Error handled silently }`. User gets no feedback if something goes wrong.
  - **Fix:** Show error messages on failure.

### Notifications

- [ ] **A20. Mark-as-read silently fails**
  - **File:** `vetly-front/app/owner/(dashboard)/notifications/page.tsx:79,89`
  - Both `handleMarkRead` and `handleMarkAllRead` catch and swallow errors. If the API call fails, the UI looks like nothing happened but the notification stays unread.

- [ ] **A21. "X λεπτά πριν" shows "0 λεπτά πριν" for fresh notifications**
  - **File:** `vetly-front/app/owner/(dashboard)/notifications/page.tsx:60`
  - `Math.floor(diffMs / 60000)` = 0 for anything under 1 minute. Should show "Μόλις τώρα" for < 1 minute.

---

## B. VET JOURNEY

### Dashboard & Appointments

- [ ] **B1. Approve/Reject appointment silently fails**
  - **Files:** `vetly-front/app/vet/(dashboard)/appointments/page.tsx:196-198`, `pending/page.tsx:77,91`
  - Empty `catch {}` blocks on approve/reject. If the API call fails (network issue, conflict), the vet sees no error message — the appointment just stays in the same state with no explanation.
  - **Impact:** Vet thinks the action worked, but it didn't.
  - **Fix:** Show error toast/message on failure.

- [ ] **B2. Vet-created appointments skip conflict check**
  - **File:** `vetly-back/app/services/appointment.py:44-83`
  - When a vet creates an appointment from their dashboard, the backend doesn't check for double-booking. Only the owner booking flow checks.
  - **Impact:** Vet can accidentally book two patients at the same time.

- [ ] **B3. No appointment status transition validation**
  - **File:** `vetly-back/app/services/appointment.py:174`
  - `update_status()` accepts any status change. A COMPLETED appointment can go back to PENDING, or a CANCELLED one to CONFIRMED.
  - **Fix:** Implement a state machine: PENDING → CONFIRMED → COMPLETED, with CANCELLED as terminal.

- [ ] **B4. Group approve/reject only processes the first appointment**
  - **File:** `vetly-front/app/vet/(dashboard)/pending/page.tsx:254-269`
  - The "Έγκριση Όλων" / "Απόρριψη Όλων" buttons only call `handleApprove(first.id, e)` — they only process the first appointment in the group, not all of them.
  - **Impact:** Multi-pet appointment groups are only partially approved/rejected.
  - **Fix:** If backend cascading works, this is fine. If not, loop through all group IDs.

- [ ] **B5. Examination dialog may be hard to find**
  - **File:** `vetly-front/app/vet/(dashboard)/dashboard/page.tsx`
  - The "complete examination" flow is embedded in the dashboard's daily schedule, not in the appointments page. Vets may look for it in the wrong place.
  - **Suggestion:** Also allow completing examinations from the appointments detail view.

### Schedule

- [ ] **B6. Working hours not enforced on booking**
  - **Files:** Vet model has `hours` JSON field; booking ignores it
  - Vets can set working hours (e.g., 09:00-17:00) in settings, but the booking system doesn't validate against them. Owners can book at 03:00 AM.
  - **Fix:** Filter available slots against the vet's configured working hours.

### Clients & Invites

- [ ] **B7. Invite token has 7-day expiry with no resend option**
  - **File:** `vetly-back/app/services/vet_client.py`
  - Once an invite expires, the vet must create an entirely new client record. No "Resend invite" button exists on the frontend.
  - **Suggestion:** Add a "Resend" action that generates a new token for the same client.

### Reviews

- [ ] **B8. Vet reply to review silently fails**
  - **File:** `vetly-front/app/vet/(dashboard)/reviews/page.tsx:35-38`
  - `catch { // silently fail }`. If the reply fails, the vet gets no feedback and the reply form just closes.

- [ ] **B9. Vets can't delete or edit their own replies**
  - **File:** `vetly-front/app/vet/(dashboard)/reviews/page.tsx`
  - Once a reply is posted, it's permanent. No edit or delete option is available.
  - **Suggestion:** Allow editing replies (even if only within 24 hours).

### Analytics

- [ ] **B10. Analytics page title uses English "Analytics"**
  - **File:** `vetly-front/app/vet/(dashboard)/analytics/page.tsx:51`
  - All other pages use Greek. This page title says "Analytics" in English.
  - **Fix:** Change to "Στατιστικά" (which is already the subtitle).

- [ ] **B11. Pet type labels only map Dog/Cat/Other in analytics**
  - **File:** `vetly-front/app/vet/(dashboard)/analytics/page.tsx:12-16`
  - Same issue as owner side — only 3 pet types mapped with Greek labels.

---

## C. SHARED / CROSS-CUTTING ISSUES

### Silent Failures (Pattern across entire app)

- [ ] **C1. Empty catch blocks everywhere**
  - **Files:** Found in 10+ pages across both owner and vet dashboards
  - Pattern: `catch { // silently fail }` or `catch {}`. This makes debugging impossible and leaves users confused when actions don't work.
  - **Fix:** At minimum, show a toast/alert with "Something went wrong. Please try again." Consider a global error toast system.
  - **Affected pages:** Reviews (owner + vet), Notifications, Pending appointments, Approve/Reject, Reply to review, Mark as read

### Token & Session

- [ ] **C2. No token refresh — users get silently logged out after 24 hours**
  - **Files:** `vetly-back/app/core/config.py` (24h expiry), `vetly-front/contexts/AuthContext.tsx`
  - Token expires after 24 hours with no refresh mechanism. The next API call returns 401, but the frontend doesn't handle it — it just fails silently.
  - **Impact:** User is mid-action, data fails to load, and they don't know why.
  - **Fix:** Intercept 401 responses in `fetchApi`, clear auth state, redirect to login with a "Session expired" message.

- [ ] **C3. No "Session expired" message**
  - **File:** `vetly-front/lib/api.ts`
  - When a token expires, API calls return 401 but there's no global interceptor. Pages just show loading spinners or empty data.

### Chat (AI Assistant)

- [ ] **C4. Chat is the same for both owner and vet**
  - **Files:** `vetly-front/app/owner/(dashboard)/chat/page.tsx`, `vetly-front/app/vet/(dashboard)/chat/page.tsx`
  - Both pages render `<ChatWindow>` with different `role` and `accentColor`. Verify that the backend actually adapts responses based on role, otherwise the "AI Βοηθός" gives the same generic answers to both.

### Reminders

- [ ] **C5. Reminders are never actually sent**
  - **File:** `vetly-back/app/services/reminder.py`
  - `process_due_reminders()` exists but is never called. No background scheduler configured. Reminders are created in the database but nothing triggers email/SMS/push notifications.
  - **Impact:** Users see reminders in the app, but they never actually get reminded of anything outside the app.

### Data Display

- [ ] **C6. Dates not localized consistently**
  - **Files:** Various pages
  - Some pages use `toLocaleDateString('el-GR')`, others format dates manually. The on-call confirmation shows raw date format `{selectedDate}` (YYYY-MM-DD) instead of localized Greek format.
  - **File:** `vetly-front/app/owner/(dashboard)/on-call/page.tsx:409`

- [ ] **C7. No loading skeleton on notifications page**
  - **File:** `vetly-front/app/owner/(dashboard)/notifications/page.tsx:93-99`
  - Shows a plain spinner instead of content-shaped skeleton loaders (unlike the dashboard which has nice skeletons).
  - **Suggestion:** Add skeleton cards for consistency.

---

## D. BUSINESS LOGIC GAPS

- [ ] **D1. Owner can review a vet multiple times**
  - **File:** Backend review creation
  - No unique constraint on (pet_owner_id, vet_id). An owner could leave 10 five-star reviews for the same vet, inflating ratings.
  - **Fix:** Either enforce one review per vet per owner, or one review per completed appointment.

- [ ] **D2. Vet rating average could become inaccurate**
  - **File:** `vetly-back/app/services/owner.py`
  - When a review is updated or deleted, is the vet's `rating_average` recalculated? If not, the average drifts from reality over time.

- [ ] **D3. No cancellation policy / time limit**
  - **File:** `vetly-back/app/services/owner.py`
  - Owners can cancel appointments 1 minute before the scheduled time. Real vet clinics typically require 24-hour notice.
  - **Suggestion:** Add a configurable cancellation deadline (e.g., 2 hours before appointment).

- [ ] **D4. Completed appointments can be cancelled**
  - **File:** `vetly-back/app/services/owner.py`
  - No status check before cancellation. A COMPLETED appointment could potentially be cancelled.
  - **Fix:** Only allow cancellation of PENDING or CONFIRMED appointments.

- [ ] **D5. No duplicate appointment prevention (same pet, same time)**
  - **File:** Backend appointment creation
  - The conflict check only looks at vet availability, not at whether the same pet already has an appointment at that time. An owner could book the same pet with two different vets at the same time.

- [ ] **D6. On-call appointments create separate records instead of batch**
  - **File:** `vetly-front/app/owner/(dashboard)/on-call/page.tsx:50-61`
  - Multi-pet on-call bookings use `Promise.all()` with individual `createAppointment` calls. If one fails, some appointments are created and others aren't — partial state.
  - **Fix:** Use the batch endpoint like the regular booking flow does.

- [ ] **D7. Vaccination reminder crashes on Feb 29 (leap year bug)**
  - **File:** `vetly-back/app/services/reminder.py:172-173`
  - `due_date = today.replace(year=today.year + 1)` throws `ValueError` when run on Feb 29 of a leap year, because the next year has no Feb 29.
  - **Impact:** Completing a vaccination appointment on Feb 29 crashes the service.
  - **Fix:** Use `today + timedelta(days=365)` instead.

- [ ] **D8. Active medications don't check end_date**
  - **File:** `vetly-back/app/repositories/owner.py:244-267`
  - The `is_active` flag doesn't account for `end_date`. A medication with a past `end_date` but `is_active=True` still shows as active to owners.
  - **Fix:** Filter by `end_date >= now()` in addition to `is_active`.

- [ ] **D9. Medications pagination breaks with client-side pet filter**
  - **File:** `vetly-front/app/owner/(dashboard)/medications/page.tsx:23-29`
  - Server-side pagination returns 10 items per page, then client-side pet filter reduces this. Pagination says "page 1 of 3" but after filtering by pet, page 2 may have zero matching items.
  - **Fix:** Apply pet filter server-side, or paginate after filtering.

- [ ] **D10. Available slots timezone mismatch**
  - **File:** `vetly-back/app/services/vet.py:159-161`
  - Uses `datetime.now()` (naive/local) while appointments may use UTC. Past slots may show as available depending on server timezone.

- [ ] **D11. Appointment type displayed in English, not Greek**
  - **File:** `vetly-front/app/owner/(dashboard)/appointments/page.tsx:333`
  - `apt.type` is displayed directly from API ("Checkup", "Vaccination") without translation. All other text is Greek.
  - **Fix:** Add a translation map for appointment types.

- [ ] **D12. Same-day appointment check is too restrictive**
  - **File:** `vetly-back/app/services/owner.py:107-114`
  - Prevents booking the same pet with the same vet twice on the same day, even at different times. Legitimate scenarios exist (morning checkup, afternoon follow-up).
  - **Suggestion:** Either remove or make this configurable per vet.

- [ ] **D13. Notifications don't link to relevant pages**
  - **File:** `vetly-front/app/owner/(dashboard)/notifications/page.tsx:135-175`
  - Notification cards display text but have no deep links. "Appointment confirmed for Bella at 3 PM" doesn't link to the appointment. Users must navigate manually.
  - **Suggestion:** Add `action_url` to notification model and render as links.

- [ ] **D14. No vet reschedule capability**
  - **Files:** `vetly-front/app/vet/(dashboard)/appointments/page.tsx`
  - Vets can cancel but not reschedule appointments. To change a time, they must cancel and create a new one, losing the appointment context.

- [ ] **D15. Dismissed reminders can't be recovered**
  - **File:** `vetly-front/app/owner/(dashboard)/reminders/page.tsx`
  - No confirmation before dismissing. No undo or archive. Accidentally dismissed vaccination reminders are gone forever.

---

## E. UX IMPROVEMENT SUGGESTIONS

- [ ] **E1. Add success toasts after actions**
  - Currently, successful actions (book, cancel, reschedule, review) redirect or reset state, but there's no confirmation toast. Users aren't sure if the action succeeded.
  - **Suggestion:** Add a lightweight toast notification system.

- [ ] **E2. Add appointment count badge on sidebar navigation**
  - Show pending appointment count on the sidebar "Ραντεβού" link for vets, so they can see at a glance if there are requests waiting.

- [ ] **E3. Add email notifications for key events**
  - Appointment confirmation, cancellation, and reminders should trigger email notifications, not just in-app database records.

- [ ] **E4. Add search/filter to owner's appointment list**
  - Owners with many appointments have to scroll through all of them. Add filters by status, vet, date range, or pet.

- [ ] **E5. Show estimated wait time or queue position for on-call**
  - On-call booking shows available vets but not how busy they are. Showing "2 appointments before you" would help owners choose.

- [ ] **E6. Add the ability for vets to block time slots**
  - Vets should be able to mark time ranges as unavailable (lunch break, meetings, vacation) without needing a full appointment entry.

- [ ] **E7. Add pet medical record PDF export for owners**
  - Vets can generate prescriptions/certificates, but owners have no way to export their pet's full medical history as a PDF.

- [ ] **E8. Add multi-language support infrastructure**
  - All strings are hardcoded in Greek. Consider using `next-intl` or similar for i18n, even if Greek is the only current language — it makes adding English or other languages much easier later.
