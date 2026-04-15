# SMAUII Developer Foundation

> Wadah Serius untuk Penggiat Open Source & Developer Muda

[![Deploy](https://github.com/SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io/actions)
[![Tests](https://github.com/SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io/actions/workflows/test.yml/badge.svg)](https://github.com/SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io/actions/workflows/test.yml)
[![Astro](https://img.shields.io/badge/Astro-6.x-orange?logo=astro)](https://astro.build)
[![Bun](https://img.shields.io/badge/Bun-1.1+-black?logo=bun)](https://bun.sh)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**🌐 Live:** https://lab.smauiiyk.sch.id

---

## Tentang

**SMAUII Developer Foundation** adalah wadah bagi siswa SMA UII Yogyakarta yang **benar-benar berkomitmen** menekuni teknologi. Bukan sekadar ekstrakurikuler — ini adalah **komunitas serius** untuk mempersiapkan siswa ke:

- 🏆 **Olimpiade** — OPSI, OSN, IOI, CTF, Kaggle
- 🎓 **Perguruan Tinggi Top** — dengan portofolio nyata
- 🌍 **Open Source Global** — kontribusi ke proyek dunia
- 💼 **Karir Teknologi** — skill yang relevan dengan industri

**Filosofi lengkap:** [PHILOSOPHY.md](PHILOSOPHY.md)

---

## Track Minat

- 🤖 **Robotika/IoT** — Arduino, ESP32, ROS, kompetisi robot
- 🧠 **AI (Kecerdasan Buatan)** — ML, DL, computer vision, NLP
- 📊 **Data Science** — Analisis data, visualisasi, statistical modeling
- 🌐 **Jaringan Komputer** — Infrastructure, server, cloud computing
- 🔐 **Keamanan Siber** — Ethical hacking, CTF, bug bounty
- 💻 **Software Engineering** — Web, mobile, open source contribution

**Detail track:** [Halaman Tracks](https://lab.smauiiyk.sch.id/tracks)

---

## Prinsip Inti

### 1. Open Source First
Semua proyek terbuka di GitHub. Transparansi, kolaborasi, dan kontribusi ke komunitas global.

### 2. Learning by Building
Tidak ada teori tanpa praktik. Proyek nyata, kompetisi, dan kontribusi open source.

### 3. Komunitas, Bukan Kelas
Peer learning, mentorship dari alumni, kolaborasi lintas track.

### 4. Komitmen > Bakat
Kami mencari siswa yang konsisten, curious, collaborative, dan persistent.

---

## Untuk Siswa

**Ingin bergabung?**

1. Pilih track yang sesuai passion-mu
2. Mulai dari proyek kecil atau kontribusi dokumentasi
3. Hadir di pertemuan rutin
4. Konsisten berkontribusi

**Yang akan kamu dapatkan:**
- Mentor dari alumni & praktisi
- Persiapan kompetisi (OPSI, OSN, CTF, dll)
- Portofolio untuk universitas/industri
- Networking dengan komunitas developer

**Ekspektasi:**
- Hadir di pertemuan rutin
- Kontribusi minimal 1 proyek per semester
- Dokumentasi pembelajaran
- Membantu sesama anggota

---

## Untuk Alumni

**Ingin berkontribusi?**

- Jadi mentor untuk track tertentu
- Code review untuk proyek siswa
- Sharing session tentang kuliah/industri
- Koneksi ke peluang (internship, kompetisi)

Hubungi: @sandikodev

---

## Stack

- **Framework:** [Astro](https://astro.build) 6.x — SSR mode
- **UI:** React 19 (interactive islands), Tailwind CSS v4
- **Database:** [Turso](https://turso.tech) (libSQL/SQLite) via Drizzle ORM
- **Auth:** Lucia v3 + GitHub OAuth (Arctic) + Argon2
- **Runtime:** [Bun](https://bun.sh) >= 1.1.0 (primary), Node.js >= 22.12.0
- **Package manager:** Bun (primary) — pnpm juga didukung untuk kontributor
- **Testing:** Bun test (unit) + Playwright (E2E)
- **CI/CD:** GitHub Actions

## Development

```bash
# Clone
git clone https://github.com/SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io.git
cd SMA-UII-Yogyakarta.github.io

# Install dependencies
bun install          # primary (direkomendasikan)
# atau: pnpm install  # alternatif untuk kontributor

# Setup database (development — pakai smauiilab-prev)
bun run db:push
bun run db:seed:enhanced

# Dev server
bun dev              # atau: pnpm dev
# Buka http://localhost:4321

# Build
bun build            # atau: pnpm build

# Preview build
bun run preview      # atau: pnpm preview

# Tests
bun test tests/unit  # unit tests
bun run test:e2e     # E2E tests (butuh dev server running)
bash scripts/ci-local.sh  # seluruh CI pipeline lokal
```

> **Catatan:** Project ini menggunakan **Bun** sebagai runtime dan package manager utama. Kontributor yang lebih familiar dengan **pnpm** tetap dipersilakan — semua command `pnpm` bekerja dengan baik.

## Deploy

Deploy dilakukan **manual** untuk menghindari penggunaan GitHub Actions yang berlebihan.

**Untuk maintainer:**

Via GitHub UI:
```
Actions → Deploy to GitHub Pages → Run workflow → Run workflow
```

Via CLI:
```bash
gh workflow run deploy.yml
```

**Untuk kontributor:** Kamu tidak perlu deploy sendiri — fokus saja pada PR. Maintainer akan deploy setelah PR di-merge.

## Kontribusi

Lihat [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan lengkap.

**Cara cepat berkontribusi:**
1. Fork repo ini
2. Buat branch: `git checkout -b feat/nama-fitur`
3. Commit: `git commit -m "feat: deskripsi"`
4. Push dan buat Pull Request

**Semua orang bisa berkontribusi!** Tidak harus siswa SMA UII. Lihat [Code of Conduct](CODE_OF_CONDUCT.md).

## Keamanan

Jika menemukan kerentanan keamanan, jangan buat issue publik. Lihat [SECURITY.md](SECURITY.md) untuk cara melaporkan.

## Lisensi

MIT — lihat [LICENSE](LICENSE)

---

**SMAUII Developer Foundation** — Membangun masa depan teknologi Indonesia, satu commit pada satu waktu.
