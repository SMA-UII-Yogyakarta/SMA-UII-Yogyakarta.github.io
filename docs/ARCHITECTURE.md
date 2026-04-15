# Strategi Arsitektur: SSR → Static SPA+CSR

**Dokumen ini adalah panduan bertahap untuk migrasi dan perbaikan menyeluruh.**

---

## Audit Kondisi Saat Ini

### Yang Sudah Benar
- Middleware validate session sekali, simpan di `locals` ✓
- `AuthLayout` terpisah dari `Layout` ✓
- `success.astro` punya server-side guard ✓
- DB schema lengkap (users, sessions, tracks, cards, activities, notifications, announcements, projects) ✓

### Masalah yang Ditemukan

#### 1. Double `validateSession` di API routes
Hampir semua API route (`/api/members`, `/api/profile`, `/api/admin/*`, `/api/announcements`, dll) masih memanggil `lucia.validateSession()` sendiri via `cookies`, padahal middleware sudah set `locals`. Ini menyebabkan 2x DB query per request.

#### 2. Env var DB di-expose ke client
`PUBLIC_TURSO_URL` dan `PUBLIC_TURSO_TOKEN` pakai prefix `PUBLIC_` — artinya token Turso ter-expose ke browser. Ini **security issue serius**.

#### 3. GitHub OAuth callback tidak pakai `locals`
`/api/auth/github/callback` masih manual validate, bukan dari locals.

#### 4. Login email/password tidak bisa untuk user `pending`
Benar secara logika, tapi error message bisa lebih informatif + redirect ke `/check-status`.

#### 5. Tidak ada auth guard server-side di halaman `/app/*`
Semua halaman `/app/*` hanya guard client-side (fetch `/api/auth/me` lalu redirect). Jika JS lambat/gagal, halaman ter-render tanpa auth.

#### 6. Deploy workflow build SSR tapi target GitHub Pages (static)
`astro.config.mjs` pakai `output: 'server'` + Node adapter, tapi `deploy.yml` upload ke GitHub Pages yang hanya support static files. Ini **tidak akan berjalan**.

#### 7. API routes tidak bisa di GitHub Pages
GitHub Pages hanya serve static files. Semua `/api/*` tidak akan berfungsi.

---

## Strategi Arsitektur

### Pilihan: Hybrid Deployment

Karena ada kebutuhan:
- **GitHub Pages** (gratis, sudah ada domain `lab.smauiiyk.sch.id`)
- **API dengan auth** (butuh server/edge runtime)
- **Database Turso** (sudah ada, remote)

Solusinya adalah **split deployment**:

```
lab.smauiiyk.sch.id          → GitHub Pages (static SPA)
api.lab.smauiiyk.sch.id      → Cloudflare Workers (API + auth)
```

Atau alternatif lebih simpel tanpa subdomain baru:

```
lab.smauiiyk.sch.id          → Cloudflare Pages (full-stack, gratis)
```

**Rekomendasi: Cloudflare Pages** — support SSR via Workers, gratis, deploy dari GitHub, tidak perlu pisah domain.

---

## Alur Auth Lengkap (Target)

### A. Login GitHub

```
User klik "Login with GitHub"
  → GET /api/auth/github
    → generate state, set cookie github_oauth_state
    → redirect ke github.com/login/oauth/authorize

GitHub callback
  → GET /api/auth/github/callback?code=...&state=...
    → validasi state cookie
    → exchange code → access token
    → fetch github user + primary email
    → cari user di DB by githubUsername atau githubId
      → tidak ditemukan → 403 (belum terdaftar)
      → ditemukan, status pending → redirect /check-status?nisn=...
      → ditemukan, status active/maintainer → buat session → set cookie → redirect /app
```

### B. Login Email/NIS/NISN

```
User submit form login
  → POST /api/auth/login { nisn|nis, password }
    → cari user by nisn atau nis
    → verify argon2 password hash
    → status pending → return 403 + redirect hint ke /check-status
    → status inactive → return 403
    → status active/maintainer → buat session → set cookie → return 200
  → client redirect ke /app
```

### C. Registrasi

```
User buka /register
  → AuthLayout cek locals.user → jika sudah login redirect /app
  → Step 1: input NISN
    → POST /api/slims/verify { nisn }
      → cek mock/real SLiMS data
      → cek apakah sudah terdaftar di DB
      → return data siswa
  → Step 2-5: isi data, github, tracks, konfirmasi
  → POST /api/register { nisn, nis, name, email, class, githubUsername, tracks }
    → validasi Zod
    → cek duplikat
    → insert users + member_tracks dalam transaction
    → return 201
  → redirect /success?nisn=...
```

