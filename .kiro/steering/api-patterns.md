# API Route Patterns

## Golden Rules

1. **Never call `lucia.validateSession()` in API routes** — middleware already does it, use `locals` directly
2. **Always return via `createErrorResponse` / `createSuccessResponse`** from `@lib/api-utils`
3. **Always validate input with Zod** — never trust raw request body
4. **Always check auth from `locals`** at the top of every protected route
5. **Use transactions** for any write that touches more than one table

---

## Standard Route Template

```ts
import type { APIRoute } from 'astro';
import { db } from '@db';
import { tableName } from '@db/schema';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';
import { z } from 'zod';

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Auth check
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);

  // 2. Role check (if needed)
  if (user.role !== 'maintainer') return createErrorResponse('Forbidden', 403);

  // 3. Parse + validate body
  let body: unknown;
  try { body = await request.json(); }
  catch { return createErrorResponse('Invalid JSON', 400); }

  const schema = z.object({ field: z.string().min(1) });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return createErrorResponse('Validasi gagal', 422, {
      code: 'VALIDATION_ERROR',
      details: Object.fromEntries(
        parsed.error.issues.map(i => [i.path[0], i.message])
      ),
    });
  }

  // 4. Business logic
  try {
    const result = await db.insert(tableName).values({ ...parsed.data });
    return createSuccessResponse({ success: true }, 201);
  } catch (error) {
    console.error('Route error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
```

---

## Auth Patterns

### Public endpoint (no auth needed)
```ts
export const GET: APIRoute = async ({ request }) => {
  // No auth check needed
};
```

### Any authenticated user
```ts
const { user } = locals;
if (!user) return createErrorResponse('Unauthorized', 401);
```

### Maintainer only
```ts
const { user } = locals;
if (!user || user.role !== 'maintainer') return createErrorResponse('Forbidden', 403);
```

### Owner or maintainer
```ts
const { user } = locals;
if (!user) return createErrorResponse('Unauthorized', 401);
if (resource.userId !== user.id && user.role !== 'maintainer') {
  return createErrorResponse('Forbidden', 403);
}
```

---

## Response Shapes

### Success
```ts
// Single item
return createSuccessResponse({ user: { id, name } });
// → { data: { user: { id, name } } }

// List
return createSuccessResponse({ items, total });
// → { data: { items: [...], total: N } }

// Created
return createSuccessResponse({ success: true, id: newId }, 201);
```

### Error
```ts
return createErrorResponse('Pesan error', 400);
return createErrorResponse('Validasi gagal', 422, { code: 'VALIDATION_ERROR', details: { field: 'msg' } });
return createErrorResponse('User tidak ditemukan', 404, { code: 'NOT_FOUND' });
```

### Standard error codes
| Code | Meaning |
|------|---------|
| `MISSING_FIELD` | Required field not provided |
| `VALIDATION_ERROR` | Zod validation failed |
| `USER_NOT_FOUND` | User lookup failed |
| `USER_EXISTS` | Duplicate NISN/NIS/email |
| `INVALID_PASSWORD` | Wrong password |
| `NO_PASSWORD_SET` | User has no password hash |
| `INVALID_STATE` | OAuth state mismatch |
| `NOT_FOUND` | Resource not found |
| `FORBIDDEN` | Insufficient permissions |

---

## Database Patterns

### Single query
```ts
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: { tracks: true },
});
```

### Multi-table write — always use transaction
```ts
await db.transaction(async (tx) => {
  await tx.update(users).set({ status: 'active' }).where(eq(users.id, userId));
  await tx.insert(memberCards).values({ id: nanoid(), userId, cardNumber, qrCode, issuedAt: Date.now() });
});
```

### Timestamps — always Unix milliseconds
```ts
// ✅ Correct
joinedAt: Date.now()
createdAt: Date.now()

// ❌ Wrong
joinedAt: new Date().toISOString()
createdAt: new Date()
```

### IDs — always nanoid
```ts
import { nanoid } from 'nanoid';
const id = nanoid();
```

---

## Validation Schemas

Add all new schemas to `src/lib/validation.ts`. Never define inline Zod schemas in route files.

```ts
// src/lib/validation.ts
export const mySchema = z.object({
  title: z.string().min(1, 'Judul harus diisi').max(200),
  description: z.string().optional(),
  url: z.string().url('URL tidak valid').optional().or(z.literal('')),
});
```

---

## Existing API Endpoints Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | public | Login NISN/NIS + password |
| POST | `/api/auth/logout` | any | Logout + clear session |
| GET | `/api/auth/me` | any | Get current user |
| GET | `/api/auth/github` | public | GitHub OAuth redirect |
| GET | `/api/auth/github/callback` | public | GitHub OAuth callback |
| POST | `/api/register` | public | Register new member |
| GET | `/api/register` | public | Check NISN/status |
| POST | `/api/slims/verify` | public | Verify NISN via SLiMS |
| GET | `/api/members` | maintainer | List members with filters |
| POST | `/api/admin/approve` | maintainer | Approve/reject member |
| POST | `/api/admin/set-password` | maintainer | Set member password |
| GET | `/api/admin/stats` | maintainer | Dashboard statistics |
| GET | `/api/admin/users` | maintainer | Admin user list |
| PATCH | `/api/profile` | any auth | Update own profile |
| GET | `/api/projects` | any auth | List projects |
| POST | `/api/projects` | active member | Create project |
| GET | `/api/activities` | any auth | List activities |
| POST | `/api/activities` | active member | Log activity |
| GET | `/api/announcements` | any auth | List announcements |
| POST | `/api/announcements` | maintainer | Create announcement |
| GET | `/api/notifications` | any auth | List notifications |
| POST | `/api/notifications/read` | any auth | Mark notification read |
| GET | `/api/health` | public | Health check |

---

## Security Checklist for Every Route

- [ ] Auth check at top (before any DB query)
- [ ] Input validated with Zod
- [ ] User-supplied strings sanitized with `escapeHtml` / `sanitizeObject` if stored and later rendered as HTML
- [ ] No `lucia.validateSession()` call (use `locals`)
- [ ] Multi-table writes wrapped in transaction
- [ ] Error logged with `console.error` before returning 500
