# Auth, Session & Guard Patterns

## How Auth Works

Session validation happens **once per request** in `src/middleware.ts`. The result is stored in `Astro.locals`:

```ts
Astro.locals.user    // User object | null
Astro.locals.session // Session object | null
```

**Never** call `lucia.validateSession()` anywhere else — it causes double DB queries.

---

## Guard Functions (`src/lib/guards.ts`)

Always use these at the top of every `.astro` frontmatter in `/app/*`. Never write custom redirect logic.

```ts
import { requireAuth, requireMaintainer, requireMember } from '@lib/guards';

// Any logged-in, active user (member or maintainer)
const redirect = requireAuth(Astro);
if (redirect) return redirect;

// Maintainer only — redirects member → /app/overview
const redirect = requireMaintainer(Astro);
if (redirect) return redirect;

// Member only — redirects maintainer → /app/overview
const redirect = requireMember(Astro);
if (redirect) return redirect;
```

### Guard Behavior Matrix

| Guard | No user | pending | inactive | member | maintainer |
|-------|---------|---------|----------|--------|------------|
| `requireAuth` | → /login | → /check-status | → /login?error=inactive | ✅ | ✅ |
| `requireMaintainer` | → /login | — | — | → /app/overview | ✅ |
| `requireMember` | → /login | → /check-status | → /login?error=inactive | ✅ | → /app/overview |

### Page Guard Assignment

| Page | Guard |
|------|-------|
| `/app/overview` | `requireAuth` |
| `/app/members` | `requireMaintainer` |
| `/app/announcements` | `requireMaintainer` |
| `/app/settings` | `requireAuth` |
| `/app/profile` | `requireMember` |
| `/app/card` | `requireMember` |
| `/app/activities` | `requireAuth` |
| `/app/projects` | `requireAuth` |

---

## Accessing User in Pages

After the guard, `user` is guaranteed non-null:

```astro
---
import { requireAuth } from '@lib/guards';
const redirect = requireAuth(Astro);
if (redirect) return redirect;

const { user } = Astro.locals;
// user is non-null here — safe to use user!.name, user!.role, etc.
const isMaintainer = user!.role === 'maintainer';
const isActive = user!.status === 'active';
---
```

### User Object Shape

```ts
{
  id: string
  name: string
  email: string
  nisn: string
  role: 'member' | 'maintainer'
  status: 'pending' | 'active' | 'inactive'
  githubId: string | null
  githubUsername: string | null
}
```

Note: `class`, `nis`, `passwordHash`, `joinedAt`, etc. are **not** on the session user object. Query the DB directly if you need them.

---

## Auth in API Routes

```ts
export const POST: APIRoute = async ({ locals }) => {
  const { user } = locals;

  // Unauthenticated
  if (!user) return createErrorResponse('Unauthorized', 401);

  // Maintainer only
  if (user.role !== 'maintainer') return createErrorResponse('Forbidden', 403);

  // Active member only
  if (user.status !== 'active') return createErrorResponse('Forbidden', 403);
};
```

---

## Login Flows

### Email/NIS/NISN Login
- Endpoint: `POST /api/auth/login`
- Body: `{ identifier: string, password: string }`
- `identifier` is matched against both `users.nisn` AND `users.nis`
- Password verified with `@node-rs/argon2` `verify()`
- On success: Lucia creates session, sets httpOnly cookie, returns 200

### GitHub OAuth
- Start: `GET /api/auth/github` → redirects to GitHub
- Callback: `GET /api/auth/github/callback`
- Matches by `githubUsername` first, then `githubId`
- User must already exist in DB (no auto-registration via GitHub)
- On first login: updates `users.githubId` with GitHub's numeric ID

### Logout
- Endpoint: `POST /api/auth/logout`
- Invalidates Lucia session, clears cookie

---

## Session Cookie

Managed entirely by Lucia. Cookie name is `lucia.sessionCookieName`.
- `httpOnly: true`
- `secure: true` in production
- `sameSite: 'lax'`
- Auto-refreshed by middleware when `session.fresh === true`

---

## TypeScript: `Astro.locals` Types

Defined in `src/env.d.ts`. If you need to add fields to locals, update that file:

```ts
declare namespace App {
  interface Locals {
    session: import('lucia').Session | null;
    user: import('lucia').User | null;
  }
}
```
