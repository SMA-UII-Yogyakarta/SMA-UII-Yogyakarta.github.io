# Deep Audit & E2E Testing Strategy

Audit mendalam untuk memastikan semua fitur benar-benar fungsional dengan seeding dan testing yang komprehensif.

---

## Current State Analysis

### Seed Data Status
**File:** `scripts/seed.ts`

**✅ What's Seeded:**
- 1 Maintainer (active, with card)
- 3 Pending members (no cards)
- 1 Active member (with card + 3 activities)
- Member tracks for all users

**❌ What's Missing:**
- Projects (0 seeded)
- Announcements (0 seeded)
- Notifications (0 seeded)
- Sessions (not seeded, created on login)
- Multiple active members for realistic testing
- Edge cases (rejected users, users without tracks, etc.)

---

## Enhanced Seed Data Requirements

### 1. User Scenarios
```typescript
// Maintainer (Admin)
- 1 maintainer: Full access, approved others
- Password: Set via seed

// Active Members (Various states)
- 5 active members:
  - With GitHub linked
  - Without GitHub
  - With projects
  - Without projects
  - With activities
  - Without activities
  - Different tracks
  - Different classes

// Pending Members
- 3 pending: Waiting approval
- Different tracks and classes

// Edge Cases
- 1 rejected user (for testing rejection flow)
- 1 user without tracks
- 1 user with all tracks
```

### 2. Content Data
```typescript
// Projects
- 10 projects:
  - By different users
  - With/without images
  - With/without URLs
  - Different dates

// Activities
- 20 activities:
  - Different types (contribution, event, workshop, meeting, other)
  - By different users
  - Different dates (spread over 3 months)
  - With/without URLs

// Announcements
- 5 announcements:
  - By maintainer
  - Different dates
  - Various lengths

// Notifications
- 10 notifications:
  - For different users
  - Read/unread
  - Different types
```

### 3. Relationships
```typescript
// Member Cards
- All active members have cards
- Pending members don't have cards
- Cards have valid QR codes

// Tracks
- Users have 1-3 tracks
- All track types represented
- Some users share tracks

// Approvals
- Active members approved by maintainer
- approvedBy field populated
- approvedAt timestamp set
```

---

## E2E Test Scenarios

### Authentication Flow
```
Test: Registration → Approval → Login → Access

1. Register new user
   - POST /api/register with valid NISN/NIS
   - Verify user created with status=pending
   - Verify no card created yet

2. Maintainer approves
   - Login as maintainer
   - POST /api/admin/approve with action=approve
   - Verify user status=active
   - Verify card created
   - Verify QR code generated

3. User logs in
   - POST /api/auth/login with NISN + password
   - Verify session created
   - Verify cookie set
   - Verify redirect to /app/overview

4. Access protected pages
   - GET /app/profile (should work)
   - GET /app/card (should show card)
   - GET /app/members (should fail - not maintainer)
```

### Member Management Flow
```
Test: List → Filter → Search → Approve → Set Password

1. List all members
   - GET /api/members
   - Verify all users returned
   - Verify tracks included

2. Filter by status
   - GET /api/members?status=pending
   - Verify only pending users returned

3. Search by name
   - GET /api/members?search=Ahmad
   - Verify matching users returned

4. Approve member
   - POST /api/admin/approve
   - Verify status changed
   - Verify card created
   - Verify notification created (if implemented)

5. Set password
   - POST /api/admin/set-password
   - Verify password hash updated
   - Verify user can login with new password
```

### Project CRUD Flow
```
Test: Create → List → View → (Edit) → (Delete)

1. Create project
   - Login as active member
   - POST /api/projects with title, description, url
   - Verify project created
   - Verify userId associated

2. List projects
   - GET /api/projects
   - Verify new project in list
   - Verify userName populated

3. View project
   - Verify project details correct
   - Verify URL clickable

4. Edit project (if implemented)
   - PATCH /api/projects/:id
   - Verify changes saved

5. Delete project (if implemented)
   - DELETE /api/projects/:id
   - Verify project removed
```

### Activity Logging Flow
```
Test: Log → List → Filter

1. Log activity
   - Login as active member
   - POST /api/activities with type, title, description
   - Verify activity created
   - Verify timestamp correct

2. List activities
   - GET /api/activities
   - Verify activities sorted by date
   - Verify userName populated

3. Filter by type (if implemented)
   - GET /api/activities?type=contribution
   - Verify only matching activities returned
```

### Announcement Flow
```
Test: Create → List → View → Notify

1. Create announcement
   - Login as maintainer
   - POST /api/announcements with title, content
   - Verify announcement created
   - Verify createdBy set

2. List announcements
   - GET /api/announcements
   - Verify sorted by date (newest first)
   - Verify creatorName populated

3. View on dashboard
   - Login as member
   - GET /app/overview
   - Verify announcements shown

4. Notification (if implemented)
   - Verify notification created for all active members
```

### Profile & Settings Flow
```
Test: View → Update → Verify

1. View profile
   - GET /app/profile
   - Verify user data correct
   - Verify tracks shown
   - Verify card link (if active)

2. Update profile
   - PATCH /api/profile with name, githubUsername
   - Verify changes saved
   - Verify reflected in UI

3. View settings
   - GET /app/settings
   - Verify user data shown
   - Update and verify
```

