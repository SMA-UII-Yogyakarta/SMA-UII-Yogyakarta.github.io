# Development Workflow

## Daily Workflow

```bash
# 1. Start dev server (run manually in terminal — never via agent)
pnpm dev
# → http://localhost:4321

# 2. After schema changes
pnpm db:generate   # generate migration
pnpm db:push       # apply to dev database

# 3. Reset + reseed database
pnpm db:seed:enhanced

# 4. Type check
pnpm astro check

# 5. Run tests
pnpm test          # unit tests
pnpm test:e2e      # E2E (requires dev server running)
```

---

## Adding a New Feature — Checklist

### New API endpoint
1. Create file in `src/pages/api/[category]/[name].ts`
2. Add Zod schema to `src/lib/validation.ts`
3. Follow template in `api-patterns.md`
4. Add to endpoint reference table in `api-patterns.md`
5. Test manually via browser or curl

### New dashboard page
1. Create `src/pages/app/[name].astro`
2. Add correct guard (see `auth-guards.md` → Page Guard Assignment)
3. Use `DashboardLayout` with appropriate page type pattern (see `ui-patterns.md`)
4. Add nav item to `src/lib/nav.ts` if needed
5. Update guard matrix in `auth-guards.md`

### New database table
1. Add table definition to `src/db/schema.ts`
2. Add relations
3. Export the inferred type at bottom of schema file
4. Run `pnpm db:generate` then `pnpm db:push`
5. Update `database-schema.md`

### New reusable component
- Server-rendered UI → `src/components/app/[Name].astro`
- Needs client interactivity → `src/components/[Name].tsx`
- Dashboard-specific → `src/components/app/`

---

## Environment Variables

```bash
# .env (copy from .env.example)
TURSO_URL=libsql://...
TURSO_TOKEN=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
PUBLIC_SITE_URL=http://localhost:4321
```

Rules:
- **Never** use `PUBLIC_` prefix for secrets or DB credentials
- `PUBLIC_SITE_URL` is the only `PUBLIC_` var — used for OAuth callback URL
- All other vars are server-only

---

## Git Conventions

```bash
# Branch naming
feat/[feature-name]
fix/[bug-name]
refactor/[what]
docs/[what]

# Commit messages (Bahasa Indonesia ok)
feat: tambah notifikasi otomatis saat approve member
fix: perbaiki TypeScript error di settings.astro
refactor: ekstrak helper createNotification ke lib/notifications.ts
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Astro pages | kebab-case | `check-status.astro` |
| Astro components | PascalCase | `PageHeader.astro` |
| React components | PascalCase | `RegisterForm.tsx` |
| API routes | `index.ts` or action name | `index.ts`, `approve.ts` |
| Lib utilities | kebab-case | `api-utils.ts`, `dashboard-init.ts` |
| Scripts | kebab-case | `seed-enhanced.ts` |

---

## Import Order Convention

```ts
// 1. Astro/framework
import type { APIRoute } from 'astro';

// 2. Database
import { db } from '@db';
import { users, memberCards } from '@db/schema';

// 3. ORM utilities
import { eq, or, desc } from 'drizzle-orm';

// 4. Internal lib
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';
import { requireAuth } from '@lib/guards';

// 5. External packages
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import { z } from 'zod';
```

---

## Debugging Tips

### Check current user session
```bash
curl -s http://localhost:4321/api/auth/me \
  -H "Cookie: <paste cookie from browser DevTools>"
```

### Check database state
```bash
pnpm db:studio
# → opens https://local.drizzle.studio
```

### Check API response
```bash
curl -s -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"0000000001","password":"test123"}' | jq
```

### Reset everything
```bash
bun run scripts/drop-tables.ts
pnpm db:push
pnpm db:seed:enhanced
```

---

## Production Deployment

App runs as Node.js SSR server (not static):
- Build: `pnpm build`
- Output: `dist/` with `dist/server/entry.mjs`
- Start: `node dist/server/entry.mjs`
- Port: set via `PORT` env var (default 4321)

**Not compatible with GitHub Pages** — requires a Node.js server.  
Recommended: Cloudflare Pages (SSR via Workers) or any VPS/container.

---

## Testing Accounts

Always use these for manual testing — never create real student data in dev:

| Role | NISN | Password |
|------|------|----------|
| Maintainer | `0000000001` | `test123` |
| Active Member | `1234567890` | `test123` |
| Active Member | `1234567891` | `test123` |
| Pending Member | `1234567895` | (none) |

Reseed: `pnpm db:seed:enhanced`
