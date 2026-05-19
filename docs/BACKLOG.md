# Backlog & Roadmap — Digital Lab SMA UII

**Dokumen ini adalah sumber kebenaran tunggal untuk semua pekerjaan yang tersisa.**
Update setiap kali item selesai atau ada prioritas baru.

Terakhir diperbarui: 2026-05-19

---

## Status Platform Saat Ini

### ✅ Sudah Live di Production (`https://lab.smauiiyk.sch.id`)

| Fitur | Status |
|-------|--------|
| Platform membership (auth, dashboard, API) | ✅ Live |
| LMS `/app/learn/*` dengan progress tracking | ✅ Live |
| Reading sessions + contribution graph | ✅ Live |
| Sidebar responsif (mobile/tablet/desktop) | ✅ Live |
| Bottom nav mobile | ✅ Live |
| 9 track, 116 lesson di smauii-dev-content | ✅ Live |
| Deploy ke Awankinton via nginx-proxy | ✅ Live |
| SSL cert lab.smauiiyk.sch.id | ✅ Live |
| Integrasi SLiMS real data (NIS) | ✅ Live |
| Plugin SLiMS `lab-digital-api` | ✅ Live |
| Easter egg `/app/about` + kembang api | ✅ Live |
| Floating navbar landing page | ✅ Live |

---

## ✅ Selesai

| Item | Keterangan |
|------|-----------|
| 1.1 Expired membership → warning | Fixed |
| 1.2 Label NISN → NIS | Fixed |
| 1.3 Dropdown kelas wajib | Fixed |
| 1.4 Submodule pointer | Fixed |
| 2.1 Rate limiting SLiMS API | Fixed |
| 2.2 CI/CD GitHub Actions | Fixed |
| 2.3 Mobile profile nav | Fixed |
| 2.4 Mobile lesson drawer | Fixed — drawer slide dari kiri, tombol "Materi" di topbar |
| 2.5 Production Turso DB | Fixed |
| Env management | Fixed — .env.production via build args |
| Commit messages | Fixed — English, no infra details |
| 3.1 Toast notification tandai selesai | Fixed — toast hijau + toast abu undo |
| 3.2 Carousel "Terakhir Dipelajari" | Fixed — grid 3 kolom, max 3 lesson |
| 3.3 Search & filter tracks | Fixed — real-time search + filter chip level |
| 3.4 Progress bar per modul | Fixed — mini progress bar di accordion header |

---

## 🔴 Prioritas 0 — Workflow & Infrastruktur Dev

### 0.1 Deploy Workflow Trigger Otomatis ke Production
**Status: ✅ SELESAI** — diubah ke `workflow_dispatch` dengan input `reason`

### 0.2 Branch Protection Rules Belum Di-setup
**Status: ✅ SELESAI** — `main` dan `develop` protected via GitHub API:
- Require PR dengan 1 approver
- Require CI pass (Unit Tests + Type Check)
- No force push, no direct push

### 0.3 Staging Environment Belum Ada
**Status: 📖 TERDOKUMENTASI** — lihat `docs/WORKFLOW.md` bagian 6 untuk setup `lab-dev.localhost`

---



> Harus selesai sebelum user pertama masuk. Setiap item ini bisa menyebabkan
> user tidak bisa mendaftar atau pengalaman yang membingungkan.

### 1.1 Registrasi Diblokir karena Expired Membership

**Status: ✅ SELESAI** — Fixed.

**Masalah:** Banyak siswa di SLiMS punya `expire_date` di masa lalu (2024).
Platform saat ini menampilkan warning tapi perlu diverifikasi bahwa `setStep('data')`
tetap berjalan setelah warning ditampilkan.

**File:** `src/components/RegisterForm.tsx`

**Test case:**
- Masukkan NIS `1763` (expired 2024-03-27)
- Harus muncul warning kuning, tapi tetap bisa lanjut ke step berikutnya
- Tidak boleh diblokir

**Acceptance criteria:**
- Warning tampil: "Keanggotaan perpustakaan kamu expired sejak {tanggal}. Silakan perpanjang."
- User tetap bisa lanjut registrasi
- Keanggotaan perpustakaan ≠ keanggotaan Digital Lab

---

### 1.2 Label "NISN" Masih Ada di Beberapa Tempat

**Status: ✅ SELESAI** — Fixed.

