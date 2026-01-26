# Vetly - Feature Development Order

## Quick Reference Guide

This document provides a prioritized, sequential list of features to develop for the Vetly platform.

---

## 🎯 Development Sequence

### ✅ **PHASE 1: Core Infrastructure** (Week 1-2)

**Why First?**: Everything depends on this foundation.

#### Backend Setup
1. **FastAPI Project Initialization**
   - Set up project with `uv`
   - Configure folder structure: `/app`, `/models`, `/routes`, `/services`, `/schemas`
   - Set up `.env` for environment variables
   - Add CORS middleware

2. **Database Setup**
   - PostgreSQL database creation
   - SQLAlchemy models for all entities (users, vets, pets, appointments, etc.)
   - Alembic migrations setup
   - Initial migration

3. **Authentication System**
   - User model (pet owners)
   - Vet model (veterinarians)
   - JWT token generation
   - Password hashing (bcrypt)
   - Login endpoint (`POST /api/v1/auth/login`)
   - Register endpoints (`POST /api/v1/auth/register/user`, `/vet`)
   - Current user endpoint (`GET /api/v1/auth/me`)
   - Logout endpoint

4. **Authorization Middleware**
   - JWT verification
   - Role-based access control (user vs vet)
   - Protected route decorator

#### Frontend Setup
1. **Next.js Project**
   - Initialize with App Router
   - Configure TypeScript
   - Set up Tailwind CSS 4
   - Install dependencies: TanStack Query, Zustand, React Hook Form, Zod

2. **Authentication Pages**
   - `/login` - Login form with user/vet toggle
   - `/register/user` - Pet owner registration
   - `/register/vet` - Vet registration
   - Auth context/store with Zustand
   - Protected route middleware

3. **Base Layout**
   - Root layout with header/footer
   - Responsive navigation
   - Mobile menu
   - Role-based navigation items

**Completion Criteria**:
- [ ] User can register as pet owner
- [ ] Vet can register
- [ ] User/Vet can login and receive JWT token
- [ ] Token is stored and used for authenticated requests
- [ ] Protected routes redirect unauthenticated users to login

---

### ✅ **PHASE 2: Pet Management** (Week 3-4)

**Why Second?**: Core functionality for pet owners.

#### Backend
1. **Pet Model & Endpoints**
   - `GET /api/v1/pets` - List user's pets
   - `POST /api/v1/pets` - Create pet
   - `GET /api/v1/pets/{id}` - Get pet details
   - `PUT /api/v1/pets/{id}` - Update pet
   - `DELETE /api/v1/pets/{id}` - Delete pet
   - Image upload integration (S3/Cloudinary)

2. **Medical History**
   - `GET /api/v1/pets/{id}/history` - Get medical events
   - `POST /api/v1/pets/{id}/history` - Add medical event
   - `PUT /api/v1/pets/{id}/history/{event_id}` - Update event
   - `DELETE /api/v1/pets/{id}/history/{event_id}` - Delete event

3. **Weight Tracking**
   - `GET /api/v1/pets/{id}/weight` - Get weight history
   - `POST /api/v1/pets/{id}/weight` - Add weight entry

#### Frontend
1. **Pet Owner Dashboard**
   - `/dashboard` - Overview page with stats
   - Pet list widget
   - Upcoming appointments widget
   - Recent activity feed

2. **Pet Management UI**
   - `/pets` - Pet list page
   - `/pets/new` - Add pet form
   - `/pets/[id]` - Pet profile page
   - `/pets/[id]/edit` - Edit pet form
   - Image upload component
   - Delete confirmation modal

3. **Medical History UI**
   - Medical events timeline component
   - Add event modal
   - Weight chart (Recharts)
   - Weight history table

**Completion Criteria**:
- [ ] User can add a new pet with image
- [ ] User can view all their pets
- [ ] User can edit pet details
- [ ] User can delete a pet
- [ ] User can add medical events
- [ ] User can track and visualize weight history

