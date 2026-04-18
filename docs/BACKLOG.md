# Backlog & Roadmap — Digital Lab SMA UII

**Dokumen ini adalah sumber kebenaran tunggal untuk semua pekerjaan yang tersisa.**
Update setiap kali item selesai atau ada prioritas baru.

Terakhir diperbarui: 2026-04-18

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
| 2.5 Production Turso DB | Fixed |
| Env management | Fixed — .env.production via build args |
| Commit messages | Fixed — English, no infra details |

---

## 🔴 Prioritas 1 — Bug & Blocker

> Harus selesai sebelum user pertama masuk. Setiap item ini bisa menyebabkan
> user tidak bisa mendaftar atau pengalaman yang membingungkan.

### 1.1 Registrasi Diblokir karena Expired Membership

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

**Masalah:** SLiMS tidak menyimpan data kelas siswa. Field `class` dikembalikan
kosong dari API. User harus isi manual, tapi saat ini tidak ada validasi wajib.

**File:** `src/components/RegisterForm.tsx` — step `data`

**Acceptance criteria:**
- Field kelas wajib diisi (tidak bisa kosong)
- Dropdown pilihan kelas: X IPA 1, X IPA 2, X IPS 1, XI IPA 1, dst.
- Atau input text bebas jika daftar kelas belum tersedia

---

### 1.4 Submodule Pointer Belum Di-update di Repo Utama

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

**Masalah:** Plugin `api.php` bisa di-enumerate untuk mencari NIS valid.
Tidak ada proteksi terhadap brute force.

**Solusi:** Tambahkan `limit_req` di nginx-proxy untuk path plugin.

**File:** `/home/dev/web/infrastructure/nginx/conf.d/smauii/library.conf`

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

**Masalah:** Di mobile (< 640px), sidebar hidden dan bottom nav tidak punya
item profile. User tidak bisa logout atau akses settings.

**Solusi:** Tambahkan item "Profil" di bottom nav yang mengarah ke `/app/profile`.
Atau buat halaman profile yang juga berisi tombol logout.

**File:** `src/components/BottomNav.astro`

---

### 2.4 Mobile: Navigasi Lesson

**Masalah:** Di halaman lesson (`/app/learn/[track]/[...lesson]`), sidebar kiri
(daftar lesson dalam modul) tidak tampil di mobile. Navigasi hanya via tombol
prev/next di bawah konten.

**Solusi:** Tambahkan bottom sheet atau drawer yang bisa dibuka untuk melihat
daftar lesson. Trigger: tombol "Daftar Materi" di topbar lesson page.

---

### 2.5 Production Turso Database

**Masalah:** Saat ini masih menggunakan preview database
(`smauiilab-prev-sandikodev`). Untuk production, perlu database terpisah.

**Langkah:**
1. Buat database production di Turso dashboard
2. Jalankan `bun run db:push` ke database baru
3. Update `TURSO_URL` dan `TURSO_AUTH_TOKEN` di `.env` production
4. Rebuild dan redeploy container

---

## 🟢 Prioritas 3 — Polish & Enhancement

> Meningkatkan kualitas pengalaman pengguna. Dikerjakan setelah Prioritas 1 & 2 selesai.

### 3.1 Toast Notification saat Tandai Selesai

**Masalah:** Saat tombol "Tandai Selesai" diklik, tidak ada feedback visual
yang memuaskan selain perubahan warna tombol.

**Solusi:** Tambahkan toast notification kecil di pojok layar:
"✓ Materi ditandai selesai!" yang muncul 2 detik lalu hilang.

---

### 3.2 Carousel "Terakhir Dipelajari" di `/app/learn`

**Masalah:** Fitur ini dihapus karena menyebabkan layout overflow.
Root cause: `flex` container tanpa `max-width` yang proper.

**Solusi yang benar:**
- Gunakan `grid` bukan `flex` untuk carousel
- Atau gunakan library carousel yang sudah handle overflow (Embla, Swiper)
- Batasi jumlah item yang di-render (max 5, bukan semua)

---

### 3.3 Search & Filter di `/app/learn`

**Masalah:** Dengan 9 track, user perlu bisa filter berdasarkan level atau
mencari track tertentu.

**Solusi:** Tambahkan search input dan filter chip di atas track cards.
Filter: Semua | Pemula | Menengah | Lanjutan

---

### 3.4 Progress per Modul di Halaman Track

**Masalah:** Di `/app/learn/[track]`, panel kanan hanya menampilkan progress
keseluruhan track. Tidak ada breakdown per modul.

**Solusi:** Tambahkan mini progress bar per modul di accordion header.

---

### 3.5 Capstone Project per Modul

**Masalah:** Setiap modul di `smauii-dev-content` belum punya lesson capstone
(`99-proyek-*.md`). Format sudah didefinisikan di `CONTRIBUTING.md`.

**Prioritas modul untuk capstone:**
1. `software-engineering/01-git-github` → proyek: setup GitHub profile
2. `software-engineering/04-framework-modern` → proyek: portfolio pribadi
3. `peta-karir/03-freelance-pertama` → proyek: proposal klien pertama

---

## 🔵 Prioritas 4 — Infrastruktur

### 4.1 Monitoring & Alerting

**Masalah:** Tidak ada notifikasi jika container `smauii-lab-app` down.

**Solusi:** Setup Uptime Kuma (sudah ada di Awankinton?) untuk monitor
`https://lab.smauiiyk.sch.id` dan kirim alert ke Telegram jika down.

---

### 4.2 Log Management

**Masalah:** Log container hanya bisa dilihat via `docker logs` — tidak ada
agregasi atau retention policy.

**Solusi:** Tambahkan log rotation di docker-compose:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

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

SLiMS tidak punya data kelas. Akan tersedia di pangkalan data terpusat.

### 5.4 NISN sebagai Identifier

Saat ini menggunakan NIS karena SLiMS tidak punya NISN.
Pangkalan data terpusat akan punya NISN — perlu migrasi field di DB.

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
