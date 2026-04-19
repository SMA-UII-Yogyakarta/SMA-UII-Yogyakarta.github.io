# Deployment Guide

## Arsitektur Saat Ini

App berjalan sebagai **Node.js SSR server** — bukan static site.
- Framework: Astro 6 dengan `output: 'server'` + Node adapter standalone
- Build output: `dist/server/entry.mjs`
- **Tidak kompatibel dengan GitHub Pages** (butuh server runtime)

---

## Deployment Targets

### A. Self-hosted (Deployment SMA UII saat ini)

Deploy via Docker + nginx sebagai reverse proxy.

```
Internet → reverse-proxy (SSL termination) → app-container:3000
```

Deploy dilakukan via **GitHub Actions manual trigger**:
```bash
# Via CLI
gh workflow run deploy.yml --ref main -f reason="Deskripsi deploy"

# Via GitHub UI
# Actions → Deploy → Run workflow
```

Semua nilai sensitif (host, SSH key, credentials) disimpan di **GitHub Secrets** — tidak pernah hardcode di kode.

### B. Cloudflare Pages (Rekomendasi untuk instansi lain)

Untuk sekolah atau instansi lain yang ingin menggunakan platform ini:
- Gratis untuk project kecil
- SSR via Cloudflare Workers
- Deploy otomatis dari GitHub
- Ganti adapter di `astro.config.mjs`:
  ```js
  import cloudflare from '@astrojs/cloudflare';
  adapter: cloudflare()
  ```
- Set env vars di Cloudflare Pages dashboard

### C. GitHub Pages (Masa depan — setelah migrasi JAMstack)

Saat arsitektur sudah bermigrasi ke JAMstack (Astro Static + smauii-dev-api di CF Workers),
frontend bisa di-host di GitHub Pages secara gratis. Lihat `docs/ROADMAP.md` untuk timeline.

---

## Environment: Development vs Production

| | Development | Production |
|--|-------------|------------|
| Database | `db-preview` (Turso) | `db-production` (Turso) |
| URL | `http://localhost:4321` | `https://your-domain.sch.id` |
| OAuth callback | `http://localhost:4321/api/auth/github/callback` | `https://your-domain.sch.id/api/auth/github/callback` |
| Cookie secure | `false` | `true` (HTTPS only) |

---

## Environment Variables Production

```bash
TURSO_URL=libsql://your-db.turso.io
TURSO_TOKEN=<production-token>
OAUTH_GITHUB_CLIENT_ID=<prod-client-id>
OAUTH_GITHUB_CLIENT_SECRET=<prod-client-secret>
PUBLIC_SITE_URL=https://your-domain.sch.id
PUBLIC_SITE_NAME=SMA UII Lab
```

**Jangan** pakai nilai dari `.env` (development) untuk production.

---

## Checklist Deploy Production

- [ ] CI pass di branch `main`
- [ ] Sudah diaudit di staging (`lab-dev.localhost`)
- [ ] `TURSO_URL` mengarah ke `db-production` (bukan `db-preview`)
- [ ] Schema database sudah di-migrate (`bun run db:push`)
- [ ] Build berhasil (`bun run build`)
- [ ] Type check bersih (`bun run check`)