---

### ✅ **PHASE 3: Vet Directory** (Week 4-5)

**Why Third?**: Enables users to discover vets.

#### Backend
1. **Vet Public Endpoints**
   - `GET /api/v1/vets` - Search vets with filters
     - Query params: `city`, `specialty`, `is_on_call`, `lat`, `lng`, `radius`
   - `GET /api/v1/vets/{id}` - Get vet public profile
   - Geolocation search logic
   - Rating calculation (from reviews)

2. **Seed Sample Vets**
   - Create migration to seed 10-20 sample vets
   - Include various cities and specialties

#### Frontend
1. **Vet Search Page**
   - `/vets` - Search and filter page
   - Search bar
   - Filter by city, specialty, emergency
   - Vet card grid layout
   - Map view (optional)

2. **Vet Profile Page**
   - `/vets/[id]` - Public vet profile
   - Contact information
   - Hours of operation
   - Reviews display
   - "Book Appointment" button

**Completion Criteria**:
- [ ] Users can search for vets
- [ ] Users can filter by specialty, city, emergency
- [ ] Users can view vet profiles
- [ ] Vet ratings are calculated correctly

---

### ✅ **PHASE 4: Appointment Booking** (Week 5-6)

**Why Fourth?**: Core business transaction.

#### Backend
1. **Appointment Endpoints**
   - `POST /api/v1/appointments` - Create appointment (user)
   - `GET /api/v1/appointments` - List user's appointments
   - `GET /api/v1/appointments/{id}` - Get appointment details
   - `PUT /api/v1/appointments/{id}` - Update appointment
   - `DELETE /api/v1/appointments/{id}` - Cancel appointment
   - `POST /api/v1/appointments/{id}/confirm` - Confirm (vet only)
   - `POST /api/v1/appointments/{id}/reject` - Reject (vet only)

2. **Business Logic**
   - Check vet availability
   - Prevent double booking
   - Validate appointment date (future only)
   - Status transitions (pending → confirmed → completed)

3. **Notification Creation**
   - Create notification when appointment is booked
   - Create notification when appointment is confirmed/rejected

#### Frontend
1. **Booking Flow**
   - `/vets/[id]/book` - Booking page
   - Date/time picker (calendar UI)
   - Pet selection dropdown
   - Appointment type input
   - Notes textarea
   - Confirmation page

2. **Appointment Management**
   - `/appointments` - User's appointment list
   - `/appointments/calendar` - Calendar view
   - Appointment card component
   - Status badges (pending, confirmed, completed, cancelled)
   - Reschedule modal
   - Cancel confirmation

**Completion Criteria**:
- [ ] User can book an appointment with a vet
- [ ] User can see all their appointments
- [ ] User can reschedule an appointment
- [ ] User can cancel an appointment
- [ ] Appointment status is tracked correctly

---

### ✅ **PHASE 5: Notification System** (Week 6-7)

**Why Fifth?**: Keeps users informed.

#### Backend
1. **Notification Endpoints**
   - `GET /api/v1/notifications` - List user/vet notifications
   - `PUT /api/v1/notifications/{id}/read` - Mark as read
   - `DELETE /api/v1/notifications/{id}` - Delete notification

2. **WebSocket Setup**
   - Socket.io server integration
   - `/ws/notifications` - Real-time connection
   - Emit notifications on events

3. **Email Integration (Optional)**
   - SendGrid setup
   - Email templates
   - Send email on appointment creation

#### Frontend
1. **Notification UI**
   - Notification bell icon in header
   - Unread count badge
   - Notification dropdown
   - Mark all as read
   - Real-time updates (Socket.io client)

**Completion Criteria**:
- [ ] Notifications appear when appointments are booked/confirmed
- [ ] User can view notification list
- [ ] User can mark notifications as read
- [ ] Real-time notifications work via WebSocket

---

### ✅ **PHASE 6: Vet Dashboard** (Week 7-8)