**Masalah:** SLiMS SMA UII menggunakan NIS (bukan NISN) sebagai `member_id`.
Semua label "NISN" di UI harus diganti "NIS" agar tidak membingungkan.

**File yang perlu dicek:**
- `src/pages/login.astro` — placeholder/label form
- `src/pages/api/auth/login.ts` — error message "NISN/NIS/Email"
- `src/pages/check-status.astro` — jika ada referensi NISN
- `src/components/RegisterForm.tsx` — sudah sebagian diupdate, verifikasi ulang

**Acceptance criteria:**
- Semua label menggunakan "NIS" bukan "NISN"
- Error message: "NIS/Email tidak ditemukan" bukan "NISN/NIS/Email"

---

### 1.3 Field Kelas Wajib Diisi tapi Tidak Ada Validasi

**Status: ✅ SELESAI** — Fixed.

**Masalah:** SLiMS tidak menyimpan data kelas siswa. Field `class` dikembalikan
kosong dari API. User harus isi manual, tapi saat ini tidak ada validasi wajib.

**File:** `src/components/RegisterForm.tsx` — step `data`

**Acceptance criteria:**
- Field kelas wajib diisi (tidak bisa kosong)
- Dropdown pilihan kelas: X IPA 1, X IPA 2, X IPS 1, XI IPA 1, dst.
- Atau input text bebas jika daftar kelas belum tersedia

---

### 1.4 Submodule Pointer Belum Di-update di Repo Utama

**Status: ✅ SELESAI** — Fixed.

**Masalah:** `smauii-dev-content` sudah di-push ke GitHub tapi pointer di repo
utama (`smauii-dev-foundation`) masih menunjuk ke commit lama.

**Cara fix:**
```bash
cd /home/dev/project/smauii-dev-foundation
git add smauii-dev-content
git commit -m "chore: update smauii-dev-content submodule pointer"
git push
```

---

## 🟡 Prioritas 2 — Fitur Penting

> Perlu selesai dalam minggu pertama setelah launch.

### 2.1 Rate Limiting untuk SLiMS API

**Status: ✅ SELESAI** — Implemented.

**Masalah:** Plugin `api.php` bisa di-enumerate untuk mencari NIS valid.
Tidak ada proteksi terhadap brute force.

**Solusi:** Tambahkan `limit_req` di nginx-proxy untuk path plugin.

**File:** nginx config untuk library (di server, path sesuai environment)

```nginx
# Tambahkan di bagian atas file (sebelum server block)
limit_req_zone $binary_remote_addr zone=slims_api:10m rate=10r/m;

# Di dalam location block untuk plugin
location /plugins/lab-digital-api/ {
    limit_req zone=slims_api burst=5 nodelay;
    # ... existing proxy config
}
```

---

### 2.2 CI/CD GitHub Actions

**Status: ✅ SELESAI** — Implemented.

**Masalah:** Deploy masih manual. Setiap update butuh SSH ke server dan
jalankan `docker build` + `docker compose up` secara manual.

**File yang perlu dibuat:** `.github/workflows/deploy.yml`

**Template sudah ada di:** `docs/DEPLOYMENT_AWANKINTON.md` — Fase 5

**Secrets yang perlu di-setup di GitHub:**
- `SERVER_HOST` — IP server Awankinton
- `SERVER_USER` — username SSH
- `SSH_PRIVATE_KEY` — private key untuk SSH

---

### 2.3 Mobile: Akses Profile/Settings/Logout

**Status: ✅ SELESAI** — Fixed.

**Masalah:** Di mobile (< 640px), sidebar hidden dan bottom nav tidak punya
item profile. User tidak bisa logout atau akses settings.

**Solusi:** Tambahkan item "Profil" di bottom nav yang mengarah ke `/app/profile`.
Atau buat halaman profile yang juga berisi tombol logout.

**File:** `src/components/BottomNav.astro`

---

### 2.4 Mobile: Navigasi Lesson

**Status: ✅ SELESAI** — Fixed.

**Masalah:** Di halaman lesson (`/app/learn/[track]/[...lesson]`), sidebar kiri
(daftar lesson dalam modul) tidak tampil di mobile. Navigasi hanya via tombol
prev/next di bawah konten.

**Solusi:** Tambahkan bottom sheet atau drawer yang bisa dibuka untuk melihat
daftar lesson. Trigger: tombol "Daftar Materi" di topbar lesson page.

---

### 2.5 Production Turso Database

