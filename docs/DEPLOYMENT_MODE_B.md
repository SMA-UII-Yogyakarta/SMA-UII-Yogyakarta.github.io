# Mode B: JAMSTACK Cloudflare Deployment Guide

> **Status**: ✅ **Production Ready** (June 2026)  
> **API**: https://smauii-dev-api.konxcid.workers.dev  
> **Frontend**: Deploy ke Cloudflare Pages (manual setup required)

---

## 📋 Prerequisites

- ✅ Cloudflare account (free tier cukup)
- ✅ Turso account (free 9GB)
- ✅ Node.js >= 22.12.0 atau Bun >= 1.1.0
- ✅ Wrangler CLI (`bun install -g wrangler`)

---

## 🚀 Step-by-Step Deployment

### Step 1: Deploy API ke Cloudflare Workers

```bash
# Navigate ke API directory
cd apps/api

# Login ke Cloudflare (jika belum)
bunx wrangler login

# Deploy API
bun run deploy
# atau
bunx wrangler deploy
```

**Expected Output:**
```
Uploaded smauii-dev-api (9.64 sec)
Deployed smauii-dev-api triggers (7.17 sec)
  https://smauii-dev-api.<your-account>.workers.dev
```

**Catat URL API** untuk langkah selanjutnya!

---

### Step 2: Set Secrets untuk API

```bash
cd apps/api

# JWT Secret (untuk authentication)
bunx wrangler secret put JWT_SECRET
# Input: random string minimal 32 karakter
# Contoh: openssl rand -hex 32

# Turso Database URL
bunx wrangler secret put TURSO_URL
# Input: libsql://your-db.turso.io

# Turso Auth Token
bunx wrangler secret put TURSO_TOKEN
# Input: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

**Verify Secrets:**
```bash
bunx wrangler secret list
```

---

### Step 3: Create Cloudflare Pages Project

**Via Cloudflare Dashboard:**

1. Buka https://dash.cloudflare.com/?to=/:account/pages
2. Klik **"Create a project"**
3. Pilih **"Direct Upload"** (bukan GitHub)
4. Project name: `smauii-lab`
5. Production branch: `main`
6. Klik **"Create project"**

**Via CLI (Alternative):**
```bash
# Project akan auto-created saat deploy pertama kali
cd apps/web
bunx wrangler pages deploy dist/ --project-name=smauii-lab
```

---

### Step 4: Build Frontend dengan PUBLIC_API_URL

```bash
cd apps/web

# Build dengan API URL dari Step 1
PUBLIC_API_URL=https://smauii-dev-api.<your-account>.workers.dev \
DEPLOY_MODE=ssg \
bun run build
```

**Expected Output:**
```
166 page(s) built in 5.84s
Build Complete!
```

---

### Step 5: Deploy Frontend ke Cloudflare Pages

**Via Cloudflare Dashboard:**

1. Di Pages project yang dibuat di Step 3
2. Klik **"Upload assets"**
3. Upload isi folder `apps/web/dist/`
4. Klik **"Deploy"**

**Via CLI:**
```bash
cd apps/web
bunx wrangler pages deploy dist/ --project-name=smauii-lab --commit-dirty=true
```

---

### Step 6: Set Environment Variables di Pages

**Via Cloudflare Dashboard:**

1. Di Pages project → **"Settings"** → **"Environment variables"**
2. Tambah variable:
   - `PUBLIC_API_URL`: `https://smauii-dev-api.<your-account>.workers.dev`
   - `DEPLOY_MODE`: `ssg`
3. Klik **"Save"**

---

### Step 7: Setup Custom Domain (Optional)

**Via Cloudflare Dashboard:**

1. Di Pages project → **"Custom domains"**
2. Klik **"Add custom domain"**
3. Input domain: `lab.smauiiyk.sch.id`
4. Klik **"Add domain"**
5. Setup DNS records sesuai instruksi Cloudflare

---

## 🧪 Testing Deployment

### Test 1: API Health Check

```bash
curl https://smauii-dev-api.<your-account>.workers.dev/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-06-22T..."
}
```

---

### Test 2: Login Flow

1. Buka `https://<your-pages-domain>`
2. Navigate ke `/login`
3. Login dengan credentials test
4. **Verify:**
   - Redirect ke `/app/overview`
   - Token tersimpan di localStorage (DevTools → Application → Local Storage)
   - API calls include `Authorization: Bearer <token>` header

