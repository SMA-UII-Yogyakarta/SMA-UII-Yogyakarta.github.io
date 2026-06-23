# Deploy ke Vercel - Quick Guide

## Cara 1: Via GitHub Integration (Recommended)

### Step 1: Push ke GitHub
```bash
git add .
git commit -m "feat: ready for SSR deployment"
git push origin main
```

### Step 2: Connect di Vercel Dashboard
1. Buka https://vercel.com/new
2. Click **"Import Git Repository"**
3. Pilih repo: `smauii-dev-foundation`
4. **Configure Project**:
   - **Framework Preset**: Astro
   - **Root Directory**: `apps/web`
   - **Build Command**: `DEPLOY_MODE=ssr bun run build`
   - **Output Directory**: `dist`
   - **Install Command**: `bun install`

### Step 3: Set Environment Variables
Di Vercel Dashboard → Project Settings → Environment Variables:
```
DEPLOY_MODE=ssr
TURSO_URL=<your_turso_url>
TURSO_TOKEN=<your_turso_token>
JWT_SECRET=<your_jwt_secret>
```

### Step 4: Deploy
Click **"Deploy"** - Vercel akan auto-build dan deploy!

### Step 5: Custom Domain (Optional)
Settings → Domains → Add domain: `lab.smauiiyk.sch.id`

---

## Cara 2: Via Vercel CLI

### Step 1: Login
```bash
vercel login
```

### Step 2: Deploy
```bash
cd apps/web
vercel --prod
```

### Step 3: Set Environment Variables
```bash
vercel env add TURSO_URL production
vercel env add TURSO_TOKEN production
vercel env add JWT_SECRET production
```

### Step 4: Re-deploy
```bash
vercel --prod
```

---

## Auto-Deploy dengan GitHub Actions

Vercel sudah auto-deploy setiap push ke `main` branch setelah connected via GitHub integration.

Untuk manual trigger:
```bash
vercel --prod
```

---

## Monitoring

- **Dashboard**: https://vercel.com/dashboard
- **Logs**: Project → Deployments → Click deployment → View Logs
- **Analytics**: Project → Analytics

---

## Troubleshooting

### Build fails dengan "Module not found"
```bash
# Pastikan semua dependencies terinstall
bun install
```

### SSR pages tidak berfungsi
Check di Vercel Dashboard → Functions → Pastikan functions deployed

### API calls fail
Set `PUBLIC_API_URL` di Environment Variables:
```
PUBLIC_API_URL=https://smauii-dev-api.konxcid.workers.dev
```

---

## URLs

- **Development**: `https://<project-name>.vercel.app`
- **Production**: `https://lab.smauiiyk.sch.id` (setelah custom domain)