# Roadmap & Milestone — Digital Lab SMA UII

Dokumen ini adalah sumber kebenaran tunggal untuk arah pengembangan platform.
Semua keputusan arsitektur, deployment, dan fitur mengacu ke sini.

---

## Konteks Platform

Digital Lab SMA UII adalah platform membership + LMS untuk komunitas developer
siswa SMA UII Yogyakarta. Platform ini dibangun secara open source dan dirancang
agar bisa diadopsi oleh sekolah atau instansi lain.

**Repo:** `SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io`
**Live:** `https://lab.smauiiyk.sch.id`

---

## Terminologi Standar Dokumentasi

Untuk menjaga keamanan, dokumentasi menggunakan alias berikut:

| Alias | Merujuk ke |
|-------|-----------|
| `db-preview` | Database Turso untuk development & CI |
| `db-production` | Database Turso untuk production |
| `app-container` | Container Docker aplikasi utama |
| `reverse-proxy` | nginx reverse proxy |
| `proxy-network` | Docker network yang terhubung ke reverse proxy |
| `internal-network` | Docker network internal antar services |
| `your-domain.sch.id` | Domain production instansi |
| `your-db.turso.io` | URL database Turso production |

---

## Milestone

### ✅ Milestone 1 — Platform Dasar (Selesai, April 2026)

Membangun platform membership yang bisa digunakan siswa untuk mendaftar,
mendapat persetujuan, dan mengakses konten LMS.

**Yang sudah selesai:**
- Auth: email/password + GitHub OAuth, session via Lucia v3
- Registrasi multi-step dengan verifikasi NIS via SLiMS
- Dashboard role-based (member vs maintainer)
- Member card digital dengan QR code
- LMS: 9 track, 116+ lesson, progress tracking, reading sessions
- Contribution graph
- Sidebar responsif (mobile/tablet/desktop) dengan 4 state
- Bottom nav mobile
- Deploy ke self-hosted server via Docker + reverse-proxy
- SSL via Let's Encrypt
- CI/CD: GitHub Actions (test + deploy manual trigger)
- Branch protection: `main` dan `develop`

---

### 🔧 Milestone 2 — Polish & Stabilisasi (April–Mei 2026)

**Sudah selesai:**
- Toast notification saat tandai lesson selesai
- Search & filter track di halaman belajar
- Module progress bars di halaman track
- Mobile lesson drawer
- Carousel "Terakhir Dipelajari"
- Sidebar overlay fix untuk tablet
- Profile dropdown refactor

**Masih perlu:**
- [ ] Deploy ke production (manual trigger GitHub Actions)
- [ ] Verifikasi semua fitur di production

---

### 📋 Milestone 3 — smauii-dev-api (Mei–Juni 2026)

REST API terpisah sebagai fondasi migrasi ke JAMstack, berjalan di Cloudflare Workers.

**Status:** Implementasi awal sudah ada di `smauii-dev-api/`
- ✅ Hono + CF Workers setup
- ✅ Auth routes: register, login (NISN/NIS/email), logout, me
- ✅ JWT via jose, bcryptjs untuk password hashing
- ❌ Belum di-deploy ke CF Workers
- ❌ Belum ada routes: members, activities, projects, announcements

**Yang perlu dikerjakan:**
- [ ] Deploy ke Cloudflare Workers
- [ ] Tambah routes: members, activities, projects, announcements
- [ ] Rate limiting via CF KV
- [ ] Integration test dengan frontend

---

### 📋 Milestone 4 — Migrasi JAMstack (Q3 2026)

Memisahkan frontend (static) dari backend (API).

**Arsitektur target:**
```
your-domain.sch.id          → GitHub Pages (Astro Static)
api.your-domain.sch.id      → Cloudflare Workers (smauii-dev-api)
```

**Prasyarat:** Milestone 3 selesai dan stabil.
Lihat `docs/MIGRATION_JAMSTACK.md` untuk detail teknis.

---

### 📋 Milestone 5 — Platform Integration (Q4 2026)

Integrasi dengan platform hosting untuk deployment yang lebih seamless,
mirip Vercel/Railway/Netlify tapi self-hosted.

**Prasyarat:** Platform hosting sudah punya web UI dan GitHub webhook support.

---

## Deployment Strategy per Instansi

| Instansi | Rekomendasi | Alasan |
|----------|-------------|--------|
| SMA UII Yogyakarta | Self-hosted (saat ini) | Kontrol penuh, infrastruktur sudah ada |
| Sekolah lain (fase SSR) | Cloudflare Pages | Gratis, mudah setup |
| Sekolah lain (fase JAMstack) | GitHub Pages + CF Workers | Gratis sepenuhnya |
| Enterprise/Pemerintah | VPS sendiri | Kontrol data penuh, compliance |

---

## Keputusan Teknis yang Sudah Final

| Keputusan | Pilihan | Alasan |
|-----------|---------|--------|
| Package manager | Bun | Lebih cepat dari pnpm/npm |
| Auth library | Lucia v3 | Tidak ada circular deps |
| ORM | Drizzle | Build-time SQL, kompatibel libSQL |
| Database | Turso (libSQL) | SQLite-compatible, edge-ready |
| Password hashing (SSR) | @node-rs/argon2 | Native, Argon2id |
| Password hashing (CF Workers) | bcryptjs | Pure JS, tidak butuh native addon |
| API framework | Hono | Lightweight, CF Workers native |

---

**Terakhir diperbarui:** 2026-04-19