---

### Test 3: Dashboard Access

1. Setelah login, verify dashboard loaded
2. Check Network tab untuk API calls
3. **Verify:**
   - All API calls ke `https://smauii-dev-api.<your-account>.workers.dev`
   - JWT token included di headers
   - Data loaded successfully

---

### Test 4: Logout Flow

1. Klik logout
2. **Verify:**
   - Token cleared dari localStorage
   - Redirect ke `/login`
   - Tidak bisa access `/app/overview` (redirect ke login)

---

## 🔧 Troubleshooting

### Issue: CORS Errors

**Symptom:**
```
Access to fetch at 'https://smauii-dev-api...' from origin 'https://your-pages.dev' has been blocked by CORS policy
```

**Fix:**
1. Update `ALLOWED_ORIGINS` di `apps/api/wrangler.jsonc`:
```json
"ALLOWED_ORIGINS": "https://lab.smauiiyk.sch.id,https://your-pages.pages.dev"
```
2. Redeploy API:
```bash
cd apps/api && bunx wrangler deploy
```

---

### Issue: 401 Unauthorized

**Symptom:**
- Login berhasil tapi dashboard 401
- Token tidak tersimpan

**Check:**
1. Verify `JWT_SECRET` set di API:
```bash
bunx wrangler secret list
```
2. Verify frontend pakai `apiFetch` (bukan raw `fetch`)
3. Check localStorage ada token

---

### Issue: API 404 di Frontend

**Symptom:**
- Network error ke `/api/...`
- Frontend mencoba fetch ke relative path

**Fix:**
1. Verify `PUBLIC_API_URL` set correctly
2. Rebuild frontend:
```bash
PUBLIC_API_URL=https://your-api.workers.dev bun run build
```
3. Redeploy ke Pages

---

### Issue: GitHub OAuth Tidak Berfungsi

**Expected Behavior:**
- GitHub OAuth button hidden di Mode B
- Hanya username/password login yang tersedia

**Reason:**
- GitHub OAuth butuh server-side callback
- Static Pages tidak support server runtime

**Workaround:**
- Gunakan username/password login (fully functional)
- Atau migrate ke Auth0/Clerk untuk OAuth

---

## 📊 Performance Benchmarks

| Metric | Value | Target |
|--------|-------|--------|
| **Build Time** | ~6s | <10s ✅ |
| **Bundle Size** | ~1.8MB | <2MB ✅ |
| **First Load (CDN)** | ~50ms | <100ms ✅ |
| **API Latency** | ~20ms | <50ms ✅ |
| **LCP** | TBD | <2.5s |
| **INP** | TBD | <200ms |
| **CLS** | TBD | <0.1 |

---

## 💰 Cost Estimation

### Free Tier Limits:

| Resource | Limit | Usage |
|----------|-------|-------|
| **Workers Requests** | 100k/day | ~3M/month |
| **Pages Builds** | 500/month | ~10-20 |
| **Pages Requests** | Unlimited | - |
| **Turso Storage** | 9GB | ~100MB |
| **Turso Requests** | 1B/month | ~10M |

**Estimated Cost**: **$0/month** (free tier cukup untuk mulai)

---

## 🎯 Next Steps

### Optimization:
- [ ] Enable Workers caching untuk reduce DB calls
- [ ] Setup R2 untuk file uploads
- [ ] Configure D1 untuk analytics (optional)

### Features:
- [ ] Email notifications (Cloudflare Email Sending)
- [ ] Real-time updates (Workers + Durable Objects)
- [ ] Image optimization (Cloudflare Images)

### Monitoring:
- [ ] Setup Cloudflare Analytics
- [ ] Configure error tracking
- [ ] Setup alerts for API errors

---

## 📚 Related Documentation

- [DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md) — 3 deployment modes overview
- [DEPLOYMENT_MODE_A.md](./DEPLOYMENT_MODE_A.md) — Fullstack selfhosted guide
- [DEPLOYMENT_MODE_C.md](./DEPLOYMENT_MODE_C.md) — GitHub Pages guide (coming soon)

---

**Last Updated**: June 22, 2026  
**Verified By**: Sisyphus  
**Status**: ✅ Production Ready