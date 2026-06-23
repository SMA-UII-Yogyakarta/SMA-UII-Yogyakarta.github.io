# Deployment Guide - Multi Platform

## ✅ Deployment Options

Aplikasi ini support **multi-mode deployment**:

### Mode 1: SSR (Server-Side Rendering)
**Platform yang didukung:**
- ✅ **Vercel** - Serverless Functions (recommended)
- ✅ **Railway** - Node.js hosting
- ✅ **Render** - Web services
- ✅ **Netlify** - SSR Functions
- ✅ **Cloudflare Pages** - Functions (hybrid mode)
- ✅ **Firebase Hosting + Cloud Functions**
- ✅ Heroku, Fly.io, DigitalOcean App Platform

**Build command:**
```bash
DEPLOY_MODE=ssr bun run build
```

**Output:** `dist/` dengan Node.js server (`entry.mjs`)

### Mode 2: SSG (Static Site Generation)
**Platform yang didukung:**
- ✅ **Cloudflare Pages** - Static hosting
- ✅ **GitHub Pages** - Static hosting
- ✅ **Netlify** - Static hosting
- ✅ **Vercel** - Static hosting
- ✅ **Firebase Hosting** - Static hosting

**Build command:**
```bash
DEPLOY_MODE=ssg bun run build
```

**Output:** `dist/` dengan file HTML statis

### Mode 3: Hybrid (Static + SSR)
**Platform yang didukung:**
- ✅ **Vercel** - Auto-detect per route
- ✅ **Cloudflare Pages** - Functions + static
- ✅ **Netlify** - Functions + static

**Build command:**
```bash
DEPLOY_MODE=hybrid bun run build
```

---

## 🚀 Quick Deploy

### Option A: Deploy ke Vercel (SSR - Recommended)

1. **Install Vercel CLI:**
```bash
bun install -g vercel
```

2. **Deploy:**
```bash
cd apps/web
vercel --prod
```

3. **Set Environment Variables di Vercel Dashboard:**
- `TURSO_URL`
- `TURSO_TOKEN`
- `JWT_SECRET`

Vercel auto-detect Astro dan setup serverless functions.

### Option B: Deploy ke Railway (SSR)

1. **Connect GitHub repo ke Railway**
2. **Set variables di Railway dashboard:**
   - `DEPLOY_MODE=ssr`
   - `TURSO_URL`
   - `TURSO_TOKEN`
   - `JWT_SECRET`
3. **Railway auto-deploy** dengan `Procfile` atau detect `bun start`

### Option C: Deploy ke Cloudflare Pages (SSG)

Sudah deployed:
- **Web**: https://b884dc45.smauii-dev-web.pages.dev (SSG mode)
- **API**: https://smauii-dev-api.konxcid.workers.dev (Workers)

### Option D: Deploy ke Netlify (SSR)

1. **Install Netlify CLI:**
```bash
bun install -g netlify-cli
```

2. **Deploy:**
```bash
cd apps/web
netlify deploy --prod
```

3. **Set environment variables** di Netlify dashboard

---

## 📊 Platform Comparison

| Platform | SSR Support | Free Tier | Ease | Best For |
|----------|-------------|-----------|------|----------|
| **Vercel** | ✅ Auto | ✅ Generous | ⭐⭐⭐⭐⭐ | Production SSR |
| **Railway** | ✅ Node.js | ✅ $5 credit | ⭐⭐⭐⭐⭐ | Full-stack apps |
| **Cloudflare Pages** | ✅ Functions | ✅ Generous | ⭐⭐⭐⭐ | Static + edge |
| **Netlify** | ✅ Functions | ✅ Generous | ⭐⭐⭐⭐ | JAMstack |
| **Render** | ✅ Node.js | ✅ Limited | ⭐⭐⭐⭐ | Simple hosting |
| **Firebase** | ✅ Cloud Functions | ✅ Limited | ⭐⭐⭐ | GCP ecosystem |

---

## 🔧 Environment Variables

### Required untuk SSR Mode:
```bash
DEPLOY_MODE=ssr
TURSO_URL=<your_turso_url>
TURSO_TOKEN=<your_turso_token>
JWT_SECRET=<your_secret>
```

### Optional:
```bash
PUBLIC_API_URL=https://smauii-dev-api.konxcid.workers.dev
SLIMS_API_URL=<slims_api>
SLIMS_API_KEY=<slims_key>
```

---

## 📝 Current Deployment Status

### API - Cloudflare Workers ✅
- **URL**: https://smauii-dev-api.konxcid.workers.dev
- **Mode**: Serverless
- **Status**: Live

### Web - Cloudflare Pages (SSG) ✅
- **URL**: https://b884dc45.smauii-dev-web.pages.dev
- **Mode**: Static (SSG)
- **Status**: Live

### Next: Deploy SSR Version
- **Target**: Vercel atau Railway
- **Benefit**: Full SSR dengan auth session, no client-side fetch
- **Status**: ⏳ Ready to deploy