**Why Sixth?**: Essential for vet users.

#### Backend
1. **Vet Dashboard Stats**
   - `GET /api/v1/vets/dashboard` - Dashboard statistics
     - Total patients
     - Today's appointments
     - Pending requests
     - This week's appointments

2. **Vet Patient Management**
   - `GET /api/v1/vets/patients` - List all patients
   - `POST /api/v1/vets/patients` - Add patient manually
   - `GET /api/v1/vets/patients/{id}` - Patient details
   - `PUT /api/v1/vets/patients/{id}` - Update patient
   - Patient search and pagination

3. **Vet Appointment Views**
   - `GET /api/v1/vets/appointments/today` - Today's appointments
   - `GET /api/v1/vets/appointments/pending` - Pending requests
   - `GET /api/v1/vets/appointments/schedule` - Weekly schedule

#### Frontend
1. **Vet Dashboard**
   - `/vet/dashboard` - Main dashboard
   - Stats cards (patients, appointments, pending)
   - Today's appointments widget
   - Pending requests widget
   - Quick actions

2. **Patient Management**
   - `/vet/patients` - Patient list with search
   - `/vet/patients/new` - Add patient form
   - `/vet/patients/[id]` - Patient profile
   - Medical records view
   - Patient status updates

3. **Appointment Management**
   - `/vet/appointments` - All appointments
   - `/vet/appointments/today` - Today's view
   - `/vet/appointments/pending` - Pending requests
   - Approve/Reject actions
   - Schedule view (calendar)

4. **Vet Profile Settings**
   - `/vet/settings` - Profile settings
   - Edit business hours
   - Update contact info
   - Upload clinic images

**Completion Criteria**:
- [ ] Vet can view dashboard with statistics
- [ ] Vet can see today's appointments
- [ ] Vet can view and manage pending requests
- [ ] Vet can approve/reject appointments
- [ ] Vet can add and manage patients
- [ ] Vet can update their profile

---

### ✅ **PHASE 7: Medication Tracking** (Week 9)

**Why Seventh?**: Value-add feature for pet owners.

#### Backend
1. **Medication Endpoints**
   - `GET /api/v1/medications` - List pet medications
   - `POST /api/v1/medications` - Add medication
   - `GET /api/v1/medications/{id}` - Get medication
   - `PUT /api/v1/medications/{id}` - Update medication
   - `DELETE /api/v1/medications/{id}` - Delete medication

2. **Celery Task for Reminders**
   - Set up Celery + Redis
   - Create daily task to check medications
   - Send notification/email for due medications

#### Frontend
1. **Medication Management**
   - `/medications` - Medication list
   - `/medications/new` - Add medication form
   - Medication card with schedule
   - Active/inactive toggle
   - Reminder display

**Completion Criteria**:
- [ ] User can add medications for pets
- [ ] User can set medication schedules
- [ ] User receives reminders for medications
- [ ] User can mark medications as taken

---

### ✅ **PHASE 8: Reviews & Ratings** (Week 10)

**Why Eighth?**: Builds trust and credibility.

#### Backend
1. **Review Endpoints**
   - `POST /api/v1/reviews` - Create review (user, after appointment)
   - `GET /api/v1/reviews` - List reviews for vet
   - `GET /api/v1/reviews/{id}` - Get review
   - `PUT /api/v1/reviews/{id}/reply` - Vet reply to review
   - `DELETE /api/v1/reviews/{id}` - Delete review

2. **Rating Calculation**
   - Update vet's average rating on new review
   - Update review count

#### Frontend
1. **Review System**
   - Review form (after completed appointment)
   - Star rating component
   - Review list on vet profile
   - Vet reply display
   - Review moderation (admin)

**Completion Criteria**:
- [ ] User can leave a review after appointment
- [ ] Reviews appear on vet profile
- [ ] Vet can reply to reviews
- [ ] Average rating is calculated correctly

---

### ✅ **PHASE 9: Analytics Dashboard** (Week 11)

