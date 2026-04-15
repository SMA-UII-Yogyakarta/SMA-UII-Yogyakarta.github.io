# Panduan Kontribusi — SMAUII Lab

Terima kasih sudah tertarik berkontribusi! Panduan ini menjelaskan cara menambahkan konten, memperbaiki bug, atau mengembangkan fitur baru.

---

## 🎯 Siapa yang bisa berkontribusi?

**Semua orang!** Tidak harus siswa SMA UII.

- **Siswa SMA UII** — tambahkan proyek, profil, atau konten track
- **Alumni** — bagikan pengalaman dan mentor
- **Developer luar** — perbaikan bug, typo, peningkatan UI/UX, atau fitur baru
- **Designer** — saran desain, ilustrasi, atau mockup
- **Writer** — perbaiki dokumentasi atau tulis konten edukatif

**Tidak bisa coding?** Kamu tetap bisa:
- Laporkan bug via [Issues](https://github.com/SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io/issues)
- Usulkan fitur via [Feature Request](https://github.com/SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io/issues/new/choose)
- Perbaiki typo atau dokumentasi

---

## 🚀 Quick Start

### Prasyarat

**Primary (direkomendasikan maintainer):**
- [Bun](https://bun.sh) >= 1.1.0 — install: `curl -fsSL https://bun.sh/install | bash`
- [Node.js](https://nodejs.org) >= 22.12.0 (dibutuhkan oleh Astro)
- [Git](https://git-scm.com)

**Alternatif (jika kamu lebih familiar dengan pnpm):**
- [pnpm](https://pnpm.io) — install: `npm install -g pnpm`
- Semua command `bun` bisa diganti dengan `pnpm` — keduanya didukung

> **Catatan maintainer:** Project ini menggunakan **Bun** sebagai package manager dan runtime utama untuk konsistensi dan performa. Kontributor yang lebih familiar dengan pnpm tetap dipersilakan — `pnpm install` dan `pnpm dev` akan bekerja dengan baik.

### Langkah Setup

```bash
# 1. Fork repo di GitHub (klik tombol Fork di kanan atas)

# 2. Clone fork kamu (ganti USERNAME dengan username GitHub kamu)
git clone https://github.com/USERNAME/SMA-UII-Yogyakarta.github.io.git
cd SMA-UII-Yogyakarta.github.io

# 3. Tambahkan remote upstream (untuk sync dengan repo utama)
git remote add upstream https://github.com/SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io.git

# 4. Install dependencies
bun install          # primary (direkomendasikan)
# atau: pnpm install  # alternatif

# 5. Setup database (development)
bun run db:push
bun run db:seed:enhanced

# 6. Jalankan dev server
bun dev              # primary
# atau: pnpm dev      # alternatif
# Buka http://localhost:4321
```

**Berhasil?** Sekarang kamu siap berkontribusi! 🎉

---

## 📁 Struktur Folder

```
src/
├── layouts/
│   └── Layout.astro        ← Template utama (nav, footer)
├── pages/
│   ├── index.astro         ← Halaman beranda
│   ├── tracks.astro        ← Halaman track minat
│   └── projects.astro      ← Halaman proyek
├── components/             ← Komponen reusable
└── styles/
    └── global.css          ← Global styles

public/
├── CNAME                   ← Custom domain config
├── .nojekyll               ← Disable Jekyll
└── favicon.svg
```

---

## ✏️ Cara Menambahkan Konten

### 1. Tambah Proyek Baru

Edit `src/pages/projects.astro`, tambahkan objek baru di array `projects`:

```js
{
  name: "nama-proyek",
  desc: "Deskripsi singkat proyek (1-2 kalimat).",
  lang: "Python",  // atau JavaScript, Rust, dll
  stars: 0,
  url: "https://github.com/SMA-UII-Yogyakarta/nama-proyek",
  status: "active"  // atau "archived"
}
```

### 2. Tambah Anggota / Profil

Buat file baru di `src/content/members/nama.md`:

```markdown
---
name: Nama Lengkap
role: Siswa / Alumni
class: XII IPA 1  # atau angkatan untuk alumni
tracks: [Robotika/IoT, AI]
github: username
---

Bio singkat (opsional).
```

### 3. Tambah Konten Track

Edit `src/pages/tracks.astro` — tambahkan topik baru di array `topics` track yang relevan.

### 4. Perbaiki Bug atau Typo

Langsung edit file yang bermasalah, lalu commit dengan pesan yang jelas.

---

## 🔧 Workflow Kontribusi

### 1. Buat Branch Baru

```bash
# Pastikan kamu di branch main dan sudah update
git checkout main
git pull upstream main

# Buat branch baru (gunakan nama yang deskriptif)
git checkout -b feat/nama-fitur
# atau
git checkout -b fix/nama-bug
```

### 2. Lakukan Perubahan

Edit file yang diperlukan, lalu test di local:

```bash
bun dev    # Test di browser (atau: pnpm dev)
bun build  # Pastikan build berhasil (atau: pnpm build)
```

### 3. Commit Perubahan

Gunakan [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: tambah proyek robotika line follower"
# atau
git commit -m "fix: perbaiki responsive navbar di mobile"
# atau
git commit -m "docs: update panduan instalasi"
```

**Format commit:**
- `feat:` — fitur baru
- `fix:` — perbaikan bug
- `docs:` — perubahan dokumentasi
- `style:` — perubahan styling (CSS, UI)
- `refactor:` — refactor kode tanpa mengubah fungsionalitas
- `chore:` — perubahan konfigurasi atau maintenance

### 4. Push ke Fork Kamu

```bash
git push origin feat/nama-fitur
```

### 5. Buat Pull Request

1. Buka fork kamu di GitHub
2. Klik tombol **"Compare & pull request"**
3. Isi deskripsi PR dengan jelas:
   - Apa yang diubah?
   - Mengapa perubahan ini diperlukan?
   - Screenshot (jika ada perubahan UI)
4. Submit PR

**Maintainer akan review PR kamu.** Jika ada feedback, lakukan perubahan di branch yang sama dan push lagi — PR akan otomatis update.

---

## 📝 Konvensi Kode

- **Bahasa:** TypeScript untuk logika, Astro untuk template
- **Styling:** Tailwind CSS utility classes (hindari custom CSS kecuali perlu)
- **Format:** Gunakan Prettier (otomatis jika kamu pakai VS Code)
- **Naming:**
  - File: `kebab-case.astro`
  - Component: `PascalCase.astro`
  - Variable: `camelCase`

---

## 🧪 Testing

Sebelum submit PR, pastikan:

```bash
# Build berhasil tanpa error
bun build          # atau: pnpm build

# Preview build
bun run preview    # atau: pnpm preview

# Jalankan unit tests
bun test tests/unit

# Jalankan E2E tests (butuh dev server running di terminal lain)
bun dev            # terminal 1
bun run test:e2e   # terminal 2

# Atau jalankan seluruh CI pipeline secara lokal
bash scripts/ci-local.sh

# Cek di browser:
# - Semua halaman bisa diakses
# - Tidak ada error di console
# - Responsive di mobile (gunakan DevTools)
```

---

## 🚢 Deploy

**Kamu tidak perlu deploy sendiri!**

Deploy dilakukan **manual** oleh maintainer setelah PR di-merge untuk menghindari abuse GitHub Actions.

Maintainer akan run:
```bash
gh workflow run deploy.yml
```

---

## 💡 Tips untuk Kontributor Baru

1. **Mulai dari yang kecil** — perbaiki typo, tambah dokumentasi, atau perbaiki bug kecil
2. **Baca kode yang ada** — lihat bagaimana fitur lain diimplementasikan
3. **Tanya jika bingung** — buka [Issue](https://github.com/SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io/issues) atau mention @sandikodev di PR
4. **Sabar menunggu review** — maintainer akan review secepat mungkin
5. **Jangan takut salah** — semua orang pernah pemula!

---

## 🐛 Melaporkan Bug

Gunakan [Bug Report Template](https://github.com/SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io/issues/new/choose) dan sertakan:
- Halaman yang bermasalah
- Deskripsi bug
- Browser yang digunakan
- Screenshot (jika memungkinkan)

---

## 💬 Pertanyaan?

- **Issue:** [GitHub Issues](https://github.com/SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io/issues)
- **Maintainer:** @sandikodev

---

**Terima kasih sudah berkontribusi! 🙏**