**Status: ✅ SELESAI** — Implemented.

**Masalah:** Saat ini masih menggunakan preview database
(`smauiilab-prev-sandikodev`). Untuk production, perlu database terpisah.

**Langkah:**
1. Buat database production di Turso dashboard
2. Jalankan `bun run db:push` ke database baru
3. Update `TURSO_URL` dan `TURSO_AUTH_TOKEN` di `.env` production
4. Rebuild dan redeploy container

---

## 🔵 Prioritas 4 — Infrastruktur

### 4.1 Monitoring & Alerting

**Status: ✅ SELESAI** — `lab.smauiiyk.sch.id` dimonitor via Uptime Kuma di
`monitor.smauiiyk.sch.id/uptime`. Alert Telegram aktif jika service down.
Kenari gateway juga monitor response time dan SSL expiry via Prometheus + Blackbox Exporter.

---

### 4.2 Log Management

**Status: ✅ SELESAI** — Log rotation sudah dikonfigurasi di docker-compose:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## 🔴 Prioritas 1 — Security & Bugs

### 1.1 Input Sanitization di `profile.ts` PATCH

**Status: ✅ SELESAI** — Implemented. Trim, empty check, max-length validation added.

---

### 1.2 Validasi Zod Tidak Konsisten di API Routes

**Status: ✅ SELESAI** — Implemented. Added 5 Zod schemas to validation.ts (createActivitySchema, approveUserSchema, setPasswordSchema, updateProfileSchema, readingSessionSchema). All 5 routes migrated.

---

### 1.3 `admin/users.ts` PATCH — Tidak Ada Validasi Enum `role` dan `status`

**Status: ✅ SELESAI** — Implemented. Added VALID_ROLES = ['member', 'maintainer'] and VALID_STATUSES validation.

---

### 1.4 `admin/users.ts` DELETE — Orphaned Data (activities, projects, notifications)

**Status: ✅ SELESAI** — Implemented. CASCADE delete includes activities, projects, notifications, learningProgress, readingSessions, memberTracks, sessions, memberCards.

---

### 1.5 `RegisterForm.tsx` — Daftar Kelas Tidak Lengkap

**Status: ✅ SELESAI** — Fixed. Import classOptions from validation.ts, dropdown now shows all 21 classes.

---

### 1.6 `RegisterForm.tsx` — Dead Link ke `/dashboard`

**Status: ✅ SELESAI** — Fixed. Link changed to `/success?nisn=...`.

---

### 1.7 Path Server Hardcoded di `deploy.yml`

**Status: ✅ SELESAI** — Implemented. Paths replaced with ${{ secrets.DEPLOY_APP_PATH }} and ${{ secrets.DEPLOY_COMPOSE_PATH }}.

---

### 1.8 Deploy Workflow Tidak Ada Pre-deployment Test Check

**Status: ✅ SELESAI** — Implemented. Added test job (unit test + type check) with `needs: [test]` in deploy workflow.

---

### 1.9 Missing Index `createdAt` di Tabel `announcements`

**Status: ✅ SELESAI** — Implemented. Added `index('idx_announcements_created_at').on(table.createdAt)`.

---

## 🟢 Prioritas 3 — Enhancement & Polish

> Fitur yang direncanakan, belum ada di source code, bisa dikerjakan kapan saja.

### 3.1 Filter & Search di Halaman Activities

**Status: ✅ SELESAI** — Implemented. Filter chips for all activity types with active state styling.

---

### 3.2 Edit Activity

**Status: ✅ SELESAI** — Implemented. PATCH endpoint + edit modal with pre-filled form, owner/maintainer only.

---

### 3.3 Search di Halaman Projects

**Status: ✅ SELESAI** — Implemented. Search input with debounce + maintainer user filter dropdown.

---

### 3.4 Pin Announcement

**Status: ✅ SELESAI** — Implemented. isPinned field in schema, PATCH endpoint for toggle, UI with SVG pin/unpin buttons + badge + yellow border + ordering.

---

### 3.5 Avatar Upload untuk Profile

**Status: ✅ SELESAI** — Implemented. avatarUrl in schema, upload in profile.astro, avatar display in Topbar.astro + Sidebar.astro.

---

### 3.6 Role Alumni

**Status: ✅ SELESAI** — Implemented. Added 'alumni' to valid roles in admin/users.ts PATCH, alumni guard in guards.ts, activity/project creation blocked for alumni, role change button in member detail modal, alumni count in public API.

