# Tech Stack

## Core

- **Framework:** Astro 6.x — SSR mode (`output: 'server'`), Node adapter (standalone)
- **UI:** React 19 (interactive islands), Tailwind CSS v4 (via Vite plugin)
- **Database:** Turso (libSQL/SQLite) via Drizzle ORM
- **Auth:** Lucia v3 + `@lucia-auth/adapter-drizzle`; GitHub OAuth via Arctic
- **Validation:** Zod
- **Password hashing:** `@node-rs/argon2` (foundation SSR) / `bcryptjs` (smauii-dev-api CF Workers)
- **IDs:** nanoid
- **QR codes:** qrcode

## Runtime & Package Manager

- **Runtime:** Node.js ≥ 22.12.0
- **Package manager:** **Bun** — gunakan `bun`, bukan `pnpm`, `npm`, atau `yarn`
- Scripts dijalankan dengan `bun run <script>`

## Path Aliases

Selalu gunakan alias ini — jangan gunakan relative import dalam (`../../../`):

```
@/*           → src/*
@components/* → src/components/*
@layouts/*    → src/layouts/*
@lib/*        → src/lib/*
@db           → src/db/index.ts
@db/*         → src/db/*
@styles/*     → src/styles/*
```

Gunakan relative import hanya dalam direktori yang sama.

## Common Commands

```bash
# Dev server (jalankan manual di terminal — jangan via agent)
bun run dev

# Build
bun run build

# Preview production build
bun run preview

# Type check — harus 0 errors, 0 warnings, 0 hints sebelum commit
bun run check

# Database
bun run db:push           # push schema langsung (dev only)
bun run db:studio         # buka Drizzle Studio
bun run db:setup:enhanced # reset + seed database preview

# Tests
bun test                  # unit tests
bun run test:e2e          # Playwright e2e tests
bun run ci                # full CI pipeline lokal
```

## Testing

- **Unit:** Bun's built-in test runner (`bun test`)
- **E2E:** Playwright (`playwright.config.ts`) — port 5174 untuk test isolation

## Environment Variables

Tersimpan di `.env` (lihat `.env.example`). Variabel utama:

- `TURSO_URL` — Turso database URL (tanpa prefix `PUBLIC_` — server-only)
- `TURSO_TOKEN` — Turso auth token (server-only, jangan expose ke client)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — GitHub OAuth app credentials

**Jangan pernah** gunakan prefix `PUBLIC_` untuk secrets atau database credentials.
