# Vetly Pre-Production Audit — TO-DO List

> Generated: 2026-03-13
> Branch: `feature/add-sign-up-logic`

---

## CRITICAL (Fix before launch)

- [ ] **1. Revoke exposed Gemini API key**
  - **File:** `vetly-back/.env`
  - Real API key (`AIzaSy...`) is committed to the repo. Revoke it immediately in Google Cloud Console and generate a new one. Add `.env` to `.gitignore` if not already.

- [ ] **2. Reject default SECRET_KEY in production**
  - **File:** `vetly-back/app/core/config.py:24`
  - Default is `"vetly-dev-secret-key-change-in-production"`. If `.env` doesn't override it, anyone can forge JWT tokens. App should refuse to start with the default when `ENVIRONMENT=production`.

- [ ] **3. Implement password reset flow**
  - **Files:** New backend endpoints + new frontend page
  - The "Forgot password?" link on `owner/login/page.tsx:130` is `href="#"` (dead link). No backend endpoint exists. Users who forget passwords are permanently locked out.
  - Need: `/auth/forgot-password` (sends email), `/auth/reset-password` (validates token + sets new password), frontend reset page.

- [ ] **4. Return token on registration (remove double request)**
  - **Files:** `vetly-front/app/register/page.tsx:71-82`, `vetly-front/app/vet/register/page.tsx:96-111`
  - After registration, the frontend makes a separate login request to get a token. This creates a race condition. Backend `register_vet` and `register_pet_owner` should return a token directly.

- [ ] **5. Validate that appointment dates are in the future**
  - **File:** `vetly-back/app/schemas/appointment.py`
  - Neither the schema nor the service validates that `scheduled_at` is in the future. Users can book appointments dated 2020. Add a `@field_validator` for `scheduled_at > now()`.

- [ ] **6. Set production API URL for frontend**
  - **File:** `vetly-front/lib/api.ts:7`
  - Without `NEXT_PUBLIC_API_URL` env var, the frontend defaults to `http://localhost:8000/api/v1` and breaks entirely in production. Ensure the build-time variable is always set.

---

## HIGH (Fix before real users)

- [ ] **7. Add conflict check to reschedule**
  - **File:** `vetly-back/app/services/owner.py:252-281`
  - `reschedule_appointment` changes the time but does not call `has_conflicting_appointment()`. Rescheduled appointments can double-book a vet.

- [ ] **8. Add conflict check to vet-created appointments**
  - **File:** `vetly-back/app/services/appointment.py:44-83`
  - Only the owner flow checks for double-booking; vet-created appointments skip the check entirely.

- [ ] **9. Handle token expiration on frontend**
  - **Files:** `vetly-front/lib/api.ts`, `vetly-front/contexts/AuthContext.tsx`
  - Expired tokens cause silent 401 errors. Need to intercept 401 responses in `fetchApi`, clear auth state, and redirect to login.

- [ ] **10. Add Next.js middleware for route protection**
  - **File:** Create `vetly-front/middleware.ts`
  - All auth checks are client-side only (layout `useEffect`). Protected pages flash content before redirect. Add server-side middleware to check for token cookie/header.

- [ ] **11. Disable Swagger/ReDoc in production**
  - **File:** `vetly-back/app/main.py:36-37`
  - Set `docs_url=None`, `redoc_url=None`, `openapi_url=None` when `ENVIRONMENT=production`. Full API schema is currently publicly visible.

- [ ] **12. Add auth check on uploaded files**
  - **File:** `vetly-back/app/main.py:54`
  - `StaticFiles("/uploads")` serves all uploaded photos without authentication. Anyone with a URL can access them.

- [ ] **13. Implement reminder scheduler**
  - **File:** `vetly-back/app/services/reminder.py`
  - `process_due_reminders()` exists but is never called. No background scheduler (Celery/APScheduler) is configured. Reminders are dead code.

- [ ] **14. Add appointment status transition validation**
  - **File:** `vetly-back/app/services/appointment.py:174`
  - `update_status()` accepts any valid status without validating transitions. Can go COMPLETED->PENDING or CANCELLED->CONFIRMED. Implement a state machine.

- [ ] **15. Set production CORS origins**
  - **File:** `vetly-back/app/core/config.py:31`
  - Default `ALLOWED_ORIGINS` is localhost only. If `.env` doesn't override, production frontend gets CORS errors. Consider failing startup if origins aren't configured for production.

- [ ] **16. Remove PostgreSQL port from docker-compose**
  - **File:** `deploy/docker-compose.prod.yml:10-11`
  - Port 5432 is published to the host. DB should only be accessible within the Docker network.