---

### 3.7 Rate Limiting di App Level

**Status: ✅ SELESAI** — Implemented. In-memory rate limiter in middleware.ts for login (5/min), register (3/min), slims/verify (10/min), forgot-password, reset-password + 5-min cleanup interval.

---

### 3.8 Analytics Dashboard

**Status: ✅ SELESAI** — Implemented. overview.astro with 4 stat cards, track popularity CSS bar chart, activity breakdown chart, recent members, announcements, pending approvals with approve/reject buttons.

---

### 3.9 Subtitle di Halaman Members

**Status: ✅ SELESAI** — Implemented. Added PageHeader with subtitle "Kelola dan pantau seluruh anggota komunitas".

---

### 3.13 Download / Print Member Card

**Status: ✅ SELESAI** — Implemented. Print button + @media print CSS with clean card-only layout, #topbar ID added to Topbar.astro.

---

### 3.14 Email Konfirmasi Registrasi (Pending)

**Status: ✅ SELESAI** — Implemented. sendRegistrationEmail() added to email.ts, triggered in register.ts.

---

### 3.15 Email Notifikasi Rejection

**Status: ✅ SELESAI** — Implemented. sendRejectionEmail() added, triggered in approve.ts before deletion.

---

### 3.16 Password Reset / Forgot Password

**Status: ✅ SELESAI** — Implemented. forgot-password.astro + reset-password.astro + API endpoints + JWT token (1h expiry) + email notification.

---

### 3.17 Filter by Track/Class di Members Page

**Status: ✅ SELESAI** — Implemented. Track filter chips + class dropdown + API support for ?track=, ?class=, ?search= params.

---

### 3.18 Tampilkan `approvedBy` di UI

**Status: ✅ SELESAI** — Implemented. Displayed in profile page and member detail modal as "Disetujui oleh: [nama]".

---

### 3.19 Pagination di Public Pages

**Status: ✅ SELESAI** — Implemented. New /api/public/members and /api/public/projects endpoints with page/limit + pagination UI on both public pages.

---

### 3.20 Achievement Badges & Leaderboard

**Status: ✅ SELESAI** — Implemented complete badge system with leaderboard.

**Implementasi:**
- Schema: `badges` table (definitions), `userBadges` junction table, `badgeScore` on users
- 18 badge definitions: activity, project, learning, streak, community, special
- `checkAndAwardBadges()` function for automatic badge awarding
- Leaderboard page at `/app/leaderboard`
- Badge display on profile page
- Seed script: `bun run db:seed:badges`

**Badge Categories:**
- Activity: 5/20/50/100 activities (bronze/silver/gold/diamond)
- Project: 1/5/15/30 projects
- Learning: 3/10/25 lessons completed
- Streak: 3/7/30/100 consecutive days
- Special: Manual award (Mentor, Hackathon winner)

---

### 3.21 Fetch GitHub Contributions

**Status: ✅ SELESAI** — Implemented GitHub contributions display.

**Implementasi:**
- API endpoint: `/api/github-contributions`
- Fetches public events (commits, PRs, issues) from GitHub REST API
- 5-minute memory cache to reduce API calls
- Client-side loading on profile page (non-blocking)
- Shows: commit count, PR count, issue count, top repos
- Optional `GITHUB_PAT` env var for higher rate limits

**Catatan:** Users need `githubUsername` set to see contributions.

---

## 🟡 Prioritas 3 — SLiMS Integration Lanjutan

### 3.10 Endpoint Search di Plugin SLiMS

**Status: ✅ SELESAI** — Implemented in `apps/plugins/slims/api.php`.

**Endpoint:**
```
GET /api.php?action=search&q={query}&limit=20
Header: X-Lab-API-Key: {key}
```

Search by NIS, name, or email. Min 2 characters.

**Response:**
```json
{
  "total": 2,
  "query": "john",
  "members": [{ "nis", "name", "email", "member_type", "is_expired" }]
}
```

---

### 3.11 Sync Data SLiMS saat Login

**Status: ✅ SELESAI** — Implemented in `apps/web/src/pages/api/auth/login.ts`.

**Implementasi:**
- `syncSlimsData()` function memanggil SLiMS API saat login
- Update `name` dan `email` jika berubah di SLiMS
- Non-blocking: login tidak gagal jika sync gagal
- Hanya berjalan jika `SLIMS_API_URL` dan `SLIMS_API_KEY` dikonfigurasi

