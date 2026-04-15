# Database Schema Reference

Database: **Turso (libSQL/SQLite)** via **Drizzle ORM**  
Schema file: `src/db/schema.ts`  
Client: `src/db/index.ts` — import as `import { db } from '@db'`

---

## Tables Overview

| Table | Purpose | Key Relations |
|-------|---------|---------------|
| `users` | All accounts (member, maintainer) | → tracks, card, sessions, activities |
| `member_tracks` | Track interests per user | → users |
| `sessions` | Lucia auth sessions | → users |
| `member_cards` | Digital member card (post-approval) | → users (1:1) |
| `activities` | Contribution/event log | → users |
| `notifications` | In-app alerts per user | → users |
| `announcements` | Admin broadcast posts | → users (creator) |
| `projects` | Member project showcase | → users |

---

## Table Definitions

### `users`
```ts
id: text (PK, nanoid)
nisn: text (unique, NOT NULL)       // 10-digit student ID
nis: text (unique, NOT NULL)        // school-specific ID
name: text (NOT NULL)
email: text (unique, NOT NULL)
githubUsername: text (nullable)
githubId: text (nullable)           // filled on first GitHub OAuth login
passwordHash: text (nullable)       // argon2 hash, set by maintainer
class: text (NOT NULL)              // e.g. 'X IPA 1', 'XI IPS 2'
role: text (NOT NULL, default 'member')    // 'member' | 'maintainer'
status: text (NOT NULL, default 'pending') // 'pending' | 'active' | 'inactive'
joinedAt: integer (NOT NULL)        // Unix ms
approvedAt: integer (nullable)      // Unix ms
approvedBy: text (nullable)         // name of approving maintainer
```
Indexes: `nisn`, `email`, `status`

### `member_tracks`
```ts
id: text (PK, nanoid)
userId: text (FK → users.id, NOT NULL)
track: text (NOT NULL)  // 'robotika' | 'ai' | 'data-science' | 'network' | 'security' | 'software'
joinedAt: integer (NOT NULL)  // Unix ms
```
Indexes: `userId`, `track`

### `sessions`
```ts
id: text (PK)           // managed by Lucia
userId: text (FK → users.id, NOT NULL)
expiresAt: integer (NOT NULL)  // Unix ms
```
Index: `userId`

### `member_cards`
```ts
id: text (PK, nanoid)
userId: text (FK → users.id, unique, NOT NULL)  // 1:1 with users
cardNumber: text (unique, NOT NULL)  // format: 'SMAUII-<base36timestamp>'
qrCode: text (NOT NULL)              // base64 data URL from qrcode library
issuedAt: integer (NOT NULL)         // Unix ms
```

### `activities`
```ts
id: text (PK, nanoid)
userId: text (FK → users.id, NOT NULL)
type: text (NOT NULL)  // 'contribution' | 'event' | 'workshop' | 'meeting' | 'other'
title: text (NOT NULL)
description: text (nullable)
url: text (nullable)
createdAt: integer (NOT NULL)  // Unix ms
```
Indexes: `userId`, `createdAt`

### `notifications`
```ts
id: text (PK, nanoid)
userId: text (FK → users.id, NOT NULL)
message: text (NOT NULL)
isRead: integer (NOT NULL, default 0)  // 0 = unread, 1 = read
createdAt: integer (NOT NULL)          // Unix ms
```
Indexes: `userId`, `createdAt`

### `announcements`
```ts
id: text (PK, nanoid)
title: text (NOT NULL)
content: text (NOT NULL)
createdBy: text (FK → users.id, NOT NULL)
createdAt: integer (NOT NULL)  // Unix ms
```

### `projects`
```ts
id: text (PK, nanoid)
userId: text (FK → users.id, NOT NULL)
title: text (NOT NULL)
description: text (nullable)
url: text (nullable)
imageUrl: text (nullable)  // not yet implemented — field exists for future use
createdAt: integer (NOT NULL)  // Unix ms
```
Index: `userId`

---

## Exported Types

```ts
import type {
  User, NewUser,
  MemberTrack,
  Session,
  MemberCard,
  Activity,
  Notification,
  Announcement,
  Project,
} from '@db/schema';
```

---

## Drizzle Query Patterns

### findFirst with relation
```ts
import { db } from '@db';
import { users, memberTracks } from '@db/schema';
import { eq } from 'drizzle-orm';

const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: { tracks: true, card: true },
});
```

### findMany with filter
```ts
const activeMembers = await db.query.users.findMany({
  where: eq(users.status, 'active'),
  orderBy: (users, { desc }) => [desc(users.joinedAt)],
});
```

### insert
```ts
await db.insert(activities).values({
  id: nanoid(),
  userId: user.id,
  type: 'contribution',
  title: 'Built something cool',
  createdAt: Date.now(),
});
```

### update
```ts
await db.update(users)
  .set({ status: 'active', approvedAt: Date.now(), approvedBy: maintainer.name })
  .where(eq(users.id, userId));
```

### delete
```ts
await db.delete(sessions).where(eq(sessions.userId, userId));
```

### transaction (multi-table write)
```ts
await db.transaction(async (tx) => {
  await tx.update(users).set({ status: 'active' }).where(eq(users.id, userId));
  await tx.insert(memberCards).values({ id: nanoid(), userId, cardNumber, qrCode, issuedAt: Date.now() });
  await tx.insert(notifications).values({ id: nanoid(), userId, message: 'Akun kamu telah disetujui!', isRead: 0, createdAt: Date.now() });
});
```

---

## Valid Enum Values

### `users.role`
- `'member'` — regular student member
- `'maintainer'` — admin/teacher

### `users.status`
- `'pending'` — registered, awaiting approval
- `'active'` — approved, full access
- `'inactive'` — deactivated

### `users.class` (from `src/lib/validation.ts`)
X IPA 1–4, X IPS 1–3, XI IPA 1–4, XI IPS 1–3, XII IPA 1–4, XII IPS 1–3

### `member_tracks.track`
- `'robotika'` — Robotika/IoT
- `'ai'` — AI (Kecerdasan Buatan)
- `'data-science'` — Data Science
- `'network'` — Jaringan Komputer
- `'security'` — Keamanan Siber
- `'software'` — Software Engineering

### `activities.type`
- `'contribution'`, `'event'`, `'workshop'`, `'meeting'`, `'other'`

---

## Schema Change Workflow

```bash
# 1. Edit src/db/schema.ts
# 2. Generate migration
pnpm db:generate
# 3. Review generated SQL in drizzle/
# 4. Apply to database
pnpm db:push        # dev (direct push)
pnpm db:migrate     # production (run migration files)
```

**Never** modify `drizzle/` migration files manually.

---

## Approval Flow (Critical Business Logic)

When a maintainer approves a member, these must happen atomically in one transaction:
1. `users.status` → `'active'`
2. `users.approvedAt` → `Date.now()`
3. `users.approvedBy` → maintainer name
4. Insert `member_cards` row with QR code
5. (Optional) Insert `notifications` row for the user

When a maintainer rejects a member, delete in order (FK constraints):
1. Delete `member_tracks` where `userId`
2. Delete `sessions` where `userId`
3. Delete `member_cards` where `userId`
4. Delete `users` where `id`