**Why Ninth?**: Business intelligence for vets.

#### Backend
1. **Analytics Endpoints**
   - `GET /api/v1/vets/analytics` - Get analytics data
     - Appointment trends (daily, weekly, monthly)
     - Patient growth
     - Popular services
     - Revenue (if applicable)
     - Busiest days/times

2. **Data Aggregation**
   - SQL aggregation queries
   - Date range filtering
   - Export to CSV/PDF (optional)

#### Frontend
1. **Analytics Page**
   - `/vet/analytics` - Analytics dashboard
   - Charts: appointments over time, patient growth
   - KPI cards: total patients, total appointments, avg rating
   - Filter by date range

**Completion Criteria**:
- [ ] Vet can view appointment trends
- [ ] Vet can see patient growth statistics
- [ ] Charts display correctly
- [ ] Data can be filtered by date range

---

### ✅ **PHASE 10: AI Chat Assistant** (Week 12)

**Why Tenth?**: Differentiating feature, not critical path.

#### Backend
1. **AI Integration**
   - OpenAI API or Gemini API setup
   - `POST /api/v1/ai/chat` - Send message
   - `GET /api/v1/ai/chat/history` - Get chat history
   - LangChain integration for context
   - Store chat messages in DB

2. **Context Management**
   - Include user's pet info in context
   - Veterinary knowledge base

#### Frontend
1. **Chat Interface**
   - `/chat` - AI chat page
   - Chat bubble UI
   - Typing indicator
   - Message history
   - Quick action buttons

**Completion Criteria**:
- [ ] User can chat with AI assistant
- [ ] AI provides relevant pet health advice
- [ ] Chat history is saved
- [ ] AI responses are contextual

---

### ✅ **PHASE 11: Blog & Content** (Week 13)

**Why Eleventh?**: Marketing and SEO, not core functionality.

#### Backend
1. **Blog Endpoints**
   - `GET /api/v1/blog/posts` - List posts (public)
   - `GET /api/v1/blog/posts/{id}` - Get post (public)
   - `POST /api/v1/blog/posts` - Create post (admin only)
   - `PUT /api/v1/blog/posts/{id}` - Update post (admin)
   - `DELETE /api/v1/blog/posts/{id}` - Delete post (admin)

2. **Categories**
   - `GET /api/v1/blog/categories` - List categories

#### Frontend
1. **Blog Pages**
   - `/blog` - Blog listing
   - `/blog/[slug]` - Blog post view
   - Category filter
   - Search functionality
   - Related posts

**Completion Criteria**:
- [ ] Blog posts can be created (admin)
- [ ] Users can view blog posts
- [ ] Blog posts are categorized
- [ ] SEO metadata is included

---

### ✅ **PHASE 12: Polish & Production** (Week 14-15)

**Why Last?**: Final touches before launch.

#### Testing
1. **End-to-End Testing**
   - Critical user flows
   - Appointment booking flow
   - Payment flow (if applicable)

2. **Performance Optimization**
   - Database query optimization
   - API response caching (Redis)
   - Image optimization
   - Code splitting
   - Lighthouse audit

3. **Security Audit**
   - Penetration testing
   - SQL injection testing
   - XSS prevention
   - CSRF protection
   - Rate limiting

4. **Mobile Testing**
   - Responsive design checks
   - Touch interactions
   - Mobile performance

#### Deployment
1. **Docker Configuration**
   - Create `Dockerfile` for FastAPI backend
   - Create `Dockerfile` for Next.js frontend
   - Create `docker-compose.yml` for local development
   - Create `docker-compose.prod.yml` for production
   - Configure multi-stage builds for optimization

2. **Hetzner VPS Setup**
   - Provision Hetzner VPS (CX21 or CX31 recommended)
   - Configure Ubuntu/Debian server
   - Set up SSH key authentication
   - Configure UFW firewall (ports 80, 443, 22)
   - Install Docker and Docker Compose
   - Install fail2ban for security