- [ ] **17. Enforce email verification**
  - **Files:** `PetOwner.email_verified`, `Vet.is_verified` fields
  - Fields exist but are always `False`. No verification endpoint. Either implement email verification or remove the misleading fields.

- [ ] **18. Fix file upload path traversal**
  - **File:** `vetly-back/app/utils/upload.py:57-64`
  - `delete_upload("/uploads/../../etc/passwd")` could resolve outside `UPLOAD_DIR`. Add: `if not filepath.resolve().is_relative_to(UPLOAD_DIR.resolve()): return`.

---

## MEDIUM (Fix soon after launch)

- [ ] **19. Replace `datetime.utcnow()` with timezone-aware datetimes**
  - **Files:** `base_class.py:35-41`, `security.py:40-48`, and 4 more files (11 occurrences total)
  - Deprecated in Python 3.12+. Use `func.now()` for DB defaults, `datetime.now(timezone.utc)` in Python code.

- [ ] **20. Add global exception handler**
  - **File:** `vetly-back/app/main.py`
  - Unhandled errors return raw Python stack traces to users. Add `@app.exception_handler(Exception)` that returns a generic JSON error.

- [ ] **21. Implement or remove "Remember Me"**
  - **File:** `vetly-front/app/owner/login/page.tsx:120-127`
  - Checkbox is tracked but never used. Token always goes to localStorage. Either implement (sessionStorage vs localStorage) or remove the checkbox.

- [ ] **22. Add pessimistic locking to invite registration**
  - **File:** `vetly-back/app/services/vet_client.py:137-187`
  - Two concurrent requests with the same invite token could both succeed. Use `SELECT ... FOR UPDATE` or a unique constraint.

- [ ] **23. Add DB-level constraint for double-booking**
  - **File:** `vetly-back/app/repositories/owner.py`
  - Check-then-insert without DB constraint. Concurrent requests can slip through. Consider an exclusion constraint on `(vet_id, scheduled_at range)`.

- [ ] **24. Add timezone support for appointments**
  - **Files:** All appointment queries using `date.today()`
  - Server timezone may differ from user timezone. Store and query with timezone-aware datetimes.

- [ ] **25. Use chunked reads for file uploads**
  - **File:** `vetly-back/app/utils/upload.py:37`
  - `await file.read()` loads entire file into memory before checking size. A large upload could cause OOM. Read in chunks and abort early.

- [ ] **26. Migrate to `DeclarativeBase`**
  - **File:** `vetly-back/app/db/base_class.py:12`
  - `declarative_base()` is deprecated in SQLAlchemy 2.0. Replace with `class Base(DeclarativeBase): pass`.

- [ ] **27. Fix owner layout spinner color**
  - **File:** `vetly-front/app/owner/(dashboard)/layout.tsx:38`
  - Uses `border-indigo-600` (vet theme) instead of `border-teal-600` (owner theme).

- [ ] **28. Enforce vet working hours on booking**
  - **Files:** Vet model has `hours` JSON field, but booking ignores it
  - Users can book at 3 AM. Validate `scheduled_at` against the vet's working hours.

- [ ] **29. Replace `print()` with proper logging**
  - **File:** `vetly-back/app/main.py:20-22`
  - Uses `print()` for startup messages. Use Python `logging` module with structured output for production.

- [ ] **30. Reduce max password length to 72**
  - **File:** `vetly-back/app/schemas/auth.py`
  - `max_length=128` but bcrypt silently truncates at 72 bytes. Reduce to 72 to avoid false sense of security.

---

## Feature Suggestions (enhancements for a better product)

- [ ] **Password reset via email** — Essential for any production app with user accounts.
- [ ] **Email verification flow** — Send confirmation email on signup, block features until verified.
- [ ] **Token refresh mechanism** — Implement refresh tokens so users don't get suddenly logged out after 24 hours.
- [ ] **Account deletion** — GDPR requires it for EU users (Greek app = EU).
- [ ] **Actual notification delivery** — Email/SMS/push for reminders, appointment confirmations, etc. Currently notifications are only in-app database records.
- [ ] **Background job scheduler** — Celery or APScheduler for: processing due reminders, cleaning up soft-deleted pets (30-day retention), sending notification emails.
- [ ] **Login audit log** — Track login timestamps, IP addresses, failed attempts for security monitoring.
- [ ] **HTTP security headers** — Add middleware for `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`.
- [ ] **Terms of Service & Privacy Policy pages** — Required for production in the EU.
- [ ] **Rate limiting at app level** — Nginx has rate limiting, but add `slowapi` or similar as defense-in-depth in case nginx is bypassed.
