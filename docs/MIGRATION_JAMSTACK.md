# Migrasi Arsitektur: Astro SSR → JAMstack

**Tanggal:** 2026-04-15  
**Status:** Dokumen Perencanaan  
**Tujuan:** Migrasi dari Astro SSR monolith ke JAMstack (Astro Static + Hono API di Cloudflare Workers)

---

## 📋 Daftar Isi

1. [Ringkasan Eksekutif](#ringkasan-eksekutif)
2. [Arsitektur Saat Ini](#arsitektur-saat-ini)
3. [Arsitektur Target](#arsitektur-target)
4. [Inventory API Routes](#inventory-api-routes)
5. [Business Logic per Domain](#business-logic-per-domain)
6. [Auth & Session Flow](#auth--session-flow)
7. [Frontend ↔ API Contract](#frontend--api-contract)
8. [Rencana Migrasi Bertahap](#rencana-migrasi-bertahap)
9. [Keputusan Teknis yang Perlu Dibuat](#keputusan-teknis-yang-perlu-dibuat)

---

## Ringkasan Eksekutif

### Motivasi Migrasi
- **Skalabilitas:** Cloudflare Workers edge computing untuk latensi rendah
- **Biaya:** Static hosting gratis di GitHub Pages, Workers free tier 100k req/day
- **Deployment:** Decoupled deployment (frontend & API independen)
- **Developer Experience:** Separation of concerns yang lebih jelas

### Tantangan Utama
1. **Session Management:** Lucia v3 cookie-based tidak kompatibel dengan CF Workers stateless
2. **Database Access:** Turso libSQL perlu diakses dari Workers (sudah kompatibel)
3. **Breaking Changes:** Perlu koordinasi deployment frontend + API
4. **Testing:** E2E tests perlu update untuk API endpoint baru

### Estimasi Waktu
- **Fase 0 (Persiapan):** 2-3 hari
- **Fase 1-6 (Migrasi Bertahap):** 1-2 minggu
- **Testing & Stabilisasi:** 3-5 hari
- **Total:** 2-3 minggu

---

## Arsitektur Saat Ini

### Stack
```
┌─────────────────────────────────────┐
│   Astro SSR (Node Adapter)          │
│   ├── src/pages/                    │
│   │   ├── *.astro (SSR pages)       │
│   │   └── api/*.ts (API routes)     │
│   ├── src/middleware.ts             │
│   │   └── Session validation        │
│   ├── src/lib/auth.ts (Lucia)       │
│   └── src/db/ (Drizzle + Turso)     │
└─────────────────────────────────────┘
         ↓ Deploy ke VPS/Cloud
```

### Karakteristik
- **Runtime:** Node.js (via Bun)
- **Rendering:** Server-Side Rendering (SSR)
- **Auth:** Lucia v3 session cookie (stored in Turso `sessions` table)
- **Database:** Turso (libSQL remote)
- **Deployment:** Single monolith

### File Structure
```
src/
├── pages/
│   ├── api/                    # 20+ API routes
│   │   ├── register.ts
│   │   ├── auth/
│   │   │   ├── login.ts
│   │   │   ├── logout.ts
│   │   │   └── me.ts
│   │   ├── profile.ts
│   │   ├── members/
│   │   ├── projects/
│   │   ├── activities/
│   │   ├── announcements/
│   │   ├── notifications/
│   │   ├── slims/
│   │   └── admin/
│   └── app/                    # Dashboard pages (SSR)
│       ├── overview.astro
│       ├── card.astro
│       ├── projects.astro
│       ├── activities.astro
│       ├── announcements.astro
│       ├── members.astro
│       ├── profile.astro
│       └── settings.astro
├── middleware.ts               # Session validation
├── lib/
│   ├── auth.ts                 # Lucia setup
│   ├── guards.ts               # requireAuth, requireMaintainer
│   ├── validation.ts           # Zod schemas
│   ├── notifications.ts        # Notification helpers
│   ├── api-utils.ts            # Response helpers
│   └── format.ts               # Date formatting
└── db/
    ├── schema.ts               # Drizzle schema
    └── index.ts                # DB client
```

---

## Arsitektur Target

### Stack
```
┌──────────────────────────┐      ┌─────────────────────────┐
│  Astro Static            │      │  Hono on CF Workers     │
│  (GitHub Pages)          │◄────►│  (smauii-dev-api)       │
│                          │ HTTPS │                         │
│  ├── HTML/CSS/JS         │      │  ├── /api/auth/*        │
│  ├── React Islands       │      │  ├── /api/members       │
│  └── Client-side fetch   │      │  ├── /api/projects      │
│                          │      │  └── ... (20+ routes)   │
└──────────────────────────┘      └─────────────────────────┘
                                            ↓
                                   ┌─────────────────┐
                                   │  Turso (libSQL) │
                                   └─────────────────┘
```

### Karakteristik
- **Frontend:** Static HTML + client-side hydration
- **API:** Hono on Cloudflare Workers (edge computing)
- **Auth:** JWT stateless (atau session di Turso via API)
- **Database:** Turso (libSQL) - diakses dari Workers
- **Deployment:** Decoupled (GitHub Pages + CF Workers)

### Keuntungan
1. **Performance:** Static files + edge API = latensi rendah
2. **Scalability:** CF Workers auto-scale, no server management
3. **Cost:** GitHub Pages gratis, CF Workers free tier 100k req/day
4. **Security:** API terpisah, CORS control, rate limiting di Workers
5. **Developer Experience:** Clear separation, independent deployment

### Trade-offs
1. **Complexity:** Dua deployment pipeline (frontend + API)
2. **Auth Migration:** Perlu ganti dari session cookie ke JWT
3. **CORS:** Perlu konfigurasi CORS di API
4. **Testing:** E2E tests perlu update endpoint URLs

---

## Inventory API Routes

### Tabel Lengkap API Endpoints

| Method | Path | Auth | Role | Request Body | Response | Side Effects |
|--------|------|------|------|--------------|----------|--------------|
| **Authentication** |
| POST | `/api/register` | ❌ | - | `{nisn, nis, name, email, class, githubUsername?, tracks[]}` | `{success, message}` | Insert user + tracks (status: pending) |
| GET | `/api/register?identifier=X` | ❌ | - | - | `{available: true}` atau error 409 | Check duplicate |
| GET | `/api/register?identifier=X&checkStatus=true` | ❌ | - | - | `{nisn, name, email, class, status, tracks[], joinedAt}` | Check registration status |
| POST | `/api/auth/login` | ❌ | - | `{identifier, password}` | `{success, message, user}` + session cookie | Create session, invalidate old sessions |
| POST | `/api/auth/logout` | ✅ | - | - | Redirect to `/login` | Invalidate session |
| GET | `/api/auth/me` | ✅ | - | - | `{id, nisn, nis, name, email, githubUsername, class, role, status, joinedAt, approvedAt}` | - |
| **Profile** |
| GET | `/api/profile` | ✅ | - | - | `{...user, tracks[], cardNumber?, cardQrCode?, cardIssuedAt?}` | - |
| PATCH | `/api/profile` | ✅ | - | `{name?, githubUsername?}` | `{success: true}` | Update user name/github |
| **Members** (Maintainer Only) |
| GET | `/api/members?status=X&search=Y&page=N&limit=M` | ✅ | maintainer | - | `{members[], total, page, limit}` | - |
| **Projects** |
| GET | `/api/projects?userId=X&page=N&limit=M` | ✅ | - | - | `{projects[], total, page, limit}` | - |
| POST | `/api/projects` | ✅ | active | `{title, description?, url?, imageUrl?}` | `{id, success}` | Insert project |
| PATCH | `/api/projects/:id` | ✅ | owner/maintainer | `{title, description?, url?}` | `{success: true}` | Update project |
| DELETE | `/api/projects/:id` | ✅ | owner/maintainer | - | `{success: true}` | Delete project |
| **Activities** |
| GET | `/api/activities?type=X&startDate=Y&endDate=Z&page=N&limit=M` | ✅ | - | - | `{activities[], total, page, limit}` | - |
| POST | `/api/activities` | ✅ | active | `{type, title, description?, url?}` | `{id, success}` | Insert activity |
| DELETE | `/api/activities/:id` | ✅ | owner/maintainer | - | `{success: true}` | Delete activity |
| **Announcements** |
| GET | `/api/announcements?page=N&limit=M` | ✅ | - | - | `{announcements[], total, page, limit}` | - |
| POST | `/api/announcements` | ✅ | maintainer | `{title, content}` | `{id, success}` | Insert announcement + broadcast notification |
| PATCH | `/api/announcements/:id` | ✅ | maintainer | `{title, content}` | `{success: true}` | Update announcement |
| DELETE | `/api/announcements/:id` | ✅ | maintainer | - | `{success: true}` | Delete announcement |
| **Notifications** |
| GET | `/api/notifications` | ✅ | - | - | `[{id, message, isRead, createdAt}]` (limit 20) | - |
| POST | `/api/notifications/read` | ✅ | - | `{id}` | `{success: true}` | Mark notification as read |
| **SLiMS Integration** |
| POST | `/api/slims/verify` | ❌ | - | `{nisn}` | `{nisn, nis, name, email, class, isExpired, expiredAt, isPending}` | - (currently mock) |
| **Admin** |
| GET | `/api/admin/stats` | ✅ | maintainer | - | `{user, stats: {pendingApproval, activeMembers, allUsers}, pendingUsers[]}` | - |
| POST | `/api/admin/approve` | ✅ | maintainer | `{userId, action: 'approve'\|'reject'}` | `{success, message}` | Approve: set status=active, create card, send notification. Reject: delete user + related data |
| GET | `/api/admin/users?id=X&status=Y&role=Z` | ✅ | maintainer | - | `{users[], total}` atau `{user, tracks[], memberCard}` | - |
| PATCH | `/api/admin/users` | ✅ | maintainer | `{userId, status?, role?, name?, email?, class?}` | `{success, message}` | Update user fields |
| DELETE | `/api/admin/users` | ✅ | maintainer | `{userId}` | `{success, message}` | Delete user + related data (cannot delete self) |
| POST | `/api/admin/set-password` | ✅ | maintainer | `{userId, password}` | `{success, message}` | Hash password with argon2, update user |
| **Health Check** |
| GET | `/api/health` | ❌ | - | - | `{status: 'ok', timestamp, version}` | - |

### Catatan Penting
- **Auth Required (✅):** Endpoint memerlukan session cookie valid (saat ini) atau JWT token (setelah migrasi)
- **Role:** `maintainer` = admin, `active` = member dengan status active
- **Side Effects:** Operasi yang mengubah data atau trigger notifikasi
- **Pagination:** Semua list endpoints sudah support `page` dan `limit` query params

---

## Business Logic per Domain

### 1. Authentication & Registration

#### Registration Flow
**File:** `src/pages/api/register.ts`

**Logic:**
1. **Validasi Input** (Zod schema):
   - NISN: max 10 digit
   - NIS: max 20 karakter
   - Email: valid format
   - Tracks: min 1, max 3 dari 6 pilihan (robotika, ai, data-science, network, security, software)
   - Class: dari list predefined (X/XI/XII IPA/IPS 1-4)

2. **Check Duplicate:**
   - Query `users` table: `nisn` OR `nis` OR `email` sudah ada?
   - Jika ada → return 409 Conflict

3. **Insert User + Tracks (Transaction):**
   ```typescript
   await db.transaction(async (tx) => {
     await tx.insert(users).values({
       id: nanoid(),
       nisn, nis, name, email, githubUsername,
       class, role: 'member', status: 'pending',
       joinedAt: Date.now()
     });
     for (const track of tracks) {
       await tx.insert(memberTracks).values({
         id: nanoid(), userId, track, joinedAt: Date.now()
       });
     }
   });
   ```

4. **Response:** `{success: true, message: 'Pendaftaran berhasil! Menunggu persetujuan maintainer.'}`

**Dependency:**
- `src/lib/validation.ts` - registerSchema
- `src/db/schema.ts` - users, memberTracks tables

**Side Effects:** None (user status = pending, tidak ada notifikasi)

---

#### Login Flow
**File:** `src/pages/api/auth/login.ts`

**Logic:**
1. **Validasi Input:**
   - `identifier` (NISN atau NIS) harus diisi
   - `password` harus diisi

2. **Find User:**
   ```typescript
   const user = await db.query.users.findFirst({
     where: or(eq(users.nisn, identifier), eq(users.nis, identifier))
   });
   ```
   - Jika tidak ada → 401 "NISN/NIS tidak ditemukan"

3. **Check Password:**
   - Jika `user.passwordHash` null → 401 "Akun ini belum diatur password"
   - Verify password dengan argon2: `await verify(user.passwordHash, password)`
   - Jika salah → 401 "Invalid password"

4. **Check Status:**
   - Jika `status === 'pending'` → 403 "Pendaftaran kamu masih dalam proses peninjauan" + redirect ke `/check-status?nisn=X`
   - Jika `status === 'inactive'` → 403 "Akun kamu dinonaktifkan"

5. **Session Fixation Protection:**
   ```typescript
   await db.delete(sessions).where(eq(sessions.userId, user.id));
   ```

6. **Create Session:**
   ```typescript
   const session = await lucia.createSession(user.id, {});
   const sessionCookie = lucia.createSessionCookie(session.id);
   cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
   ```

7. **Response:** `{success: true, message: 'Login berhasil', user: {...}}`

**Dependency:**
- `src/lib/auth.ts` - lucia instance
- `@node-rs/argon2` - password verification

**Side Effects:**
- Invalidate semua session lama user tersebut
- Create session baru di `sessions` table
- Set session cookie di browser

---

#### Logout Flow
**File:** `src/pages/api/auth/logout.ts`

**Logic:**
1. Invalidate session: `await lucia.invalidateSession(session.id)`
2. Clear cookie: `cookies.set(blankCookie.name, blankCookie.value, blankCookie.attributes)`
3. Redirect to `/login`

**Side Effects:**
- Delete session dari `sessions` table
- Clear session cookie

---

### 2. Member Management (Maintainer Only)

#### List Members
**File:** `src/pages/api/members/index.ts`

**Logic:**
1. **Auth Check:** `user.role !== 'maintainer'` → 403 Forbidden
2. **Query Params:**
   - `status` (optional): filter by status (pending/active/inactive)
   - `search` (optional): search by name, email, atau NISN (LIKE query)
   - `page`, `limit`: pagination (default: page=1, limit=20)

3. **Query dengan JOIN:**
   ```typescript
   const allUsers = await db
     .select({
       id, name, email, nisn, nis, class, role, status, joinedAt, approvedAt,
       tracks: sql`GROUP_CONCAT(${memberTracks.track})`.as('tracks')
     })
     .from(users)
     .leftJoin(memberTracks, eq(users.id, memberTracks.userId))
     .where(whereClause)
     .groupBy(users.id)
     .orderBy(desc(users.joinedAt))
     .limit(limit)
     .offset((page - 1) * limit);
   ```

4. **Count Total:**
   ```typescript
   const countResult = await db.select({ count: sql`COUNT(*)` })
     .from(users).where(whereClause);
   ```

5. **Response:** `{members: [...], total, page, limit}`

**Dependency:** None

**Side Effects:** None (read-only)

---

#### Approve/Reject Member
**File:** `src/pages/api/admin/approve.ts`

**Logic:**

**Approve:**
1. Update user status:
   ```typescript
   await tx.update(users)
     .set({ status: 'active', approvedAt: Date.now(), approvedBy: user.name })
     .where(eq(users.id, userId));
   ```

2. Generate Member Card:
   ```typescript
   const cardNumber = `SMAUII-${Date.now().toString(36).toUpperCase()}`;
   const qrCode = await QRCode.toDataURL(JSON.stringify({ cardNumber }));
   await tx.insert(memberCards).values({
     id: nanoid(), userId, cardNumber, qrCode, issuedAt: Date.now()
   });
   ```

3. Send Notification:
   ```typescript
   await createNotification(userId, 
     'Selamat! Akun kamu telah disetujui. Kartu anggota sudah tersedia.'
   );
   ```

**Reject:**
1. Delete user + related data (transaction):
   ```typescript
   await tx.delete(memberTracks).where(eq(memberTracks.userId, userId));
   await tx.delete(sessions).where(eq(sessions.userId, userId));
   await tx.delete(memberCards).where(eq(memberCards.userId, userId));
   await tx.delete(users).where(eq(users.id, userId));
   ```

**Dependency:**
- `qrcode` library - QR code generation
- `src/lib/notifications.ts` - createNotification

**Side Effects:**
- **Approve:** Update user status, create member card, send notification
- **Reject:** Delete user + all related data (cascade delete)

---

#### Set Password
**File:** `src/pages/api/admin/set-password.ts`

**Logic:**
1. **Auth Check:** `user.role !== 'maintainer'` → 403
2. **Validasi:**
   - `userId` dan `password` harus diisi
   - `password.length >= 6`
3. **Hash Password:**
   ```typescript
   const passwordHash = await hash(password, {
     memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1
   });
   ```
4. **Update User:**
   ```typescript
   await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
   ```

**Dependency:**
- `@node-rs/argon2` - password hashing

**Side Effects:** Update `passwordHash` field di `users` table

---

### 3. Projects Management

#### List Projects
**File:** `src/pages/api/projects/index.ts`

**Logic:**
1. **Auth Check:** Harus login
2. **Query Params:**
   - `userId` (optional): filter by user ID
   - `page`, `limit`: pagination (default: page=1, limit=12, max=50)

3. **Access Control:**
   - Jika `userId` provided → show projects dari user tersebut
   - Jika user bukan maintainer → hanya show projects milik sendiri
   - Jika maintainer → show all projects

4. **Query dengan JOIN:**
   ```typescript
   const allProjects = await db.select({
       id, title, description, url, imageUrl, createdAt, userId,
       userName: users.name
     })
     .from(projects)
     .leftJoin(users, eq(projects.userId, users.id))
     .where(whereClause)
     .orderBy(desc(projects.createdAt))
     .limit(limit)
     .offset(offset);
   ```

**Dependency:** None

**Side Effects:** None (read-only)

---

#### Create Project
**File:** `src/pages/api/projects/index.ts` (POST)

**Logic:**
1. **Auth Check:** `user.status !== 'active'` → 403 "Only active members can add projects"
2. **Validasi:** `title` harus diisi
3. **Insert:**
   ```typescript
   await db.insert(projects).values({
     id: nanoid(), userId: user.id, title,
     description: description || null,
     url: url || null,
     imageUrl: imageUrl || null,
     createdAt: Date.now()
   });
   ```

**Dependency:** None

**Side Effects:** Insert project ke database

---

#### Update/Delete Project
**File:** `src/pages/api/projects/[id].ts`

**Logic:**
1. **Auth Check:** Harus login
2. **Find Project:** `await db.query.projects.findFirst({ where: eq(projects.id, id) })`
   - Jika tidak ada → 404
3. **Authorization:**
   - Hanya owner (`project.userId === user.id`) atau maintainer yang bisa edit/delete
   - Jika bukan → 403 Forbidden
4. **Update/Delete:**
   ```typescript
   // Update
   await db.update(projects).set({ title, description, url }).where(eq(projects.id, id));
   
   // Delete
   await db.delete(projects).where(eq(projects.id, id));
   ```

**Dependency:** None

**Side Effects:** Update atau delete project

---

### 4. Activities Management

#### List Activities
**File:** `src/pages/api/activities/index.ts`

**Logic:**
1. **Auth Check:** Harus login
2. **Query Params:**
   - `type` (optional): filter by activity type
   - `startDate`, `endDate` (optional): filter by date range (Unix timestamp)
   - `page`, `limit`: pagination (default: page=1, limit=20, max=100)

3. **Access Control:**
   - Jika user bukan maintainer → hanya show activities milik sendiri
   - Jika maintainer → show all activities

4. **Query dengan JOIN:**
   ```typescript
   const allActivities = await db.select({
       id, type, title, description, url, createdAt, userId,
       userName: users.name
     })
     .from(activities)
     .leftJoin(users, eq(activities.userId, users.id))
     .where(whereClause)
     .orderBy(desc(activities.createdAt))
     .limit(limit)
     .offset(offset);
   ```

**Dependency:** None

**Side Effects:** None (read-only)

---

#### Create Activity
**File:** `src/pages/api/activities/index.ts` (POST)

**Logic:**
1. **Auth Check:** `user.status !== 'active'` → 403
2. **Validasi:** `type` dan `title` harus diisi
3. **Insert:**
   ```typescript
   await db.insert(activities).values({
     id: nanoid(), userId: user.id, type, title,
     description: description || null,
     url: url || null,
     createdAt: Date.now()
   });
   ```

**Dependency:** None

**Side Effects:** Insert activity ke database

---

#### Delete Activity
**File:** `src/pages/api/activities/[id].ts`

**Logic:**
1. **Auth Check:** Harus login
2. **Find Activity:** `await db.query.activities.findFirst({ where: eq(activities.id, id) })`
3. **Authorization:** Hanya owner atau maintainer yang bisa delete
4. **Delete:** `await db.delete(activities).where(eq(activities.id, id));`

**Dependency:** None

**Side Effects:** Delete activity

---

### 5. Announcements Management

#### List Announcements
**File:** `src/pages/api/announcements/index.ts`

**Logic:**
1. **Auth Check:** Harus login
2. **Query Params:** `page`, `limit` (default: page=1, limit=10, max=50)
3. **Query dengan JOIN:**
   ```typescript
   const allAnnouncements = await db.select({
       id, title, content, createdAt,
       creatorName: users.name
     })
     .from(announcements)
     .leftJoin(users, eq(announcements.createdBy, users.id))
     .orderBy(desc(announcements.createdAt))
     .limit(limit)
     .offset(offset);
   ```

**Dependency:** None

**Side Effects:** None (read-only)

---

#### Create Announcement
**File:** `src/pages/api/announcements/index.ts` (POST)

**Logic:**
1. **Auth Check:** `user.role !== 'maintainer'` → 403
2. **Validasi:** `title` dan `content` harus diisi
3. **Insert:**
   ```typescript
   await db.insert(announcements).values({
     id: nanoid(), title, content, createdBy: user.id, createdAt: Date.now()
   });
   ```
4. **Broadcast Notification:**
   ```typescript
   await notifyAllActiveMembers(`📢 Pengumuman baru: ${title}`);
   ```

**Dependency:**
- `src/lib/notifications.ts` - notifyAllActiveMembers

**Side Effects:**
- Insert announcement
- Create notification untuk semua active members

---

#### Update/Delete Announcement
**File:** `src/pages/api/announcements/[id].ts`

**Logic:**
1. **Auth Check:** `user.role !== 'maintainer'` → 403
2. **Find Announcement:** `await db.query.announcements.findFirst({ where: eq(announcements.id, id) })`
3. **Update/Delete:**
   ```typescript
   // Update
   await db.update(announcements).set({ title, content }).where(eq(announcements.id, id));
   
   // Delete
   await db.delete(announcements).where(eq(announcements.id, id));
   ```

**Dependency:** None

**Side Effects:** Update atau delete announcement (tidak ada notifikasi untuk update/delete)

---

### 6. Notifications

#### Get Notifications
**File:** `src/pages/api/notifications/index.ts`

**Logic:**
1. **Auth Check:** Harus login
2. **Query:**
   ```typescript
   const userNotifications = await db
     .select({ id, message, isRead, createdAt })
     .from(notifications)
     .where(eq(notifications.userId, user.id))
     .orderBy(desc(notifications.createdAt))
     .limit(20);
   ```

**Dependency:** None

**Side Effects:** None (read-only)

---

#### Mark Notification as Read
**File:** `src/pages/api/notifications/read.ts`

**Logic:**
1. **Auth Check:** Harus login
2. **Validasi:** `id` harus diisi
3. **Update:**
   ```typescript
   await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, id));
   ```

**Dependency:** None

**Side Effects:** Update `isRead` field

---

### 7. SLiMS Integration (Mock)

**File:** `src/pages/api/slims/verify.ts`

**Logic:**
1. **Validasi:** `nisn` harus diisi
2. **Mock Data Lookup:**
   ```typescript
   const MOCK_SLIMS_DATA = [
     { nisn: '1724', name: 'ALPIS GELIRIS TARI', email: '...', class: 'XII IPA 1', expiredAt: '2026-08-12' },
     // ... 7 more entries
   ];
   const member = MOCK_SLIMS_DATA.find(m => m.nisn === nisn);
   ```
3. **Check Expiry:**
   ```typescript
   const expireDate = new Date(member.expiredAt);
   const isExpired = expireDate < new Date();
   ```
4. **Response:** `{nisn, nis, name, email, class, isExpired, expiredAt, isPending}`

**Dependency:** None

**Side Effects:** None (read-only, mock data)

**⚠️ CATATAN:** Ini masih mock data. Perlu integrasi dengan SLiMS API yang real.

---

## Auth & Session Flow

### Arsitektur Saat Ini (Lucia v3 Session Cookie)

#### Session Creation
**File:** `src/lib/auth.ts`

```typescript
import { Lucia } from 'lucia';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';

const adapter = new DrizzleSQLiteAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: import.meta.env.PROD, // HTTPS only di production
    },
  },
  getUserAttributes: (attributes) => ({
    githubId: attributes.github_id,
    githubUsername: attributes.github_username,
    name: attributes.name,
    email: attributes.email,
    role: attributes.role,
    status: attributes.status,
    nisn: attributes.nisn,
  }),
});
```

**Karakteristik:**
- **Storage:** Session disimpan di `sessions` table (Turso)
- **Cookie:** HttpOnly, Secure (HTTPS), SameSite=Lax
- **Expiry:** Default 30 hari (configurable)
- **Refresh:** Session di-refresh otomatis jika `session.fresh === true`

---

#### Session Validation (Middleware)
**File:** `src/middleware.ts`

```typescript
export const onRequest: MiddlewareHandler = async (context, next) => {
  const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;
  
  if (sessionId) {
    const { session, user } = await lucia.validateSession(sessionId);
    
    if (session) {
      if (session.fresh) {
        // Refresh session cookie jika mendekati expiry
        const sessionCookie = lucia.createSessionCookie(session.id);
        context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
      }
      context.locals.session = session;
      context.locals.user = user;
    } else {
      // Session invalid/expired
      const blankCookie = lucia.createBlankSessionCookie();
      context.cookies.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
      context.locals.session = null;
      context.locals.user = null;
    }
  } else {
    context.locals.session = null;
    context.locals.user = null;
  }

  return next();
};
```

**Flow:**
1. Extract session ID dari cookie
2. Validate session via Lucia (query `sessions` table)
3. Jika valid → set `context.locals.session` dan `context.locals.user`
4. Jika invalid/expired → clear cookie
5. Lanjutkan ke handler

---

#### Guards (Authorization)
**File:** `src/lib/guards.ts`

```typescript
export function requireAuth(Astro: AstroGlobal): RedirectResponse | null {
  const { user } = Astro.locals;
  if (!user) return Astro.redirect('/login');
  if (user.status === 'pending') return Astro.redirect(`/check-status?nisn=${user.nisn}`);
  if (user.status === 'inactive') return Astro.redirect('/login?error=inactive');
  return null;
}

export function requireMaintainer(Astro: AstroGlobal): RedirectResponse | null {
  const { user } = Astro.locals;
  if (!user) return Astro.redirect('/login');
  if (user.role !== 'maintainer') return Astro.redirect('/app/overview');
  return null;
}

export function requireMember(Astro: AstroGlobal): RedirectResponse | null {
  const { user } = Astro.locals;
  if (!user) return Astro.redirect('/login');
  if (user.role === 'maintainer') return Astro.redirect('/app/overview');
  if (user.status === 'pending') return Astro.redirect(`/check-status?nisn=${user.nisn}`);
  if (user.status === 'inactive') return Astro.redirect('/login?error=inactive');
  return null;
}
```

**Usage di Pages:**
```astro
---
import { requireAuth } from '@lib/guards';
const redirect = requireAuth(Astro);
if (redirect) return redirect;
const { user } = Astro.locals; // Guaranteed to exist
---
```

---

### Tantangan Migrasi ke JAMstack

#### Problem: Lucia Session Cookie Tidak Kompatibel dengan CF Workers

**Alasan:**
1. **Stateless Workers:** CF Workers tidak punya persistent storage untuk session
2. **Cookie Limitations:** Workers bisa set cookie, tapi tidak bisa query database di middleware layer
3. **Edge Computing:** Session validation perlu query ke Turso → latensi tinggi jika dilakukan per request

**Solusi yang Mungkin:**

#### Opsi A: JWT Stateless (Recommended)

**Karakteristik:**
- Token disimpan di localStorage atau cookie (client-side)
- Token berisi payload: `{userId, role, status, exp}`
- Verify signature di Workers (tidak perlu query database)
- Refresh token untuk extend expiry

**Pros:**
- ✅ Stateless, cocok untuk edge computing
- ✅ Tidak perlu query database per request
- ✅ Scalable, fast

**Cons:**
- ❌ Tidak bisa invalidate token sebelum expiry (kecuali pakai blacklist)
- ❌ Token size lebih besar dari session ID
- ❌ Perlu implement refresh token mechanism

**Implementation:**
```typescript
// Generate JWT
import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(env.JWT_SECRET);
const token = await new SignJWT({ userId, role, status })
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime('7d')
  .sign(secret);

// Verify JWT
import { jwtVerify } from 'jose';

const { payload } = await jwtVerify(token, secret);
```

**Migration Impact:**
- Perlu ganti semua `Astro.locals.user` dengan JWT payload
- Perlu implement JWT middleware di Hono
- Perlu update frontend untuk store token di localStorage
- Perlu implement refresh token endpoint

---

#### Opsi B: Session di Turso via API

**Karakteristik:**
- Tetap pakai `sessions` table di Turso
- Setiap request ke API → query session dari database
- Session ID disimpan di cookie atau Authorization header

**Pros:**
- ✅ Bisa invalidate session kapan saja
- ✅ Mirip dengan arsitektur saat ini
- ✅ Tidak perlu ubah banyak logic

**Cons:**
- ❌ Query database per request → latensi tinggi
- ❌ Tidak optimal untuk edge computing
- ❌ Bottleneck di database

**Implementation:**
```typescript
// Hono middleware
app.use('*', async (c, next) => {
  const sessionId = c.req.cookie('session_id');
  if (!sessionId) return c.json({ error: 'Unauthorized' }, 401);

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: { user: true }
  });

  if (!session || session.expiresAt < Date.now()) {
    return c.json({ error: 'Session expired' }, 401);
  }

  c.set('user', session.user);
  await next();
});
```

**Migration Impact:**
- Perlu implement session validation middleware di Hono
- Perlu update frontend untuk send session cookie
- Perlu handle CORS untuk cookie

---

#### Opsi C: Cloudflare D1 untuk Session Storage

**Karakteristik:**
- Pindah `sessions` table dari Turso ke Cloudflare D1
- D1 adalah SQLite database native di CF Workers
- Session validation langsung di Workers (low latency)

**Pros:**
- ✅ Low latency (D1 co-located dengan Workers)
- ✅ Bisa invalidate session
- ✅ Native CF integration

**Cons:**
- ❌ Perlu migrasi session table ke D1
- ❌ Perlu maintain dua database (Turso untuk data, D1 untuk session)
- ❌ D1 masih beta (per 2026-04)

**Migration Impact:**
- Perlu setup D1 database
- Perlu migrasi schema `sessions` ke D1
- Perlu update Drizzle config untuk dual database
- Perlu implement session sync mechanism

---

### Rekomendasi: Opsi A (JWT Stateless)

**Alasan:**
1. **Simplicity:** Tidak perlu maintain session table
2. **Performance:** Stateless, no database query per request
3. **Scalability:** Edge-friendly, auto-scale
4. **Industry Standard:** JWT widely adopted untuk JAMstack

**Trade-off yang Bisa Diterima:**
- Logout tidak instant (token masih valid sampai expiry)
  - **Mitigasi:** Set expiry pendek (7 hari) + refresh token
- Token size lebih besar
  - **Mitigasi:** Payload minimal (userId, role, status saja)

**Implementation Plan:**
1. Buat JWT helper di `smauii-dev-api/src/lib/jwt.ts`
2. Update `/api/auth/login` untuk return JWT token
3. Buat middleware di Hono untuk verify JWT
4. Update frontend untuk store token di localStorage
5. Update semua API calls untuk include `Authorization: Bearer <token>`
6. Implement refresh token endpoint

---

## Frontend ↔ API Contract

### Halaman Dashboard dan API Dependencies

| Halaman | Path | Auth | API Calls | Data yang Dibutuhkan | Error Handling |
|---------|------|------|-----------|----------------------|----------------|
| **Overview (Maintainer)** | `/app/overview` | ✅ maintainer | `GET /api/admin/stats`<br>`GET /api/announcements` | `{stats: {pendingApproval, activeMembers, allUsers}, pendingUsers[]}` | Show error message jika fetch gagal |
| **Overview (Member)** | `/app/overview` | ✅ member | None (static) | User info dari SSR | - |
| **Member Card** | `/app/card` | ✅ member | None (SSR) | `{cardNumber, qrCode, issuedAt}` dari DB | Show "Kartu Belum Tersedia" jika null |
| **Members** | `/app/members` | ✅ maintainer | `GET /api/members?status=X&search=Y&page=N`<br>`POST /api/admin/approve`<br>`POST /api/admin/set-password` | `{members[], total, page, limit}` | Alert jika approve/reject gagal |
| **Projects** | `/app/projects` | ✅ | `GET /api/projects?page=N&limit=M`<br>`POST /api/projects`<br>`PATCH /api/projects/:id`<br>`DELETE /api/projects/:id` | `{projects[], total, page, limit}` | Alert jika CRUD gagal |
| **Activities** | `/app/activities` | ✅ | `GET /api/activities?page=N&limit=M`<br>`POST /api/activities`<br>`DELETE /api/activities/:id` | `{activities[], total, page, limit}` | Alert jika CRUD gagal |
| **Announcements** | `/app/announcements` | ✅ | `GET /api/announcements?page=N&limit=M`<br>`POST /api/announcements`<br>`PATCH /api/announcements/:id`<br>`DELETE /api/announcements/:id` | `{announcements[], total, page, limit}` | Alert jika CRUD gagal |
| **Profile** | `/app/profile` | ✅ | `GET /api/profile`<br>`PATCH /api/profile` | `{...user, tracks[], cardNumber?, cardQrCode?}` | Alert jika update gagal |
| **Settings** | `/app/settings` | ✅ | `PATCH /api/profile` | User info | Alert jika update gagal |
| **Login** | `/login` | ❌ | `POST /api/auth/login` | `{identifier, password}` → `{success, user}` + cookie | Show error message di form |
| **Register** | `/register` | ❌ | `POST /api/slims/verify`<br>`GET /api/register?identifier=X`<br>`POST /api/register` | Multi-step form | Show error per field |
| **Check Status** | `/check-status` | ❌ | `GET /api/register?identifier=X&checkStatus=true` | `{nisn, name, email, class, status, tracks[]}` | Show "Pendaftaran tidak ditemukan" |

---

### Client-Side Fetch Pattern (Saat Ini)

**Example dari `/app/projects.astro`:**
```typescript
async function load() {
  const params = new URLSearchParams({ page: String(currentPage), limit: String(PAGE_LIMIT) });
  const res = await fetch(`/api/projects?${params}`);
  const json = await res.json();
  const projectList = json.data?.projects || json.data || [];
  const total = json.data?.total || 0;
  // Render UI
}
```

**Pattern:**
1. Fetch dari `/api/*` (relative URL)
2. Parse JSON response: `{data: {...}}` atau `{error: '...'}`
3. Update DOM dengan vanilla JS (tidak pakai framework)
4. Error handling: `alert()` atau show error message di UI

---

### Perubahan yang Diperlukan untuk JAMstack

#### 1. API Base URL
**Saat Ini:**
```typescript
fetch('/api/projects') // Relative URL
```

**Setelah Migrasi:**
```typescript
const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'https://smauii-dev-api.username.workers.dev';
fetch(`${API_BASE_URL}/api/projects`)
```

**Implementation:**
- Tambahkan `PUBLIC_API_URL` di `.env`
- Buat helper function `apiUrl(path: string)` di `src/lib/api-client.ts`

---

#### 2. Authorization Header (JWT)
**Saat Ini:**
```typescript
fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
})
// Session cookie dikirim otomatis oleh browser
```

**Setelah Migrasi:**
```typescript
const token = localStorage.getItem('auth_token');
fetch(`${API_BASE_URL}/api/projects`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({...})
})
```

**Implementation:**
- Store JWT token di localStorage setelah login
- Buat helper function `authFetch()` yang auto-inject Authorization header
- Handle 401 response → redirect ke login

---

#### 3. CORS Handling
**Problem:** Browser akan block request dari `lab.smauiiyk.sch.id` ke `smauii-dev-api.workers.dev`

**Solution:** Enable CORS di Hono API
```typescript
import { cors } from 'hono/cors';

app.use('*', cors({
  origin: ['https://lab.smauiiyk.sch.id', 'http://localhost:4321'],
  credentials: true, // Jika pakai cookie
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
```

---

#### 4. Error Handling
**Saat Ini:**
```typescript
if (!res.ok) {
  alert('Gagal memuat data');
  return;
}
```

**Setelah Migrasi (Lebih Robust):**
```typescript
if (!res.ok) {
  if (res.status === 401) {
    // Unauthorized → redirect ke login
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    return;
  }
  const error = await res.json();
  alert(error.error || 'Terjadi kesalahan');
  return;
}
```

---

### API Client Helper (Recommended)

**File:** `src/lib/api-client.ts`
```typescript
const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787';

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
    
    if (res.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    
    const json = await res.json();
    
    if (!res.ok) {
      return { error: json.error || 'Request failed' };
    }
    
    return { data: json.data || json };
  } catch (error) {
    console.error('API request failed:', error);
    return { error: 'Network error' };
  }
}

// Usage
const { data, error } = await apiRequest<Project[]>('/api/projects');
if (error) {
  alert(error);
  return;
}
// Use data
```

---

### SSR → CSR Migration

**Saat Ini (SSR):**
```astro
---
import { requireAuth } from '@lib/guards';
const redirect = requireAuth(Astro);
if (redirect) return redirect;

const { user } = Astro.locals;
const projects = await db.query.projects.findMany({
  where: eq(projects.userId, user.id)
});
---

<div>
  {projects.map(p => <div>{p.title}</div>)}
</div>
```

**Setelah Migrasi (CSR):**
```astro
---
// No server-side data fetching
---

<div id="projects-container">
  <div class="loading">Loading...</div>
</div>

<script>
  import { apiRequest } from '@lib/api-client';
  
  async function loadProjects() {
    const container = document.getElementById('projects-container');
    const { data, error } = await apiRequest('/api/projects');
    
    if (error) {
      container.innerHTML = `<div class="error">${error}</div>`;
      return;
    }
    
    container.innerHTML = data.projects.map(p => 
      `<div>${p.title}</div>`
    ).join('');
  }
  
  loadProjects();
</script>
```

**Trade-off:**
- ❌ Tidak ada SSR → SEO kurang optimal (tapi dashboard tidak perlu SEO)
- ❌ Loading state perlu dihandle di client
- ✅ Static hosting → deployment lebih simple
- ✅ API bisa di-cache di edge

---

## Rencana Migrasi Bertahap

### Prinsip Migrasi
1. **Incremental:** Pindah per domain, bukan big bang
2. **Non-Breaking:** Frontend tetap bisa akses API lama selama migrasi
3. **Testable:** Setiap fase bisa di-test independen
4. **Rollback-able:** Bisa rollback ke fase sebelumnya jika ada masalah

---

### Fase 0: Persiapan (Tanpa Breaking Change)

**Tujuan:** Setup infrastruktur tanpa mengubah codebase utama

#### Checklist
- [ ] **Setup Hono API Boilerplate**
  - [ ] Install dependencies di `smauii-dev-api/`: `hono`, `drizzle-orm`, `@libsql/client`, `jose` (JWT)
  - [ ] Setup Drizzle config untuk Turso
  - [ ] Buat folder structure: `src/routes/`, `src/lib/`, `src/middleware/`
  - [ ] Test deploy ke CF Workers: `wrangler deploy`

- [ ] **Buat JWT Helper**
  - [ ] File: `smauii-dev-api/src/lib/jwt.ts`
  - [ ] Function: `generateToken(userId, role, status)`, `verifyToken(token)`
  - [ ] Test JWT generation & verification

- [ ] **Buat Auth Middleware**
  - [ ] File: `smauii-dev-api/src/middleware/auth.ts`
  - [ ] Verify JWT dari `Authorization: Bearer <token>` header
  - [ ] Set `c.set('user', payload)` untuk diakses di routes
  - [ ] Return 401 jika token invalid/expired

- [ ] **Setup CORS**
  - [ ] Install `hono/cors`
  - [ ] Configure allowed origins: `https://lab.smauiiyk.sch.id`, `http://localhost:4321`
  - [ ] Test CORS dari frontend dev server

- [ ] **Buat API Client Helper di Frontend**
  - [ ] File: `src/lib/api-client.ts`
  - [ ] Function: `apiRequest(path, options)` dengan auto-inject Authorization header
  - [ ] Handle 401 → redirect ke login
  - [ ] Test dengan mock API

- [ ] **Setup Environment Variables**
  - [ ] Frontend: `PUBLIC_API_URL` di `.env`
  - [ ] API: `JWT_SECRET`, `TURSO_URL`, `TURSO_TOKEN` di `wrangler.toml` (secrets)
  - [ ] Document di README

**Estimasi:** 2-3 hari

**Risiko:** Minimal (tidak ada perubahan di codebase utama)

**Rollback:** Tidak perlu (tidak ada deployment)

---

### Fase 1: Migrasi Auth Module

**Tujuan:** Pindah `/api/auth/*` dan `/api/register` ke Hono API

#### Checklist
- [ ] **Implement Auth Routes di Hono**
  - [ ] `POST /api/auth/login` → return JWT token (bukan session cookie)
  - [ ] `POST /api/auth/logout` → return success (client-side clear token)
  - [ ] `GET /api/auth/me` → verify JWT, return user data
  - [ ] `POST /api/register` → sama seperti sekarang
  - [ ] `GET /api/register?identifier=X` → check duplicate
  - [ ] `GET /api/register?identifier=X&checkStatus=true` → check status

- [ ] **Update Frontend Login**
  - [ ] File: `src/pages/login.astro`
  - [ ] Change fetch URL: `${API_BASE_URL}/api/auth/login`
  - [ ] Store JWT token di localStorage setelah login berhasil
  - [ ] Redirect ke `/app/overview`

- [ ] **Update Frontend Register**
  - [ ] File: `src/components/RegisterForm.tsx`
  - [ ] Change fetch URLs ke API baru
  - [ ] Test multi-step registration flow

- [ ] **Update Middleware (Temporary Dual Support)**
  - [ ] File: `src/middleware.ts`
  - [ ] Check JWT token di localStorage (client-side)
  - [ ] Fallback ke Lucia session jika JWT tidak ada
  - [ ] Set `Astro.locals.user` dari JWT payload

- [ ] **Testing**
  - [ ] Test login flow (NISN + password)
  - [ ] Test register flow (multi-step)
  - [ ] Test logout (clear token)
  - [ ] Test `/api/auth/me` endpoint
  - [ ] Test E2E auth tests: `tests/e2e/auth.spec.ts`

**Estimasi:** 2-3 hari

**Risiko:** Medium (auth adalah critical path)

**Rollback:** Revert frontend changes, API tetap bisa dipakai untuk testing

**File yang Diubah:**
- `smauii-dev-api/src/routes/auth.ts` (new)
- `smauii-dev-api/src/routes/register.ts` (new)
- `src/pages/login.astro` (update fetch URL)
- `src/components/RegisterForm.tsx` (update fetch URLs)
- `src/middleware.ts` (temporary dual support)

---

### Fase 2: Migrasi Profile & Notifications

**Tujuan:** Pindah `/api/profile` dan `/api/notifications/*`

#### Checklist
- [ ] **Implement Routes di Hono**
  - [ ] `GET /api/profile` → with auth middleware
  - [ ] `PATCH /api/profile` → update name/github
  - [ ] `GET /api/notifications` → list notifications
  - [ ] `POST /api/notifications/read` → mark as read

- [ ] **Update Frontend**
  - [ ] File: `src/pages/app/profile.astro` → use `apiRequest()`
  - [ ] File: `src/pages/app/settings.astro` → use `apiRequest()`
  - [ ] File: `src/lib/dashboard-init.ts` → update `loadNotifications()`

- [ ] **Testing**
  - [ ] Test profile GET/PATCH
  - [ ] Test notifications list
  - [ ] Test mark notification as read
  - [ ] Test E2E: `tests/e2e/profile-settings.spec.ts`

**Estimasi:** 1-2 hari

**Risiko:** Low (simple CRUD)

**Rollback:** Revert frontend changes

**File yang Diubah:**
- `smauii-dev-api/src/routes/profile.ts` (new)
- `smauii-dev-api/src/routes/notifications.ts` (new)
- `src/pages/app/profile.astro` (update)
- `src/pages/app/settings.astro` (update)
- `src/lib/dashboard-init.ts` (update)

---

### Fase 3: Migrasi Projects & Activities

**Tujuan:** Pindah `/api/projects/*` dan `/api/activities/*`

#### Checklist
- [ ] **Implement Routes di Hono**
  - [ ] `GET /api/projects` → with pagination
  - [ ] `POST /api/projects` → create project
  - [ ] `PATCH /api/projects/:id` → update project
  - [ ] `DELETE /api/projects/:id` → delete project
  - [ ] `GET /api/activities` → with pagination & filters
  - [ ] `POST /api/activities` → create activity
  - [ ] `DELETE /api/activities/:id` → delete activity

- [ ] **Update Frontend**
  - [ ] File: `src/pages/app/projects.astro` → use `apiRequest()`
  - [ ] File: `src/pages/app/activities.astro` → use `apiRequest()`
  - [ ] Update inline scripts untuk CRUD operations

- [ ] **Testing**
  - [ ] Test projects CRUD
  - [ ] Test activities CRUD
  - [ ] Test pagination
  - [ ] Test E2E: `tests/e2e/projects.spec.ts`, `tests/e2e/activities.spec.ts`

**Estimasi:** 2-3 hari

**Risiko:** Medium (banyak CRUD operations)

**Rollback:** Revert frontend changes

**File yang Diubah:**
- `smauii-dev-api/src/routes/projects.ts` (new)
- `smauii-dev-api/src/routes/activities.ts` (new)
- `src/pages/app/projects.astro` (update)
- `src/pages/app/activities.astro` (update)

---

### Fase 4: Migrasi Announcements

**Tujuan:** Pindah `/api/announcements/*`

#### Checklist
- [ ] **Implement Routes di Hono**
  - [ ] `GET /api/announcements` → with pagination
  - [ ] `POST /api/announcements` → create + broadcast notification
  - [ ] `PATCH /api/announcements/:id` → update
  - [ ] `DELETE /api/announcements/:id` → delete

- [ ] **Update Frontend**
  - [ ] File: `src/pages/app/announcements.astro` → use `apiRequest()`

- [ ] **Testing**
  - [ ] Test announcements CRUD
  - [ ] Test notification broadcast
  - [ ] Test E2E: `tests/e2e/announcements.spec.ts`

**Estimasi:** 1-2 hari

**Risiko:** Low

**Rollback:** Revert frontend changes

**File yang Diubah:**
- `smauii-dev-api/src/routes/announcements.ts` (new)
- `src/pages/app/announcements.astro` (update)

---

### Fase 5: Migrasi Members & Admin

**Tujuan:** Pindah `/api/members/*` dan `/api/admin/*`

#### Checklist
- [ ] **Implement Routes di Hono**
  - [ ] `GET /api/members` → with filters & pagination
  - [ ] `GET /api/admin/stats` → dashboard stats
  - [ ] `POST /api/admin/approve` → approve/reject member
  - [ ] `GET /api/admin/users` → list/get users
  - [ ] `PATCH /api/admin/users` → update user
  - [ ] `DELETE /api/admin/users` → delete user
  - [ ] `POST /api/admin/set-password` → set password

- [ ] **Update Frontend**
  - [ ] File: `src/pages/app/members.astro` → use `apiRequest()`
  - [ ] File: `src/pages/app/overview.astro` → update admin dashboard

- [ ] **Testing**
  - [ ] Test members list with filters
  - [ ] Test approve/reject flow
  - [ ] Test set password
  - [ ] Test admin stats
  - [ ] Test E2E: `tests/e2e/member-management.spec.ts`

**Estimasi:** 2-3 hari

**Risiko:** High (admin operations are critical)

**Rollback:** Revert frontend changes

**File yang Diubah:**
- `smauii-dev-api/src/routes/members.ts` (new)
- `smauii-dev-api/src/routes/admin.ts` (new)
- `src/pages/app/members.astro` (update)
- `src/pages/app/overview.astro` (update)

---

### Fase 6: Cleanup & Optimization

**Tujuan:** Hapus kode lama, optimize, deploy production

#### Checklist
- [ ] **Remove Old API Routes**
  - [ ] Delete `src/pages/api/` folder
  - [ ] Remove Lucia dependencies dari `package.json`
  - [ ] Remove `src/lib/auth.ts`
  - [ ] Update `src/middleware.ts` → remove Lucia session validation

- [ ] **Update Astro Config**
  - [ ] Change `output: 'server'` → `output: 'static'`
  - [ ] Remove Node adapter
  - [ ] Update `site` URL

- [ ] **Optimize Frontend**
  - [ ] Minify JS/CSS
  - [ ] Optimize images
  - [ ] Add service worker untuk offline support (optional)

- [ ] **Deploy Production**
  - [ ] Deploy frontend ke GitHub Pages
  - [ ] Deploy API ke CF Workers (production)
  - [ ] Update DNS untuk custom domain (optional)
  - [ ] Setup monitoring (Sentry, LogRocket, dll)

- [ ] **Update Documentation**
  - [ ] Update README dengan deployment instructions
  - [ ] Update API documentation
  - [ ] Update E2E tests untuk production URLs

- [ ] **Final Testing**
  - [ ] Run full E2E test suite
  - [ ] Manual testing di production
  - [ ] Load testing (optional)

**Estimasi:** 2-3 hari

**Risiko:** Low (cleanup phase)

**Rollback:** Keep old deployment as backup

**File yang Diubah:**
- Delete `src/pages/api/` (entire folder)
- `astro.config.mjs` (update)
- `package.json` (remove dependencies)
- `src/middleware.ts` (simplify)
- `.github/workflows/deploy.yml` (update)

---

### Timeline Summary

| Fase | Durasi | Risiko | Deliverable |
|------|--------|--------|-------------|
| Fase 0: Persiapan | 2-3 hari | Low | Hono API boilerplate, JWT helper, CORS setup |
| Fase 1: Auth | 2-3 hari | Medium | Login/register dengan JWT |
| Fase 2: Profile & Notifications | 1-2 hari | Low | Profile CRUD, notifications |
| Fase 3: Projects & Activities | 2-3 hari | Medium | Projects & activities CRUD |
| Fase 4: Announcements | 1-2 hari | Low | Announcements CRUD |
| Fase 5: Members & Admin | 2-3 hari | High | Admin dashboard, member management |
| Fase 6: Cleanup | 2-3 hari | Low | Production deployment |
| **Total** | **13-19 hari** | | **Full JAMstack migration** |

---

### Rollback Strategy

**Per Fase:**
1. Keep old API routes selama migrasi
2. Frontend bisa switch antara old/new API via environment variable
3. Jika ada masalah → revert frontend changes, API tetap berjalan

**Production Rollback:**
1. Keep old deployment (Astro SSR) as backup
2. DNS switch untuk rollback instant
3. Database tidak berubah (Turso tetap sama)

---

## Keputusan Teknis yang Perlu Dibuat

### 1. Auth Strategy

**Pertanyaan:** JWT stateless atau session di Turso?

**Opsi A: JWT Stateless (Recommended)**
- **Pros:** Stateless, fast, scalable, edge-friendly
- **Cons:** Tidak bisa invalidate sebelum expiry, token size lebih besar
- **Use Case:** Cocok untuk JAMstack, edge computing

**Opsi B: Session di Turso**
- **Pros:** Bisa invalidate kapan saja, mirip arsitektur saat ini
- **Cons:** Query database per request, latensi tinggi, bottleneck
- **Use Case:** Jika perlu instant logout atau revoke access

**Opsi C: Session di Cloudflare D1**
- **Pros:** Low latency, bisa invalidate, native CF integration
- **Cons:** Perlu maintain dua database, D1 masih beta
- **Use Case:** Jika perlu session tapi tetap low latency

**Rekomendasi:** **Opsi A (JWT Stateless)**
- Alasan: Simplicity, performance, industry standard
- Trade-off: Logout tidak instant (mitigasi: expiry pendek + refresh token)

**Keputusan:** [ ] Belum diputuskan

---

### 2. API Domain

**Pertanyaan:** Pakai custom domain atau workers.dev subdomain?

**Opsi A: Custom Domain (api.smauiiyk.sch.id)**
- **Pros:** Professional, branding, SEO-friendly
- **Cons:** Perlu setup DNS, SSL certificate (auto via CF)
- **Cost:** Gratis (Cloudflare DNS + SSL)

**Opsi B: Workers.dev Subdomain (smauii-dev-api.username.workers.dev)**
- **Pros:** Setup instant, no DNS config
- **Cons:** Tidak professional, panjang, tidak bisa custom

**Rekomendasi:** **Opsi A (Custom Domain)**
- Alasan: Professional, mudah diingat, branding
- Setup: Tambahkan CNAME record di Cloudflare DNS

**Keputusan:** [ ] Belum diputuskan

---

### 3. Token Storage

**Pertanyaan:** Store JWT token di localStorage atau cookie?

**Opsi A: localStorage**
- **Pros:** Simple, accessible dari JS, tidak perlu CORS credentials
- **Cons:** Vulnerable to XSS attack, tidak bisa HttpOnly
- **Use Case:** Jika tidak ada XSS risk (CSP strict)

**Opsi B: Cookie (HttpOnly, Secure)**
- **Pros:** Secure, HttpOnly (tidak bisa diakses JS), auto-sent
- **Cons:** Perlu CORS credentials, CSRF protection
- **Use Case:** Jika security adalah prioritas

**Rekomendasi:** **Opsi A (localStorage)**
- Alasan: Simplicity, JAMstack-friendly, CSP sudah strict
- Mitigasi XSS: CSP header, input sanitization (sudah ada)

**Keputusan:** [ ] Belum diputuskan

---

### 4. Refresh Token Strategy

**Pertanyaan:** Implement refresh token atau tidak?

**Opsi A: Refresh Token**
- **Pros:** Access token expiry pendek (15 menit), refresh token long-lived (7 hari)
- **Cons:** Lebih complex, perlu endpoint `/api/auth/refresh`
- **Use Case:** Jika perlu balance antara security dan UX

**Opsi B: Long-Lived Access Token**
- **Pros:** Simple, no refresh logic
- **Cons:** Jika token leaked, valid sampai expiry (7 hari)
- **Use Case:** Jika risk acceptable

**Rekomendasi:** **Opsi B (Long-Lived Access Token)**
- Alasan: Simplicity, acceptable risk untuk internal dashboard
- Expiry: 7 hari (user perlu login ulang seminggu sekali)

**Keputusan:** [ ] Belum diputuskan

---

### 5. Database Migration

**Pertanyaan:** Tetap pakai Turso atau pindah ke Cloudflare D1?

**Opsi A: Tetap Turso**
- **Pros:** Tidak perlu migrasi, schema sudah ada, Drizzle support
- **Cons:** Latensi sedikit lebih tinggi (query dari Workers ke Turso)
- **Use Case:** Jika tidak ada masalah performa

**Opsi B: Pindah ke Cloudflare D1**
- **Pros:** Low latency (co-located dengan Workers), native CF
- **Cons:** Perlu migrasi data, D1 masih beta, feature limited
- **Use Case:** Jika performa adalah prioritas

**Rekomendasi:** **Opsi A (Tetap Turso)**
- Alasan: Turso sudah production-ready, Drizzle support bagus, tidak perlu migrasi
- Turso latency acceptable untuk dashboard use case

**Keputusan:** [ ] Belum diputuskan

---

### 6. Frontend Deployment

**Pertanyaan:** Deploy ke GitHub Pages atau Cloudflare Pages?

**Opsi A: GitHub Pages**
- **Pros:** Gratis, terintegrasi dengan GitHub, simple setup
- **Cons:** Tidak ada edge caching, limited features
- **Use Case:** Jika budget adalah prioritas

**Opsi B: Cloudflare Pages**
- **Pros:** Edge caching, fast, terintegrasi dengan CF Workers, preview deployments
- **Cons:** Perlu setup CF account (tapi gratis)
- **Use Case:** Jika performa adalah prioritas

**Rekomendasi:** **Opsi B (Cloudflare Pages)**
- Alasan: Edge caching, fast, terintegrasi dengan CF Workers (same ecosystem)
- Setup: Connect GitHub repo ke CF Pages

**Keputusan:** [ ] Belum diputuskan

---

### 7. Error Monitoring

**Pertanyaan:** Pakai error monitoring service atau tidak?

**Opsi A: Sentry**
- **Pros:** Real-time error tracking, stack traces, user context
- **Cons:** Paid (free tier 5k errors/month)
- **Use Case:** Production monitoring

**Opsi B: Cloudflare Workers Analytics**
- **Pros:** Gratis, terintegrasi dengan Workers
- **Cons:** Limited features, no stack traces
- **Use Case:** Basic monitoring

**Opsi C: No Monitoring**
- **Pros:** Gratis, simple
- **Cons:** Sulit debug production issues
- **Use Case:** Development/testing only

**Rekomendasi:** **Opsi B (CF Workers Analytics)**
- Alasan: Gratis, cukup untuk monitoring basic
- Upgrade ke Sentry jika perlu advanced features

**Keputusan:** [ ] Belum diputuskan

---

### 8. Rate Limiting

**Pertanyaan:** Implement rate limiting atau tidak?

**Opsi A: Rate Limiting di Workers**
- **Pros:** Protect API dari abuse, DDoS protection
- **Cons:** Perlu implement logic, storage (KV atau Durable Objects)
- **Use Case:** Production API

**Opsi B: No Rate Limiting**
- **Pros:** Simple, no overhead
- **Cons:** Vulnerable to abuse
- **Use Case:** Internal dashboard dengan limited users

**Rekomendasi:** **Opsi B (No Rate Limiting)**
- Alasan: Internal dashboard, limited users (siswa SMA UII)
- Implement jika ada abuse di production

**Keputusan:** [ ] Belum diputuskan

---

### 9. Image Upload untuk Projects

**Pertanyaan:** Implement image upload atau tetap pakai URL external?

**Opsi A: Cloudflare R2 (S3-compatible)**
- **Pros:** Unlimited storage, fast, terintegrasi dengan CF
- **Cons:** Perlu setup R2 bucket, upload logic
- **Use Case:** Jika perlu host images

**Opsi B: External URL (GitHub, Imgur, dll)**
- **Pros:** Simple, no storage cost
- **Cons:** Depend on external service, bisa broken link
- **Use Case:** MVP, testing

**Rekomendasi:** **Opsi B (External URL)**
- Alasan: Simple, cukup untuk MVP
- Upgrade ke R2 jika perlu host images

**Keputusan:** [ ] Belum diputuskan

---

### 10. SLiMS Integration

**Pertanyaan:** Kapan implement real SLiMS API integration?

**Opsi A: Sekarang (Sebelum Migrasi)**
- **Pros:** Complete feature sebelum migrasi
- **Cons:** Perlu koordinasi dengan SLiMS admin, delay migrasi
- **Use Case:** Jika SLiMS API sudah ready

**Opsi B: Setelah Migrasi**
- **Pros:** Focus on migration first, SLiMS integration independen
- **Cons:** Tetap pakai mock data sementara
- **Use Case:** Jika SLiMS API belum ready

**Rekomendasi:** **Opsi B (Setelah Migrasi)**
- Alasan: Migrasi dan SLiMS integration adalah dua task independen
- Mock data cukup untuk testing migrasi

**Keputusan:** [ ] Belum diputuskan

---

## Summary Keputusan

| # | Keputusan | Opsi Recommended | Status |
|---|-----------|------------------|--------|
| 1 | Auth Strategy | JWT Stateless | ⏳ Pending |
| 2 | API Domain | Custom Domain (api.smauiiyk.sch.id) | ⏳ Pending |
| 3 | Token Storage | localStorage | ⏳ Pending |
| 4 | Refresh Token | Long-Lived Access Token (7 hari) | ⏳ Pending |
| 5 | Database | Tetap Turso | ⏳ Pending |
| 6 | Frontend Deployment | Cloudflare Pages | ⏳ Pending |
| 7 | Error Monitoring | CF Workers Analytics | ⏳ Pending |
| 8 | Rate Limiting | No Rate Limiting (internal use) | ⏳ Pending |
| 9 | Image Upload | External URL (MVP) | ⏳ Pending |
| 10 | SLiMS Integration | Setelah Migrasi | ⏳ Pending |

---

## Next Steps

1. **Review dokumen ini** dengan tim/stakeholder
2. **Putuskan semua keputusan teknis** di tabel di atas
3. **Mulai Fase 0 (Persiapan)** setelah semua keputusan final
4. **Setup project board** untuk tracking progress per fase
5. **Buat branch `feat/jamstack-migration`** untuk development

---

## Referensi

### Dokumentasi Terkait
- `docs/SESSION_HANDOFF.md` - Progress sesi sebelumnya
- `docs/TESTING_COMPLETE_SUMMARY.md` - Status testing
- `.kiro/steering/known-issues.md` - Known issues & backlog

### External Resources
- [Hono Documentation](https://hono.dev/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Drizzle ORM with Turso](https://orm.drizzle.team/docs/get-started-sqlite#turso)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Astro Static Output](https://docs.astro.build/en/guides/static-site-generation/)

---

**Dokumen ini dibuat:** 2026-04-15  
**Terakhir diupdate:** 2026-04-15  
**Status:** Draft - Menunggu Keputusan Teknis  
**Author:** Kiro AI Assistant


---

## E2E Typesafety Strategy

> Ditambahkan 2026-04-16 — berdasarkan diskusi arsitektur lanjutan

### Prinsip

> **Type yang sama dipakai dari DB → API → frontend tanpa duplikasi manual**

Stack yang sudah ada (Astro + Hono + Drizzle + Zod) **sudah ideal** untuk E2E typesafety. Tidak perlu ganti stack — hanya perlu merapikan struktur dan menghubungkan type antar layer.

---

### Struktur Monorepo Target

Saat ini semua dalam satu repo. Setelah migrasi JAMstack, struktur menjadi:

```
root/
  apps/
    web/          ← Astro static (GitHub Pages / CF Pages)
    api/          ← Hono + Cloudflare Workers
  packages/
    db/           ← Drizzle schema (single source of truth)
    types/        ← shared Zod schemas (opsional, bisa langsung dari db)
  package.json    ← pnpm workspaces root
```

Dengan struktur ini:
- `apps/api` import schema dari `packages/db`
- `apps/web` import type dari `packages/db` atau via Hono RPC client
- Tidak ada duplikasi type manual di mana pun

---

### Layer 1 — Database (Drizzle)

Schema sudah ada di `src/db/schema.ts`. Setelah migrasi ke monorepo, pindah ke `packages/db/schema.ts` sebagai **single source of truth**.

```ts
// packages/db/schema.ts
export const users = sqliteTable('users', { ... });

// Type otomatis dari schema — tidak perlu tulis manual
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
// ... dst untuk semua tabel
```

Dipakai di API:
```ts
import type { User } from '@smauii/db/schema';
```

Dipakai di Astro:
```ts
import type { User } from '@smauii/db/schema';
```

---

### Layer 2 — API (Hono RPC)

Hono punya built-in RPC client (`hc`) yang menghasilkan typed client dari definisi route — menghilangkan kebutuhan menulis interface manual untuk response API.

```ts
// apps/api/src/index.ts
import { Hono } from 'hono';
import type { User } from '@smauii/db/schema';

const app = new Hono()
  .get('/users', async (c) => {
    const users: User[] = await db.query.users.findMany();
    return c.json({ data: users });
  })
  .post('/admin/approve', zValidator('json', approveSchema), async (c) => {
    const { userId, action } = c.req.valid('json');
    // ...
    return c.json({ success: true });
  });

// Export type untuk dipakai client — ini kuncinya
export type AppType = typeof app;
```

---

### Layer 3 — Frontend (Hono Client)

```ts
// apps/web/src/lib/api.ts
import { hc } from 'hono/client';
import type { AppType } from '@smauii/api'; // import dari package api

const API_BASE = import.meta.env.PUBLIC_API_URL;
export const api = hc<AppType>(API_BASE);

// Usage — fully typed, auto-complete bekerja, tidak perlu cast manual
const res = await api.users.$get();
const { data } = await res.json(); // type: User[] — otomatis!
```

Tidak perlu lagi:
- Menulis interface response manual
- `as SomeType` setelah fetch
- Khawatir response shape berubah tanpa diketahui

---

### Layer 4 — Validasi Runtime (Zod)

Zod sudah ada di `src/lib/validation.ts`. Setelah migrasi, schemas dipindah ke `packages/db/` atau `packages/types/` dan di-share antara API dan frontend.

```ts
// packages/types/src/schemas.ts
import { z } from 'zod';

export const registerSchema = z.object({
  nisn: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  tracks: z.array(z.enum(['robotika', 'ai', 'data-science', 'network', 'security', 'software'])).min(1).max(3),
  // ...
});

export type RegisterInput = z.infer<typeof registerSchema>;
```

Dipakai di API (validasi request):
```ts
import { zValidator } from '@hono/zod-validator';
import { registerSchema } from '@smauii/types/schemas';

app.post('/register', zValidator('json', registerSchema), async (c) => {
  const body = c.req.valid('json'); // type: RegisterInput — otomatis!
  // ...
});
```

Dipakai di frontend (validasi form — sudah ada di `RegisterForm.tsx`):
```ts
import { registerSchema } from '@smauii/types/schemas';
const validated = registerSchema.parse(formData); // type-safe
```

---

### Mengapa Tidak tRPC?

tRPC adalah alternatif populer untuk E2E typesafety, tapi untuk setup ini:

| | Hono RPC | tRPC |
|---|---|---|
| Edge compatibility | ✅ Native CF Workers | ⚠️ Overhead lebih besar |
| Bundle size | ✅ Ringan | ❌ Lebih berat |
| REST compatibility | ✅ Standard HTTP | ❌ Custom protocol |
| Learning curve | ✅ Familiar | ❌ Perlu belajar tRPC |
| Ecosystem | ✅ Hono ecosystem | ✅ React ecosystem |

**Kesimpulan:** Hono RPC lebih cocok untuk setup ini. tRPC lebih cocok untuk Next.js + Node.js server tradisional.

---

### Checklist E2E Typesafety (untuk Fase 0 & 6 migrasi)

- [ ] Setup pnpm workspaces di root `package.json`
- [ ] Buat `packages/db/` — pindahkan `src/db/schema.ts`
- [ ] Export semua type dari `packages/db/schema.ts` (`$inferSelect`, `$inferInsert`)
- [ ] Buat `packages/types/` — pindahkan Zod schemas dari `src/lib/validation.ts`
- [ ] Setup Hono app dengan RPC-style routes di `apps/api/`
- [ ] Export `AppType` dari `apps/api/src/index.ts`
- [ ] Buat `apps/web/src/lib/api.ts` dengan `hc<AppType>`
- [ ] Update tsconfig di semua package untuk path resolution (`@smauii/db`, `@smauii/types`, `@smauii/api`)
- [ ] Install `@hono/zod-validator` di `apps/api/`
- [ ] Ganti semua manual `fetch()` di frontend dengan `api.xxx.$get/post/patch/delete()`