3. **Coolify Installation**
   - Install Coolify on Hetzner VPS
   - Configure Coolify dashboard
   - Set up SSL with Let's Encrypt
   - Configure GitHub integration

4. **Database & Services Setup**
   - Deploy PostgreSQL container via Coolify
   - Deploy Redis container via Coolify
   - Configure persistent volumes
   - Set up automated database backups to Hetzner Storage Box
   - Configure backup retention policy

5. **Application Deployment**
   - Deploy FastAPI backend to Coolify
   - Deploy Next.js frontend to Coolify
   - Configure environment variables
   - Set up custom domain
   - Enable auto-deployment via GitHub webhooks
   - Run database migrations
   - Configure health check endpoints

6. **CI/CD**
   - GitHub Actions for testing
   - GitHub webhooks to Coolify for auto-deploy
   - Automated testing before deployment

7. **Monitoring & Logging**
   - Configure Sentry error tracking
   - Set up Coolify built-in monitoring
   - Configure application logging
   - Set up log rotation
   - Configure uptime monitoring
   - Set up alert notifications (email/Discord/Slack)

8. **Security Hardening**
   - Enable automatic security updates
   - Configure SSL/TLS certificates (auto-renewal)
   - Set up firewall rules
   - Enable Docker security best practices
   - Configure rate limiting
   - Set up backup encryption

#### Documentation
1. **User Documentation**
   - User guide for pet owners
   - User guide for vets
   - FAQ page

2. **Technical Documentation**
   - API documentation (auto-generated by FastAPI)
   - Deployment guide
   - Development setup guide
   - Database schema documentation

**Completion Criteria**:
- [ ] All features tested and working
- [ ] Performance metrics meet targets
- [ ] Security audit passed
- [ ] Application deployed to production
- [ ] Monitoring and alerts configured
- [ ] Documentation complete

---

## 📊 Feature Priority Summary

### MUST HAVE (MVP)
1. Authentication (User & Vet)
2. Pet Management
3. Vet Directory
4. Appointment Booking
5. Notifications
6. Vet Dashboard

### SHOULD HAVE (v1.1)
7. Medication Tracking
8. Reviews & Ratings
9. Analytics Dashboard

### NICE TO HAVE (v1.2+)
10. AI Chat Assistant
11. Blog & Content
12. Advanced Features (Payment, Multi-clinic, etc.)

---

## 🚀 Quick Start Checklist

**Week 1 - Day 1**:
- [ ] Initialize FastAPI project with uv
- [ ] Set up PostgreSQL database
- [ ] Create initial SQLAlchemy models
- [ ] Initialize Next.js project

**Week 1 - Day 2-3**:
- [ ] Implement JWT authentication
- [ ] Create login/register endpoints
- [ ] Build auth UI pages

**Week 1 - Day 4-5**:
- [ ] Protected routes middleware
- [ ] Test authentication flow
- [ ] Set up base layouts

**Week 2**: Continue with pet management...

---

## 💡 Development Tips

1. **Always start with backend first** for each feature
2. **Test endpoints with Postman/Thunder Client** before building UI
3. **Use mock data initially** if API isn't ready
4. **Commit frequently** with clear messages
5. **Deploy early and often** to catch production issues
6. **Mobile-first design** approach
7. **Accessibility from day one** (ARIA labels, keyboard navigation)

---

## 📝 Notes

- **Estimated MVP Timeline**: 8 weeks (Phases 1-6)
- **Estimated Full Launch**: 15 weeks (All phases)
- **Recommended Team**: 1-2 frontend + 1 backend developer
- **Stack**: Next.js 15 + FastAPI + PostgreSQL + Redis
- **Package Manager**: npm (frontend) + uv (backend)
- **Deployment**: Hetzner VPS + Docker + Coolify
- **Estimated Monthly Cost**: €15-20 (Hetzner CX31 + Storage Box)

---

**Good luck with the development! 🎉**