**Catatan:** GitHub OAuth callback tidak perlu sync karena user sudah ada di database dari seed/registrasi.

---

### 3.12 Evaluasi Field `nisn` di Database

**Status: ✅ SELESAI** — `nisn` sekarang nullable, `nis` sebagai primary identifier.

**Perubahan:**
- Schema: `nisn` menjadi optional (nullable), `nis` wajib
- Migration: Semua nilai `nisn` yang ada di-set ke NULL (karena berisi NIS, bukan NISN)
- Query: Login/registrasi hanya pakai `nis` dan `email` sebagai identifier
- NISN akan diisi nanti dari Aksesekolah.id

**Catatan:** Field `nisn` tetap ada untuk integrasi masa depan dengan Aksesekolah.id yang akan menyediakan NISN nasional (10 digit).

---

## ⚪ Prioritas 5 — Masa Depan

> Dikerjakan setelah pangkalan data terpusat (Laravel + Next.js) siap.
> Jangan dikerjakan sekarang — akan berubah saat arsitektur berubah.

### 5.1 Migrasi ke Jamstack

Sudah didokumentasikan lengkap di `docs/MIGRATION_JAMSTACK.md`.
Tunggu pangkalan data terpusat siap.

### 5.2 smauii-dev-api sebagai Proxy Layer

Sudah didokumentasikan di `smauii-dev-api/docs/API_INTEGRATION_STRATEGY.md`.
Implementasi saat Laravel siap.

### 5.3 Integrasi Data Kelas Siswa

**Status: ✅ SELESAI (workaround)** — SLiMS tidak punya data kelas. Solusi sementara: field `class` diisi user secara manual saat registrasi via dropdown. Data tersimpan di DB Digital Lab (`users.class`).

**Integrasi penuh:** Menunggu **Aksesekolah.id** (SaaS multi-tenant sistem sekolah digital) siap dikonsumsi. Aksesekolah.id akan menyediakan data kelas siswa secara terpusat untuk semua sekolah tenant, termasuk SMA UII.

### 5.4 NISN sebagai Identifier

**Status: 🔒 BLOCKED** — SLiMS hanya punya NIS (4 digit), tidak punya NISN. Label di UI sudah menggunakan "NIS" sejak P1.2.

**Integrasi penuh:** Menunggu **Aksesekolah.id** yang akan menyediakan NISN sebagai identifier terpusat. Saat tersedia, perlu migrasi field di DB Digital Lab dari `nis` ke `nisn`.

---

## Konvensi Pengerjaan

### Sebelum Mulai Item Baru
1. Baca dokumen ini dan pilih item dengan prioritas tertinggi
2. Pastikan `bun run check` 0 errors sebelum mulai
3. Buat branch jika perubahan besar: `git checkout -b fix/nama-issue`

### Setelah Selesai
1. Jalankan `bun run check` — harus 0 errors, 0 warnings
2. Test di browser (dev dan production jika memungkinkan)
3. Commit dengan conventional commits: `fix:`, `feat:`, `docs:`, dll
4. Update dokumen ini — tandai item sebagai selesai atau hapus dari backlog
5. Rebuild dan redeploy jika ada perubahan yang perlu di-deploy

### Konvensi Commit
```
fix: perbaiki registrasi diblokir karena expired membership
feat: tambah toast notification saat tandai selesai
docs: update backlog — tandai 1.1 dan 1.2 selesai
chore: update submodule pointer smauii-dev-content
```

---

## Catatan Teknis Penting

### SLiMS ↔ Digital Lab
- `member_id` di SLiMS = **NIS** (bukan NISN), format 4 digit
- Tidak ada data kelas di SLiMS — user isi manual saat registrasi
- Expired membership ≠ tidak boleh daftar Digital Lab
- Detail lengkap: `docs/SLIMS_INTEGRATION_NOTES.md`

### Deployment
- nginx-proxy yang expose 80/443 — bukan Traefik
- Container lab tidak expose port ke host
- Detail lengkap: `docs/DEPLOYMENT_AWANKINTON.md`

### Integrasi API Masa Depan
- Konvensi REST + OpenAPI → TypeScript types (bukan gRPC)
- Detail lengkap: `smauii-dev-api/docs/API_INTEGRATION_STRATEGY.md`
