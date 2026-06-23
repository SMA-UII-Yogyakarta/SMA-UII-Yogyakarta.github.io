# 🔐 Environment Variables Guide

## 📋 Overview

Aplikasi ini menggunakan **environment variables** untuk konfigurasi yang aman dan flexible. Variables dipisahkan menjadi 2 kategori:

### 1. **PUBLIC Variables** (Client-side)
- Prefix: `PUBLIC_`
- Aman untuk di-expose di browser
- Diakses via: `import.meta.env.PUBLIC_*`
- Contoh: `PUBLIC_API_URL`, `PUBLIC_SITE_URL`

### 2. **SECRET Variables** (Server-side ONLY)
- **TIDAK** ada prefix khusus
- **JANGAN** expose ke client
- Hanya tersedia di server-side code
- Diakses via: `import.meta.env.VAR_NAME` atau `process.env.VAR_NAME`
- Contoh: `TURSO_URL`, `JWT_SECRET`, `OAUTH_GITHUB_CLIENT_SECRET`

---

## 🎯 Environment Variables List

### Required Variables

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `PUBLIC_SITE_URL` | PUBLIC | Domain produksi untuk SEO, sitemap, canonical URLs | `https://lab.smauiiyk.sch.id` |
| `PUBLIC_API_URL` | PUBLIC | Backend API endpoint | `https://smauii-dev-api.konxcid.workers.dev` |
| `TURSO_URL` | SECRET | Turso database connection URL | `libsql://db.turso.io` |
| `TURSO_TOKEN` | SECRET | Turso authentication token | `eyJhbGci...` |
| `JWT_SECRET` | SECRET | JWT token signing key (min 32 chars) | `super_secret_key_min_32_chars` |
| `OAUTH_GITHUB_CLIENT_ID` | SECRET | GitHub OAuth Client ID | `Ov23...` |
| `OAUTH_GITHUB_CLIENT_SECRET` | SECRET | GitHub OAuth Client Secret | `your_secret` |

### Optional Variables

| Variable | Type | Description | Default |
|----------|------|-------------|---------|
| `SLIMS_API_URL` | SECRET | SLiMS library system API URL | (mock data) |
| `SLIMS_API_KEY` | SECRET | SLiMS API authentication key | (none) |
| `GITHUB_PAT` | SECRET | GitHub Personal Access Token | (none) |
| `DEPLOY_MODE` | PUBLIC | Build mode: `ssr`, `ssg`, `hybrid` | `ssr` |
| `NODE_ENV` | PUBLIC | Environment: `development`, `production` | `development` |

---

## 📁 File Structure

```
apps/web/
├── .env.example          # Template (commit ke git)
├── .env.local            # Local development (JANGAN commit)
└── .gitignore            # Ignore .env.local

apps/api/
├── .env.example          # Template (commit ke git)
├── .env.local            # Local development (JANGAN commit)
└── wrangler.jsonc        # Cloudflare Workers config
```

---

## 🚀 Setup Guide

### 1. Copy Template

```bash
# Web app
cd apps/web
cp .env.example .env.local

# API
cd apps/api
cp .env.example .env.local
```

### 2. Fill in Values

Edit `.env.local` dan isi dengan nilai yang sesuai:

```bash
# apps/web/.env.local
PUBLIC_SITE_URL=https://lab.smauiiyk.sch.id
PUBLIC_API_URL=https://smauii-dev-api.konxcid.workers.dev
TURSO_URL=libsql://your-db.turso.io
TURSO_TOKEN=your_token
JWT_SECRET=your_secret_min_32_chars
OAUTH_GITHUB_CLIENT_ID=your_client_id
OAUTH_GITHUB_CLIENT_SECRET=your_client_secret
```

### 3. Set Secrets di Platform Deployment

#### Cloudflare Workers (API)
```bash
wrangler secret put TURSO_URL
wrangler secret put TURSO_TOKEN
wrangler secret put JWT_SECRET
wrangler secret put SLIMS_API_URL   # optional
wrangler secret put SLIMS_API_KEY   # optional
```

#### Vercel (Web SSR)
Dashboard → Project Settings → Environment Variables:
- Add semua required variables
- Mark sebagai "Production", "Preview", "Development"

