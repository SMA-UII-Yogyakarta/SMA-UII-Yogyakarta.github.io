# Lab Digital — Panduan Deployment untuk Institusi

> Platform Lab Digital dapat di-deploy dengan berbagai strategi sesuai infrastruktur dan kebutuhan institusi Anda.

---

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Opsi Deployment](#2-opsi-deployment)
3. [Perbandingan Opsi](#3-perbandingan-opsi)
4. [Panduan Per-Opsi](#4-panduan-per-opsi)
5. [Checklist Pemilihan](#5-checklist-pemilihan)
6. [FAQ](#6-faq)

---

## 1. Gambaran Umum

### Arsitektur Platform

```
┌─────────────────────────────────────────────────────────────────┐
│                    Lab Digital Platform                          │
│                                                                  │
│  ┌──────────────────┐     ┌──────────────────┐                  │
│  │   Frontend       │     │   Backend API    │                  │
│  │   (Astro)        │────▶│   (Hono/Bun)     │                  │
│  │                  │     │                  │                  │
│  │  - Public pages  │     │  - Auth          │                  │
│  │  - Dashboard     │     │  - CRUD          │                  │
│  │  - Admin panel   │     │  - Integrations   │                  │
│  └──────────────────┘     └──────────────────┘                  │
│           │                        │                            │
│           └────────────────────────┘                            │
│                        │                                         │
│              ┌─────────▼─────────┐                               │
│              │   Database        │                               │
│              │   (Turso/SQLite)  │                               │
│              └───────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### Komponen yang Dapat Dipisah atau Digabung

| Komponen | Bisa Terpisah | Bisa Gabung | Keterangan |
|----------|---------------|-------------|------------|
| Frontend | ✅ Static hosting | ✅ SSR dalam satu container | Fleksibel |
| Backend API | ✅ CF Workers/Vercel | ✅ Astro API routes | Fleksibel |
| Database | ✅ Turso cloud | ✅ SQLite local | Pilih salah satu |
| Auth | ✅ JWT (stateless) | ✅ Session (cookies) | Tergantung arsitektur |

---

## 2. Opsi Deployment

### Opsi A: Self-Hosted Docker (All-in-One)

**Cocok untuk:** Institusi dengan server sendiri (VPS, on-premise)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Docker Container                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Astro SSR (output: 'server')                            │   │
│  │                                                          │   │
│  │  - Frontend pages (SSR)                                  │   │
│  │  - API routes (/api/*)                                   │   │
│  │  - Middleware (auth, rate limit, CSP)                    │   │
│  │  - Session-based auth (Lucia)                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Database: Turso (cloud) atau SQLite (local file)               │
└─────────────────────────────────────────────────────────────────┘
```

**Kelebihan:**
- ✅ Setup paling simpel — satu container
- ✅ Full control atas server
- ✅ Tidak tergantung cloud provider
- ✅ Cocok untuk data sensitif (on-premise)
- ✅ Biaya fixed (VPS bulanan)

**Kekurangan:**
- ❌ Perlu maintenance server
- ❌ Scaling manual
- ❌ Latency tergantung lokasi server
- ❌ Perlu setup SSL/reverse proxy sendiri

**Deployment:**
```bash
# 1. Clone repo
git clone https://github.com/your-org/lab-digital.git
cd lab-digital

# 2. Setup environment
cp deploy/env/.env.production.example .env
nano .env  # isi konfigurasi

# 3. Deploy
docker compose -f deploy/docker/docker-compose.yml up -d
```

**Yang cocok memilih ini:**
- Sekolah dengan VPS sendiri
- Kampus dengan data center on-premise
- Institusi dengan kebijakan data lokal
- Budget terbatas, ingin biaya fixed

---

### Opsi B: Cloudflare Pages + Workers

**Cocok untuk:** Institusi yang ingin global reach dengan biaya minimal

```
┌─────────────────────────────────────────────────────────────────┐
│                     Cloudflare Network                           │
│                                                                  │
│  ┌─────────────────────┐     ┌─────────────────────┐            │
│  │  CF Pages (SSG)     │     │  CF Workers (API)   │            │
│  │                     │     │                     │            │
│  │  - Static HTML      │────▶│  - Hono backend     │            │
│  │  - Client-side JS   │     │  - JWT auth         │            │
│  │  - Global CDN       │     │  - Edge runtime     │            │
│  │                     │     │                     │            │
│  │  lab.sekolah.sch.id │     │  api.lab.sekolah.id │            │
│  └─────────────────────┘     └─────────────────────┘            │
│              │                        │                          │
│              └────────────────────────┘                          │
│                         │                                        │
│              ┌──────────▼──────────┐                             │
│              │  Turso (Edge DB)    │                             │
│              │  - Global replicas  │                             │
│              │  - Auto-scaling     │                             │
│              └─────────────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

**Kelebihan:**
- ✅ Global CDN — latency rendah di mana saja
- ✅ Auto-scaling — tidak perlu worry tentang traffic spike
- ✅ Free tier generous — cocok untuk sekolah kecil
- ✅ DDoS protection built-in
- ✅ SSL otomatis

**Kekurangan:**
- ❌ Perlu migrasi auth ke JWT
- ❌ API terpisah = CORS configuration
- ❌ Terikat ekosistem Cloudflare
- ❌ Cold start untuk Workers (minimal)

**Deployment:**
```bash
# Frontend (CF Pages)
cd apps/web
bun run build  # output: 'static'
# Connect GitHub repo ke CF Pages dashboard

# Backend (CF Workers)
cd apps/api
bun run deploy  # wrangler deploy
```

**Yang cocok memilih ini:**
- Sekolah dengan siswa tersebar (boarding school, online learning)
- Platform yang butuh global reach
- Institusi dengan IT team minimal
- Ingin free tier / biaya rendah

---

### Opsi C: Vercel (Full Stack)

**Cocok untuk:** Institusi yang ingin developer experience terbaik

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel Platform                           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Astro SSR/SSG (output: 'server' atau 'static')         │   │
│  │                                                          │   │
│  │  - Frontend pages                                        │   │
│  │  - API routes (/api/*) → Edge Functions                 │   │
│  │  - Middleware → Edge Middleware                          │   │
│  │  - Session atau JWT (pilih)                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Database: Turso, Vercel Postgres, atau PlanetScale             │
└─────────────────────────────────────────────────────────────────┘
```

**Kelebihan:**
- ✅ Developer experience terbaik
- ✅ Preview deployment untuk setiap PR
- ✅ Analytics dan logging built-in
- ✅ Edge functions untuk API
- ✅ Auto-deploy dari GitHub

**Kekurangan:**
- ❌ Free tier terbatas untuk commercial use
- ❌ Vendor lock-in lebih tinggi
- ❌ Region terbatas dibanding CF

**Deployment:**
```bash
# Connect GitHub repo ke Vercel dashboard
# Vercel auto-detect Astro dan deploy
```

**Yang cocok memilih ini:**
- Tim development yang familiar dengan Vercel
- Butuh preview deployment untuk review
- Ingin analytics dan monitoring built-in

---

### Opsi D: GitHub Pages (SSG Only) + CF Workers (API)

**Cocok untuk:** Institusi dengan budget minimal, frontend statis

```
┌─────────────────────────────────────────────────────────────────┐
│                      Hybrid Deployment                           │
│                                                                  │
│  ┌─────────────────────┐     ┌─────────────────────┐            │
│  │  GitHub Pages (SSG) │     │  CF Workers (API)   │            │
│  │                     │     │                     │            │
│  │  - Static HTML      │────▶│  - Hono backend     │            │
│  │  - Free hosting     │     │  - JWT auth         │            │
│  │  - Custom domain    │     │  - Free tier        │            │
│  │                     │     │                     │            │
│  │  lab.sekolah.sch.id │     │  api.lab.sekolah.id │            │
│  └─────────────────────┘     └─────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

**Kelebihan:**
- ✅ Biaya $0 untuk hosting
- ✅ GitHub Pages free untuk public repo
- ✅ CF Workers free tier
- ✅ Cocok untuk sekolah kecil

**Kekurangan:**
- ❌ Hanya SSG — tidak ada SSR
- ❌ Perlu JWT auth
- ❌ CORS configuration
- ❌ GitHub Pages tidak support server-side

**Deployment:**
```bash
# Frontend (GitHub Pages)
cd apps/web
# Set output: 'static' di astro.config.mjs
bun run build
# Push ke branch gh-pages atau setup GitHub Actions

# Backend (CF Workers)
cd apps/api
bun run deploy
```

**Yang cocok memilih ini:**
- Sekolah dengan budget $0
- Repo public (open source)
- Tidak butuh SSR
- Traffic rendah

---

### Opsi E: Hybrid — Docker + Cloudflare Tunnel

**Cocok untuk:** Institusi dengan server on-premise tapi ingin expose ke internet

```
┌─────────────────────────────────────────────────────────────────┐
│                    On-Premise Server                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Docker Container (Astro SSR)                           │   │
│  │  - Frontend + API dalam satu container                   │   │
│  │  - Session-based auth                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         │                                       │
│              ┌──────────▼──────────┐                             │
│              │  cloudflared tunnel │                             │
│              │  (no public port)   │                             │
│              └──────────┬──────────┘                             │
└─────────────────────────┼───────────────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │  Cloudflare Network   │
              │  - SSL otomatis       │
              │  - DDoS protection    │
              │  - lab.sekolah.sch.id │
              └───────────────────────┘
```

**Kelebihan:**
- ✅ Server tidak perlu public IP
- ✅ Data tetap on-premise
- ✅ SSL dan DDoS protection dari CF
- ✅ Tidak perlu buka port di firewall
- ✅ Bisa akses dari mana saja

**Kekurangan:**
- ❌ Perlu install cloudflared di server
- ❌ Tergantung koneksi internet
- ❌ CF Tunnel ada batas bandwidth free tier

**Deployment:**
```bash
# 1. Setup Docker seperti Opsi A
docker compose -f deploy/docker/docker-compose.yml up -d

# 2. Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared

# 3. Buat tunnel
./cloudflared tunnel create lab-digital
./cloudflared tunnel route dns lab-digital lab.sekolah.sch.id

# 4. Jalankan tunnel
./cloudflared tunnel run --url http://localhost:3000 lab-digital
```

**Yang cocok memilih ini:**
- Sekolah dengan server lokal tapi ingin akses dari internet
- Kebijakan data harus di server sendiri
- Tidak punya public IP atau tidak bisa buka port
- Ingin security layer dari Cloudflare

---

## 3. Perbandingan Opsi

### Matrix Perbandingan

| Kriteria | A: Docker | B: CF Pages+Workers | C: Vercel | D: GH Pages+CF | E: Docker+Tunnel |
|----------|-----------|---------------------|-----------|----------------|------------------|
| **Setup Complexity** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Cost** | $5-20/bulan | $0-5/bulan | $0-20/bulan | $0 | $0-5/bulan |
| **Global Latency** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **Data Control** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Scaling** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **Maintenance** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Auth Options** | Session/JWT | JWT only | Session/JWT | JWT only | Session/JWT |
| **SSR Support** | ✅ | ❌ (SSG only) | ✅ | ❌ | ✅ |

### Keputusan Berdasarkan Profil Institusi

| Profil Institusi | Rekomendasi | Alasan |
|------------------|-------------|--------|
| **Sekolah Kecil** (< 500 siswa) | D: GH Pages + CF | Biaya $0, simpel |
| **Sekolah Menengah** (500-2000 siswa) | B: CF Pages + Workers | Free tier cukup, global |
| **Sekolah Besar/Kampus** (> 2000 siswa) | A: Docker atau C: Vercel | Control dan scaling |
| **Boarding School** (siswa tersebar) | B: CF Pages + Workers | Global latency penting |
| **Sekolah dengan Data Center** | A: Docker atau E: Tunnel | Data on-premise |
| **Kebijakan Data Lokal** | A: Docker atau E: Tunnel | Full control |
| **IT Team Minimal** | B: CF atau C: Vercel | Managed service |
| **Budget Terbatas** | D: GH Pages + CF | $0 total |

---

## 4. Panduan Per-Opsi

### Opsi A: Self-Hosted Docker

**Prasyarat:**
- VPS atau server dengan Docker installed
- Domain (opsional)
- SSL certificate (Let's Encrypt gratis)

**Langkah-langkah:**

```bash
# 1. Setup server (Ubuntu/Debian)
bash deploy/scripts/setup-server.sh

# 2. Clone dan konfigurasi
git clone https://github.com/your-org/lab-digital.git
cd lab-digital
cp deploy/env/.env.production.example .env

# 3. Edit konfigurasi
nano .env
# Isi:
# - TURSO_URL dan TURSO_TOKEN (dari turso.tech)
# - OAUTH_GITHUB_CLIENT_ID dan SECRET (dari GitHub OAuth App)
# - PUBLIC_SITE_URL=https://lab.sekolah.sch.id
# - SLIMS_API_URL dan SLIMS_API_KEY (jika integrasi SLiMS)

# 4. Deploy
bash deploy/scripts/deploy.sh

# 5. Setup reverse proxy (nginx)
sudo cp deploy/nginx/lab.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/lab.conf /etc/nginx/sites-enabled/
sudo certbot --nginx -d lab.sekolah.sch.id
```

**Konfigurasi Astro:**
```javascript
// apps/web/astro.config.mjs
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  })
});
```

---

### Opsi B: Cloudflare Pages + Workers

**Prasyarat:**
- Akun Cloudflare
- Domain di Cloudflare DNS
- Akun Turso

**Langkah-langkah:**

```bash
# 1. Fork repo ke GitHub Anda

# 2. Setup Turso database
turso db create lab-digital
turso db show lab-digital  # dapatkan URL dan token

# 3. Setup GitHub OAuth App
# Buka github.com/settings/developers
# Buat OAuth App dengan callback: https://lab.sekolah.sch.id/api/auth/github/callback

# 4. Deploy Frontend ke CF Pages
# Buka dash.cloudflare.com → Pages → Create project
# Connect GitHub repo
# Build settings:
#   - Build command: bun run build
#   - Build output: apps/web/dist
#   - Root directory: apps/web

# 5. Set environment variables di CF Pages dashboard:
#   - TURSO_URL
#   - TURSO_TOKEN
#   - OAUTH_GITHUB_CLIENT_ID
#   - OAUTH_GITHUB_CLIENT_SECRET
#   - PUBLIC_SITE_URL

# 6. Deploy Backend ke CF Workers
cd apps/api
cp wrangler.jsonc.example wrangler.jsonc
# Edit wrangler.jsonc dengan nama dan bindings

# Set secrets
wrangler secret put TURSO_URL
wrangler secret put TURSO_TOKEN
wrangler secret put JWT_SECRET

# Deploy
bun run deploy
```

**Konfigurasi Astro (SSG):**
```javascript
// apps/web/astro.config.mjs
export default defineConfig({
  output: 'static',
  // Hapus adapter
});
```

**Konfigurasi API Client:**
```typescript
// apps/web/src/lib/api-client.ts
const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://api.lab.sekolah.sch.id';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });
}
```

---

### Opsi C: Vercel

**Langkah-langkah:**

```bash
# 1. Fork repo ke GitHub

