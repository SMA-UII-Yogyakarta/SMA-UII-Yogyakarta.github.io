# Deployment Guide

## Arsitektur

App berjalan sebagai **Node.js SSR server** — bukan static site.
- Framework: Astro 6 dengan `output: 'server'` + Node adapter standalone
- Build output: `dist/server/entry.mjs`
- **Tidak kompatibel dengan GitHub Pages** (butuh server runtime)

---

## Environment: Development vs Production

| | Development | Production |
|--|-------------|------------|
| Database | `smauiilab-prev` (Turso) | `smauiilab` (Turso) |
| URL | `http://localhost:4321` | `https://lab.smauiiyk.sch.id` |
| OAuth callback | `http://localhost:4321/api/auth/github/callback` | `https://lab.smauiiyk.sch.id/api/auth/github/callback` |
| Cookie secure | `false` | `true` (HTTPS only) |

---

## Environment Variables Production

Set semua ini di server/platform production:

```bash
# Database — gunakan smauiilab (bukan smauiilab-prev)
TURSO_URL=libsql://smauiilab-sandikodev.aws-us-east-1.turso.io
TURSO_TOKEN=<production-token>

# GitHub OAuth — gunakan OAuth App yang callback URL-nya production
OAUTH_GITHUB_CLIENT_ID=<prod-client-id>
OAUTH_GITHUB_CLIENT_SECRET=<prod-client-secret>

# Site
PUBLIC_SITE_URL=https://lab.smauiiyk.sch.id
PUBLIC_SITE_NAME=SMA UII Lab
```

**Jangan** pakai nilai dari `.env` (development) untuk production.

---

## Build & Run

```bash
# Build
pnpm build
# Output: dist/

# Jalankan production server
node dist/server/entry.mjs

# Dengan port custom
PORT=3000 node dist/server/entry.mjs
```

---

## Rekomendasi Platform

### Cloudflare Pages (Rekomendasi Utama)
- Gratis untuk project kecil
- SSR via Cloudflare Workers
- Deploy otomatis dari GitHub
- Edge network global

Setup:
1. Connect repo di Cloudflare Pages dashboard
2. Build command: `pnpm build`
3. Output directory: `dist`
4. Set env vars di Settings → Environment variables
5. Ganti adapter di `astro.config.mjs`:
   ```js
   import cloudflare from '@astrojs/cloudflare';
   adapter: cloudflare()
   ```

### VPS / Railway / Render
- Jalankan sebagai Node.js process
- Build: `pnpm build`
- Start: `node dist/server/entry.mjs`
- Set env vars di platform dashboard

---

## Database Migration ke Production

Sebelum deploy pertama kali atau setelah schema change:

```bash
# Set env ke production dulu
export TURSO_URL=libsql://smauiilab-sandikodev.aws-us-east-1.turso.io
export TURSO_TOKEN=<prod-token>

# Push schema
pnpm db:push

# Atau jalankan migration files
pnpm db:migrate
```

**Jangan** jalankan `drop-tables.ts` di production.

---

## GitHub OAuth App untuk Production

Buat OAuth App terpisah untuk production:
1. Buka https://github.com/settings/developers
2. New OAuth App:
   - Homepage URL: `https://lab.smauiiyk.sch.id`
   - Callback URL: `https://lab.smauiiyk.sch.id/api/auth/github/callback`
3. Copy Client ID dan Client Secret ke env vars production

---

## CI/CD Pipeline

File: `.github/workflows/test.yml`

Trigger: push/PR ke `main` atau `develop`

Jobs:
1. **Unit Tests** — `pnpm test`
2. **E2E Tests** — reset DB preview → seed → jalankan Playwright
3. **Type Check** — `pnpm astro check`

GitHub Secrets yang dibutuhkan:
```
TURSO_URL          → smauiilab-prev URL (database CI/preview)
TURSO_TOKEN        → smauiilab-prev token
OAUTH_GITHUB_CLIENT_ID     → client ID (bisa dummy untuk CI)
OAUTH_GITHUB_CLIENT_SECRET → client secret (bisa dummy untuk CI)
```

---

## Checklist Deploy Production

- [ ] `TURSO_URL` mengarah ke `smauiilab` (bukan `smauiilab-prev`)
- [ ] `PUBLIC_SITE_URL` = `https://lab.smauiiyk.sch.id`
- [ ] GitHub OAuth App callback URL sudah diupdate
- [ ] Schema database sudah di-migrate (`pnpm db:push`)
- [ ] Maintainer account sudah ada di database production
- [ ] Build berhasil tanpa error (`pnpm build`)
- [ ] Type check bersih (`pnpm astro check`)
- [ ] E2E tests pass di environment preview

---

## Rollback

Jika ada masalah setelah deploy:
1. Revert ke commit sebelumnya di Git
2. Rebuild dan redeploy
3. Jika ada schema migration yang bermasalah — restore dari backup Turso:
   ```bash
   turso db shell smauiilab < backup.sql
   ```