#### Cloudflare Pages (Web SSG)
Dashboard → Pages Project → Settings → Environment Variables:
- Add: `PUBLIC_API_URL`, `PUBLIC_SITE_URL`
- Secret variables tidak diperlukan untuk SSG mode

---

## 🔒 Security Best Practices

### ✅ DO:
- Use `.env.example` sebagai template
- Set secrets via platform dashboard atau CLI
- Use different secrets untuk dev/staging/production
- Rotate secrets secara berkala
- Use strong random values untuk JWT_SECRET
- Enable 2FA untuk akun yang linked ke OAuth apps

### ❌ DON'T:
- **JANGAN** commit `.env.local` ke git
- **JANGAN** log atau print secret values
- **JANGAN** hardcode secrets di source code
- **JANGAN** share secrets via chat/email
- **JANGAN** use production secrets di development

---

## 🛠️ Validation

### Build-time Validation

File `src/env.ts` validates required variables at build time:

```typescript
import { validateEnv } from '@lib/env';

// In astro.config.mjs or vite config
validateEnv(process.env, 'production');
```

### Runtime Checks

Code menggunakan fallback values untuk development:

```typescript
const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:4321';
const deployMode = import.meta.env.DEPLOY_MODE || 'ssr';
```

---

## 📖 Usage in Code

### Client-side (PUBLIC variables only)

```typescript
// ✅ OK - PUBLIC variable accessible in browser
const apiUrl = import.meta.env.PUBLIC_API_URL;

// ❌ ERROR - SECRET variables not available in client code
const dbUrl = import.meta.env.TURSO_URL; // Will be undefined
```

### Server-side (All variables)

```typescript
// ✅ OK - All variables accessible in server code
const dbUrl = import.meta.env.TURSO_URL;
const jwtSecret = import.meta.env.JWT_SECRET;
const apiUrl = import.meta.env.PUBLIC_API_URL;
```

### Astro Pages

```astro
---
// Server-side code in frontmatter
const apiUrl = import.meta.env.PUBLIC_API_URL;
const deployMode = import.meta.env.DEPLOY_MODE;
---

<script>
  // Client-side script
  const publicUrl = import.meta.env.PUBLIC_SITE_URL;
  // TURSO_URL tidak tersedia di sini
</script>
```

---

## 🔄 Deployment Checklist

### Pre-deployment

- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in all required variables
- [ ] Validate URLs are correct format
- [ ] JWT_SECRET min 32 characters
- [ ] Test locally: `bun run dev`

### Cloudflare Workers

- [ ] Set all secrets via `wrangler secret put`
- [ ] Update `wrangler.jsonc` ALLOWED_ORIGINS
- [ ] Deploy: `wrangler deploy`
- [ ] Verify in dashboard

### Vercel/Railway/Netlify

- [ ] Set environment variables di dashboard
- [ ] Mark production/preview/development
- [ ] Trigger deployment
- [ ] Verify build logs

### Cloudflare Pages

- [ ] Set PUBLIC variables di dashboard
- [ ] SECRET variables tidak diperlukan (SSG mode)
- [ ] Deploy: `wrangler pages deploy`
- [ ] Verify deployment

---

## 🐛 Troubleshooting

### "Missing required environment variables"

**Solution**: Copy `.env.example` to `.env.local` dan isi semua required variables.

### "JWT_SECRET must be at least 32 characters"

**Solution**: Generate strong secret:
```bash
openssl rand -hex 32
```

### "PUBLIC_API_URL is not defined"

**Solution**: Pastikan variable di-set dengan prefix `PUBLIC_`:
```bash
PUBLIC_API_URL=https://your-api.com
```

### Variables work in dev but not production

**Solution**: Set variables di platform deployment dashboard, bukan hanya di `.env.local`.

### TypeScript errors for `import.meta.env`

**Solution**: Add type definitions in `src/env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL: string
  readonly PUBLIC_API_URL: string
  readonly TURSO_URL: string
  readonly TURSO_TOKEN: string
  readonly JWT_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

## 📚 References

- [Astro Environment Variables](https://docs.astro.build/en/guides/environment-variables/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/wrangler/commands/#secret)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [12-Factor App Config](https://12factor.net/config)

---

**Last Updated**: June 2026  
**Version**: 1.0.0