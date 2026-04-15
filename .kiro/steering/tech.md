# Tech Stack

## Core

- **Framework:** Astro 6.x — SSR mode (`output: 'server'`), Node adapter (standalone)
- **UI:** React 19 (interactive islands), Tailwind CSS v4 (via Vite plugin)
- **Database:** Turso (libSQL/SQLite) via Drizzle ORM
- **Auth:** Lucia v3 + `@lucia-auth/adapter-drizzle`; GitHub OAuth via Arctic
- **Validation:** Zod
- **Password hashing:** `@node-rs/argon2`
- **IDs:** nanoid
- **QR codes:** qrcode

## Runtime & Package Manager

- **Runtime:** Node.js ≥ 22.12.0; scripts run with **Bun** (preferred) or `tsx` for Node fallback
- **Package manager:** **pnpm** (use pnpm, not npm or yarn)

## Path Aliases

Always use these aliases — never use deep relative imports (`../../../`):

```
@/*           → src/*
@components/* → src/components/*
@layouts/*    → src/layouts/*
@lib/*        → src/lib/*
@db           → src/db/index.ts
@db/*         → src/db/*
@styles/*     → src/styles/*
```

Use relative imports only within the same directory.

## Common Commands

```bash
# Dev server (run manually in terminal)
pnpm dev

# Build
pnpm build

# Preview production build
pnpm preview

# Database
pnpm db:generate       # generate migration from schema changes
pnpm db:push           # push schema directly (dev only)
pnpm db:migrate        # run migrations
pnpm db:seed           # seed basic data
pnpm db:seed:enhanced  # seed with richer data
pnpm db:studio         # open Drizzle Studio

# Tests
pnpm test              # unit tests (Bun test runner)
pnpm test:e2e          # Playwright e2e tests
pnpm test:all          # both
```

## Testing

- **Unit:** Bun's built-in test runner (`bun test`)
- **E2E:** Playwright (`playwright.config.ts`)

## Environment Variables

Stored in `.env` (see `.env.example`). Key vars:

- `TURSO_URL` — Turso database URL (no `PUBLIC_` prefix — server-only)
- `TURSO_TOKEN` — Turso auth token (server-only, never expose to client)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — GitHub OAuth app credentials

Never use `PUBLIC_` prefix for secrets or database credentials.