### D. Halaman /success

```
Server-side:
  → cek locals.user → sudah login → redirect /app
  → cek NISN di DB → tidak ada → redirect /register
  → status bukan pending → redirect /check-status?nisn=...
  → render halaman sukses dengan data user dari DB (no client fetch)
```

### E. Halaman /check-status

```
Client-side SPA:
  → baca ?nisn dari URL
  → GET /api/register?identifier=...&checkStatus=true
  → tampilkan status + countdown
  → sync URL saat input berubah
```

### F. Dashboard /app (role-based)

```
Server-side (DashboardLayout):
  → locals.user null → redirect /login
  → locals.user.status === 'pending' → redirect /check-status
  → locals.user.status === 'inactive' → redirect /login?error=inactive
  → render layout dengan role dari locals

Client-side (per halaman):
  → maintainer: load admin dashboard (stats, pending approvals)
  → member: load member dashboard (profile, card, activities)

Halaman maintainer-only (/app/members, /app/settings, /app/announcements):
  → server-side: cek locals.user.role !== 'maintainer' → redirect /app
```

---

## Rencana Perbaikan Bertahap

### Fase 1 — Perbaikan Kritis (Hari ini)

**1.1 Fix security: env var DB**
- Ganti `PUBLIC_TURSO_URL` → `TURSO_URL` (tanpa PUBLIC_)
- Ganti `PUBLIC_TURSO_TOKEN` → `TURSO_TOKEN`
- Update `src/db/index.ts`
- Update `.env.example`

**1.2 Semua API routes pakai `locals`**
Ganti semua `cookies.get(lucia.sessionCookieName)` + `lucia.validateSession()` di API routes dengan `locals.session` + `locals.user`.

File yang perlu diupdate:
- `src/pages/api/admin/approve.ts`
- `src/pages/api/admin/users.ts`
- `src/pages/api/admin/stats.ts`
- `src/pages/api/admin/set-password.ts`
- `src/pages/api/members/index.ts`
- `src/pages/api/profile.ts`
- `src/pages/api/announcements/index.ts`
- `src/pages/api/activities/index.ts`
- `src/pages/api/projects/index.ts`
- `src/pages/api/notifications/index.ts`
- `src/pages/api/notifications/read.ts`

**1.3 Server-side auth guard di DashboardLayout**
```astro
const user = Astro.locals.user;
if (!user) return Astro.redirect('/login');
if (user.status === 'pending') return Astro.redirect(`/check-status?nisn=${user.nisn}`);
if (user.status === 'inactive') return Astro.redirect('/login?error=inactive');
```

**1.4 Server-side role guard di halaman maintainer-only**
Tambahkan di frontmatter `/app/members.astro`, `/app/settings.astro`, `/app/announcements.astro`:
```astro
if (Astro.locals.user?.role !== 'maintainer') return Astro.redirect('/app');
```

**1.5 GitHub OAuth callback: redirect pending ke check-status**
Saat ini redirect ke `/login?error=inactive` untuk inactive, tapi tidak handle `pending`. Fix:
```ts
if (existingUser.status === 'pending') return redirect(`/check-status?nisn=${existingUser.nisn}`);
if (existingUser.status === 'inactive') return redirect('/login?error=inactive');
```

---

### Fase 2 — Migrasi ke Static SPA+CSR (Minggu ini)

**Tujuan:** Deploy ke GitHub Pages sebagai static site, API tetap berjalan.

**Strategi:**

GitHub Pages hanya serve HTML/CSS/JS statis. Tidak ada server runtime. Maka:

```
Opsi A: Cloudflare Pages (rekomendasi)
  - Ganti adapter: @astrojs/node → @astrojs/cloudflare
  - Deploy ke Cloudflare Pages (gratis, support SSR via Workers)
  - Tidak perlu ubah kode API
  - GitHub Actions deploy ke CF Pages, bukan GitHub Pages

Opsi B: GitHub Pages (pure static) + API terpisah
  - Astro output: 'static'
  - Semua halaman jadi HTML statis
  - Auth/API pindah ke Cloudflare Workers terpisah
  - Frontend fetch ke workers URL
  - Butuh CORS setup
  - Lebih kompleks, tidak direkomendasikan
```

**Langkah Opsi A (Cloudflare Pages):**

1. Install adapter:
   ```bash
   pnpm add @astrojs/cloudflare
   ```