# 2. Connect ke Vercel
# Buka vercel.com → Import Project
# Pilih repo

# 3. Vercel auto-detect Astro
# Build settings:
#   - Framework: Astro
#   - Build command: bun run build
#   - Output: apps/web/dist

# 4. Set environment variables di Vercel dashboard

# 5. Deploy otomatis setiap push ke main
```

---

### Opsi D: GitHub Pages + CF Workers

**Langkah-langkah:**

```bash
# 1. Setup GitHub Pages
# Repo Settings → Pages → Source: GitHub Actions

# 2. Buat workflow .github/workflows/deploy-pages.yml
name: Deploy to Pages
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun --cwd apps/web run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: apps/web/dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/deploy-pages@v4

# 3. Setup CF Workers seperti Opsi B
```

---

### Opsi E: Docker + Cloudflare Tunnel

**Langkah-langkah:**

```bash
# 1. Setup Docker seperti Opsi A

# 2. Login ke Cloudflare
cloudflared tunnel login

# 3. Buat tunnel
cloudflared tunnel create lab-digital

# 4. Route DNS
cloudflared tunnel route dns lab-digital lab.sekolah.sch.id

# 5. Jalankan tunnel
cloudflared tunnel run --url http://localhost:3000 lab-digital

# 6. Setup sebagai systemd service (auto-start)
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

