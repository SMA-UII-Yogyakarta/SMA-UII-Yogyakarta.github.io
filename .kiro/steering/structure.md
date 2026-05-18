# Project Structure

```
src/
├── components/
│   ├── app/              # Reusable dashboard UI pieces (PageHeader, Modal, EmptyState, SkeletonList)
│   ├── MemberCard.tsx    # React component for digital member card
│   ├── RegisterForm.tsx  # Multi-step registration form (React)
│   ├── Sidebar.astro     # Dashboard sidebar (role-aware nav)
│   └── Topbar.astro      # Dashboard top bar with notifications
├── db/
│   ├── index.ts          # Drizzle client (Turso connection)
│   └── schema.ts         # All table definitions + relations + exported types
├── layouts/
│   ├── Layout.astro      # Base public layout
│   ├── AuthLayout.astro  # Layout for auth pages (login, register)
│   └── DashboardLayout.astro  # Authenticated app shell (sidebar + topbar)
├── lib/
│   ├── api-utils.ts      # createErrorResponse, createSuccessResponse, escapeHtml, sanitizeObject
│   ├── auth.ts           # Lucia instance + getUserAttributes config
│   ├── constants.ts      # STATUS_COLORS, ACTIVITY_TYPE_COLORS
│   ├── dashboard-init.ts # Client-side dashboard bootstrap (notifications, etc.)
│   ├── format.ts         # Date/number formatting helpers
│   ├── guards.ts         # requireAuth, requireMaintainer, requireMember (server-side redirects)
│   ├── nav.ts            # navItems config for sidebar
│   ├── oauth.ts          # Arctic GitHub OAuth client
│   └── validation.ts     # Zod schemas for all forms/API inputs
├── middleware.ts          # Session validation → locals.user/session; security headers
├── pages/
│   ├── api/              # API endpoints (Astro API routes)
│   │   ├── auth/         # login, logout, me, github OAuth
│   │   ├── admin/        # approve, users, stats, set-password (maintainer only)
│   │   ├── members/      # member list
│   │   ├── activities/   # activity log
│   │   ├── announcements/
│   │   ├── notifications/ # list + mark read
│   │   ├── projects/
│   │   ├── slims/verify  # NISN verification
│   │   ├── profile.ts    # PATCH own profile
│   │   ├── register.ts   # POST registration
│   │   └── health.ts
│   ├── app/              # Authenticated dashboard pages (all guarded)
│   │   ├── index.astro   # Dashboard home (redirects by role)
│   │   ├── overview.astro
│   │   ├── members.astro     # maintainer only
│   │   ├── announcements.astro
│   │   ├── activities.astro
│   │   ├── projects.astro
│   │   ├── card.astro
│   │   ├── profile.astro
│   │   └── settings.astro
│   ├── index.astro       # Public landing page
│   ├── login.astro
│   ├── register.astro
│   ├── success.astro     # Post-registration confirmation
│   ├── check-status.astro
│   └── ...               # Other public pages (about, members, projects, tracks)
└── styles/
    └── global.css        # Tailwind base + global styles

scripts/                  # Bun/Node scripts for DB management (migrate, seed, etc.)
drizzle/                  # Generated migration SQL files
docs/                     # Architecture and dev documentation
```

## Key Conventions

### Auth Guards
Always use helpers from `@lib/guards` at the top of `.astro` frontmatter — never roll your own redirect logic:
```ts
const redirect = requireAuth(Astro);       // any logged-in user
if (redirect) return redirect;

const redirect = requireMaintainer(Astro); // maintainer role only
if (redirect) return redirect;
```

### API Routes
- Read auth from `Astro.locals.user` / `Astro.locals.session` — **never** call `lucia.validateSession()` directly in API routes (middleware already does it)
- Return responses via `createErrorResponse` / `createSuccessResponse` from `@lib/api-utils`
- Validate all input with Zod schemas from `@lib/validation`
- Sanitize user-supplied strings with `escapeHtml` / `sanitizeObject` before storing or rendering

### Database
- All schema changes go in `src/db/schema.ts`; run `bun run db:push` (dev) or `bun run db:migrate` (production)
- Timestamps are stored as Unix milliseconds (integer), not ISO strings
- Always use transactions for multi-table writes

### Components
- Astro components (`.astro`) for static/server-rendered UI
- React components (`.tsx`) only when client-side interactivity is needed
- Interactive client scripts in `.astro` files use `<script>` tags (bundled by Vite)

### Layouts
- Public pages → `Layout.astro`
- Auth pages (login, register) → `AuthLayout.astro`
- Dashboard pages (`/app/*`) → `DashboardLayout.astro`