2. Update `astro.config.mjs`:
   ```js
   import cloudflare from '@astrojs/cloudflare';
   export default defineConfig({
     output: 'server',
     adapter: cloudflare({ mode: 'directory' }),
   })
   ```

3. Update `src/db/index.ts` untuk support Cloudflare D1 atau tetap Turso (Turso support edge via HTTP, tidak perlu ubah).

4. Update `.github/workflows/deploy.yml`:
   ```yaml
   - uses: cloudflare/wrangler-action@v3
     with:
       apiToken: ${{ secrets.CF_API_TOKEN }}
       command: pages deploy dist --project-name=smauii-lab
   ```

5. Pindahkan env vars ke Cloudflare Pages dashboard (bukan di-commit).

**Langkah Opsi B (GitHub Pages pure static):**

Jika tetap ingin GitHub Pages:

1. Pisahkan API ke repo/project terpisah sebagai Cloudflare Workers
2. Astro jadi pure static (`output: 'static'`)
3. Semua auth logic pindah ke Workers
4. Frontend pakai `fetch('https://api.lab.smauiiyk.sch.id/...')`
5. Workers set CORS header untuk domain GitHub Pages

---

### Fase 3 — SPA Enhancement (Opsional)

Untuk UX yang lebih smooth (tidak full page reload antar halaman):

1. Tambahkan View Transitions API (sudah built-in di Astro):
   ```js
   // astro.config.mjs
   experimental: { viewTransitions: true }
   ```

2. Atau gunakan `@astrojs/transitions` untuk client-side navigation.

3. Untuk halaman `/app/*` yang sudah full CSR, tidak perlu perubahan.

---

### Fase 4 — Keamanan Tambahan

**4.1 Rate limiting**
Tambahkan di middleware untuk endpoint sensitif:
- `/api/auth/login` → max 5 req/menit per IP
- `/api/register` → max 3 req/menit per IP
- `/api/slims/verify` → max 10 req/menit per IP

Implementasi: gunakan KV store (Cloudflare KV) atau in-memory Map dengan TTL.

**4.2 CSRF protection**
Login form sudah aman (JSON body, bukan form POST). GitHub OAuth sudah pakai state parameter. Logout pakai form POST — tambahkan CSRF token atau ganti ke fetch DELETE.

**4.3 Session security**
- Session cookie sudah `httpOnly: true`, `secure: PROD`, `sameSite: lax` ✓
- Tambahkan session expiry yang lebih ketat (saat ini default Lucia = 30 hari)
- Invalidate semua session saat password berubah ✓ (sudah ada)

**4.4 Input sanitization**
`escapeHtml` sudah ada di `api-utils.ts` tapi tidak dipakai konsisten. Audit semua tempat yang render user input ke DOM.

---

## Checklist Pengerjaan

### Fase 1 (Kritis)
- [ ] Fix env var: hapus `PUBLIC_` prefix dari TURSO_URL dan TURSO_TOKEN
- [ ] Update semua API routes pakai `locals` (11 file)
- [ ] Server-side auth guard di `DashboardLayout`
- [ ] Server-side role guard di halaman maintainer-only
- [ ] Fix GitHub OAuth callback untuk status `pending`
- [ ] Fix login error message untuk `pending` → arahkan ke `/check-status`

### Fase 2 (Deployment)
- [ ] Pilih: Cloudflare Pages atau GitHub Pages + Workers terpisah
- [ ] Install dan konfigurasi adapter yang sesuai
- [ ] Update GitHub Actions workflow
- [ ] Setup env vars di platform target
- [ ] Test build dan deploy

### Fase 3 (SPA)
- [ ] Aktifkan View Transitions
- [ ] Test navigasi antar halaman

### Fase 4 (Security)
- [ ] Rate limiting di middleware
- [ ] Audit semua `innerHTML` yang render user data
- [ ] Review session expiry policy

---

## Keputusan yang Perlu Dibuat

1. **Deployment target**: Cloudflare Pages (SSR tetap) atau GitHub Pages (pure static)?
   - Cloudflare Pages: lebih mudah, tidak perlu ubah arsitektur API
   - GitHub Pages: gratis tapi butuh refactor besar untuk API

2. **SLiMS integration**: Mock data atau real API?
   - Saat ini mock. Jika real, butuh `SLIMS_API_URL` + `SLIMS_API_KEY` dari env.

3. **Session expiry**: Berapa lama? Default Lucia 30 hari, mungkin terlalu lama untuk sekolah.

---

*Dokumen ini dibuat: 2026-04-15. Update sesuai progress pengerjaan.*