## 5. Checklist Pemilihan

### Sebelum Memilih, Jawab Pertanyaan Ini:

- [ ] Berapa jumlah pengguna aktif yang diharapkan?
- [ ] Apakah pengguna tersebar di berbagai lokasi?
- [ ] Apakah ada kebijakan data harus lokal?
- [ ] Apakah ada tim IT untuk maintenance?
- [ ] Berapa budget untuk hosting?
- [ ] Apakah butuh integrasi dengan sistem existing (SLiMS, dll)?
- [ ] Apakah butuh akses dari internet?

### Decision Tree

```
                    ┌─────────────────────────┐
                    │  Apakah data harus      │
                    │  lokal/on-premise?      │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │ YA                                │ NEIN
              ▼                                   ▼
    ┌─────────────────────┐           ┌─────────────────────┐
    │ Apakah server       │           │ Apakah budget       │
    │ punya public IP?    │           │ terbatas ($0)?      │
    └─────────┬───────────┘           └─────────┬───────────┘
              │                                 │
    ┌─────────┴─────────┐             ┌─────────┴─────────┐
    │ YA                │ NEIN        │ YA                │ NEIN
    ▼                   ▼             ▼                   ▼
┌───────┐         ┌───────┐     ┌───────┐         ┌───────┐
│ Opsi │         │ Opsi │     │ Opsi │         │ Opsi │
│   A   │         │   E   │     │   D   │         │   B   │
│Docker │         │Tunnel │     │GH+CF  │         │CF P+W │
└───────┘         └───────┘     └───────┘         └───────┘
```