### Card Generation Flow
```
Test: Approval → Card → QR

1. Approve user
   - POST /api/admin/approve
   - Verify card created

2. View card
   - Login as approved user
   - GET /app/card
   - Verify card displayed
   - Verify QR code present

3. Scan QR (manual test)
   - Scan QR code
   - Verify data correct
   - Verify format: { id, cardNumber, name }
```

---

## Test Data Requirements

### Minimum Viable Seed
```typescript
Users:
- 1 maintainer (password set)
- 5 active members (passwords set)
- 3 pending members
- 1 rejected member (for testing)

Projects:
- 10 projects (by different users)

Activities:
- 20 activities (various types, users, dates)

Announcements:
- 5 announcements (by maintainer)

Notifications:
- 10 notifications (various users, read/unread)

Member Cards:
- 6 cards (maintainer + 5 active members)

Tracks:
- All users have 1-3 tracks
- All track types represented
```

### Test Accounts
```
Maintainer:
- NISN: 0000000001
- Password: admin123

Active Member 1:
- NISN: 1234567890
- Password: member123

Active Member 2:
- NISN: 1234567891
- Password: member123

Pending Member:
- NISN: 1234567892
- (No password yet)
```

---

## Testing Tools Setup

### 1. Unit Tests (Vitest)
```bash
pnpm add -D vitest @vitest/ui
```

**Test Files:**
- `src/lib/auth.test.ts` - Auth utilities
- `src/lib/validation.test.ts` - Zod schemas
- `src/lib/format.test.ts` - Formatters
- `src/lib/guards.test.ts` - Route guards

### 2. API Tests (Vitest + Supertest)
```bash
pnpm add -D supertest @types/supertest
```

**Test Files:**
- `src/pages/api/auth/login.test.ts`
- `src/pages/api/register.test.ts`
- `src/pages/api/members/index.test.ts`
- `src/pages/api/projects/index.test.ts`
- `src/pages/api/activities/index.test.ts`
- `src/pages/api/announcements/index.test.ts`

### 3. E2E Tests (Playwright)
```bash
pnpm add -D @playwright/test
```

**Test Files:**
- `tests/e2e/auth.spec.ts` - Login, logout, registration
- `tests/e2e/member-management.spec.ts` - Approve, reject, set password
- `tests/e2e/projects.spec.ts` - CRUD operations
- `tests/e2e/activities.spec.ts` - Logging activities
- `tests/e2e/announcements.spec.ts` - Create, view
- `tests/e2e/profile.spec.ts` - View, update

---

## Critical Bugs to Test

### 1. Authentication
- [ ] Session expiry handling
- [ ] Concurrent logins
- [ ] Password reset (not implemented)
- [ ] GitHub OAuth edge cases

### 2. Authorization
- [ ] Member accessing maintainer routes
- [ ] Pending member accessing active-only features
- [ ] Logged out user accessing protected routes

### 3. Data Integrity
- [ ] Duplicate NISN/NIS/email
- [ ] Orphaned records (card without user)
- [ ] Missing required fields
- [ ] Invalid foreign keys

### 4. Race Conditions
- [ ] Concurrent approvals
- [ ] Concurrent project creation
- [ ] Session conflicts

### 5. Edge Cases
- [ ] Empty search results
- [ ] No pending members
- [ ] User with no tracks
- [ ] User with no activities
- [ ] Announcement with very long content

---

## Performance Tests

### Load Testing
```
Scenarios:
- 100 concurrent users browsing
- 50 concurrent registrations
- 20 concurrent project creations
- 10 concurrent approvals

Metrics:
- Response time < 500ms (p95)
- No errors under load
- Database connection pool handling
```

### Database Performance
```
Queries to optimize:
- GET /api/members (with filters)
- GET /api/activities (with pagination)
- GET /api/projects (with user joins)

Indexes needed:
- users.status
- users.email
- activities.userId
- activities.createdAt
- projects.userId
```

---

## Test Coverage Goals

### Minimum Coverage
- Unit tests: 80%
- API tests: 90%
- E2E tests: Critical paths only

### Priority
1. **Critical:** Auth, approval, card generation
2. **High:** CRUD operations, filters
3. **Medium:** Edge cases, error handling
4. **Low:** UI interactions, styling

---

## Continuous Testing Strategy

### Pre-commit
```bash
# Run unit tests
pnpm test:unit

# Run linter
pnpm lint
```

### Pre-push
```bash
# Run all tests
pnpm test

# Run type check
pnpm astro check
```

### CI/CD (GitHub Actions)
```yaml
- Run unit tests
- Run API tests
- Run E2E tests (headless)
- Check coverage
- Build production
```

---

## Next Steps

### Phase 1: Enhanced Seeding
1. Create comprehensive seed data
2. Add password hashing to seed
3. Add more realistic data
4. Add edge cases

### Phase 2: Unit Tests
1. Setup Vitest
2. Test utilities and helpers
3. Test validation schemas
4. Test guards

### Phase 3: API Tests
1. Test all endpoints
2. Test error cases
3. Test authorization
4. Test data integrity

### Phase 4: E2E Tests
1. Setup Playwright
2. Test critical flows
3. Test user journeys
4. Test edge cases

### Phase 5: Performance
1. Load testing
2. Query optimization
3. Caching strategy
4. Monitoring

---

**Status:** Ready for implementation
**Priority:** Phase 1 (Enhanced Seeding) → Phase 3 (API Tests) → Phase 4 (E2E Tests)
**Timeline:** 
- Phase 1: 1 day
- Phase 2: 2 days
- Phase 3: 3 days
- Phase 4: 3 days