---

## 6. FAQ

### Q: Apakah bisa ganti opsi deployment nanti?

**A:** Ya. Karena arsitektur monorepo dengan packages terpisah, Anda bisa:
- Mulai dengan Opsi A (Docker simpel)
- Migrasi ke Opsi B (CF) saat butuh global reach
- Atau hybrid: Docker untuk staging, CF untuk production

### Q: Apakah data bisa dipindahkan?

**A:** Ya. Turso mendukung export ke SQLite file. Anda bisa:
- Export dari Turso cloud
- Import ke SQLite local
- Atau sebaliknya

### Q: Bagaimana dengan SSL/HTTPS?

**A:**
- **Opsi A:** Let's Encrypt gratis via Certbot
- **Opsi B, C, D, E:** SSL otomatis dari platform

### Q: Apakah butuh domain?

**A:**
- **Opsi A, E:** Domain direkomendasikan, tapi bisa pakai IP
- **Opsi B, C, D:** Domain wajib (tapi bisa subdomain gratis dari platform)

### Q: Bagaimana dengan backup?

**A:**
- **Turso:** Auto-backup, point-in-time recovery
- **SQLite local:** Backup manual file `.db`

### Q: Apakah bisa custom branding?

**A:** Ya. Semua teks, logo, dan warna bisa dikustomisasi di:
- `apps/web/src/styles/global.css` — Warna tema
- `apps/web/src/layouts/Layout.astro` — Logo dan footer
- `.context/ACTIVE.md` — Nama institusi

---

## Kontak dan Support

Untuk bantuan deployment, hubungi:
- GitHub Issues: [repo-url]/issues
- Email: support@lab-digital.dev

---

*Dokumen ini adalah bagian dari Lab Digital Platform — solusi white-label untuk institusi pendidikan.*
