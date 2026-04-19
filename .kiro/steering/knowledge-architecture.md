# Knowledge Architecture — Apa yang Masuk Repo dan Mengapa

Dokumen ini menjelaskan filosofi, struktur, dan alur kerja pengelolaan pengetahuan
di proyek Digital Lab SMA UII. Ini adalah panduan untuk Kiro maupun kontributor
manusia dalam memutuskan di mana sesuatu harus disimpan.

---

## Filosofi Dasar

Repo bukan tempat menyimpan semua hal. Repo adalah tempat menyimpan hal-hal yang
memenuhi setidaknya satu dari kriteria berikut:

1. **Reproducibility** — orang lain butuh ini untuk menjalankan atau memahami proyek
2. **Accountability** — perlu ada jejak siapa yang memutuskan apa dan kapan
3. **Collaboration** — tim lain perlu membaca atau berkontribusi ke ini
4. **Automation** — CI/CD atau tooling membutuhkan ini untuk berjalan

Jika sesuatu tidak memenuhi satu pun dari empat kriteria di atas, ia tidak perlu
masuk repo. Memasukkan terlalu banyak hal ke repo menciptakan noise, membebani
git history, dan membuat kontributor baru kesulitan memahami mana yang penting.

---

## Struktur Pengetahuan Proyek

```
smauii-dev-foundation/
│
├── src/                        ← KODE (selalu masuk repo)
├── public/                     ← ASET STATIS (masuk repo)
├── astro.config.mjs            ← KONFIGURASI (masuk repo)
│
├── docs/                       ← DOKUMENTASI UNTUK TIM/MANUSIA
│   ├── BACKLOG.md              ← daftar pekerjaan, prioritas
│   ├── DEPLOYMENT_AWANKINTON.md← panduan deploy infrastruktur
│   ├── ARCHITECTURE.md         ← arsitektur sistem
│   ├── CI_CD_GUIDE.md          ← panduan CI/CD lengkap
│   ├── WORKFLOW.md             ← alur kerja development
│   └── ...
│
├── .kiro/                      ← KONTEKS DAN INSTRUKSI UNTUK KIRO
│   ├── steering/               ← rules permanen, dibaca setiap sesi
│   │   ├── product.md          ← apa produk ini, siapa penggunanya
│   │   ├── tech.md             ← stack teknologi, versi, konvensi
│   │   ├── dev-workflow.md     ← alur kerja harian, checklist
│   │   ├── ui-patterns.md      ← pola UI yang sudah disepakati
│   │   ├── api-patterns.md     ← pola API endpoint
│   │   ├── database-schema.md  ← skema DB, relasi, konvensi
│   │   ├── auth-guards.md      ← aturan auth per halaman
│   │   ├── security.md         ← aturan keamanan
│   │   └── ...
│   │
│   ├── specs/                  ← SPECS TEKNIS PER FITUR
│   │   └── (dibuat saat fitur akan dikerjakan)
│   │
│   └── hooks/                  ← AUTOMATION KIRO
│       └── (trigger saat event tertentu)
│
└── .gitignore                  ← ideas/, .env, *.db, dll
```

---

## Penjelasan Per Layer

### `src/` — Kode

Yang paling jelas. Semua kode aplikasi masuk repo. Tanpa ini, proyek tidak bisa
dijalankan oleh siapapun.

---

### `docs/` — Dokumentasi untuk Tim dan Manusia

`docs/` adalah output dokumentasi yang sudah **final dan stabil**. Isinya adalah
hal-hal yang perlu dibaca oleh manusia — developer baru, maintainer, atau siapapun
yang ingin memahami atau menjalankan sistem ini.

**Yang masuk `docs/`:**
- Panduan deployment dan infrastruktur
- Arsitektur sistem dan keputusan teknis besar
- Backlog dan roadmap
- Panduan CI/CD dan workflow
- Catatan integrasi dengan sistem eksternal (SLiMS, Turso, dll)

**Yang TIDAK masuk `docs/`:**
- Draft atau ide yang belum matang
- Specs teknis per fitur (itu milik `.kiro/specs/`)
- Instruksi khusus untuk Kiro (itu milik `.kiro/steering/`)

**Prinsip:** Jika seseorang yang baru bergabung ke tim membuka `docs/`, semua
yang ada di sana harus relevan, akurat, dan berguna. Tidak ada dead files.

---

### `.kiro/steering/` — Rules Permanen untuk Kiro

Steering adalah "constitution" proyek — aturan, konvensi, dan konteks yang harus
selalu diikuti Kiro di setiap sesi, tanpa perlu dijelaskan ulang.

Steering dibaca otomatis oleh Kiro di awal setiap sesi. Ini adalah memori jangka
panjang proyek yang tidak boleh hilang.

**Yang masuk steering:**
- Konvensi penamaan file, variabel, komponen
- Pola yang sudah disepakati (UI patterns, API patterns)
- Aturan keamanan yang tidak boleh dilanggar
- Konteks produk — siapa penggunanya, apa tujuannya
- Alur kerja development yang harus diikuti
- Known issues yang perlu dihindari

**Prinsip:** Steering adalah rules, bukan dokumentasi. Setiap kalimat di steering
harus actionable — Kiro harus bisa langsung mengikutinya tanpa interpretasi.

---

### `.kiro/specs/` — Specs Teknis Per Fitur

Specs adalah kontrak antara requirement dan implementasi. Setiap fitur yang akan
dikerjakan harus punya specs sebelum kode ditulis.

Specs dibuat melalui proses: brainstorming (di luar repo) → narasi matang →
specs teknis di `.kiro/specs/`.

**Struktur specs yang baik:**
```markdown
# Nama Fitur

## Konteks
Mengapa fitur ini dibutuhkan. Masalah apa yang dipecahkan.

## Acceptance Criteria
- [ ] Kriteria yang harus terpenuhi agar fitur dianggap selesai
- [ ] Ditulis dari perspektif pengguna, bukan implementasi

## Technical Design
Bagaimana fitur ini akan diimplementasi. File mana yang perlu diubah.
Pendekatan teknis yang dipilih dan alasannya.

## Tasks
- [ ] Task 1 yang konkret dan bisa dikerjakan
- [ ] Task 2
- [ ] Task 3

## Out of Scope
Apa yang TIDAK termasuk dalam fitur ini.
```

**Prinsip:** Specs adalah output matang dari brainstorming. Bukan draft, bukan
catatan mentah. Jika specs belum cukup jelas untuk dikerjakan, ia belum siap
masuk ke `.kiro/specs/`.

---

### `.kiro/hooks/` — Automation Kiro

Hooks adalah instruksi yang dijalankan Kiro secara otomatis saat event tertentu
terjadi — misalnya saat file disimpan, saat sesi berakhir, atau saat ada perubahan
di file tertentu.

Hooks masuk repo karena mereka adalah bagian dari developer experience yang harus
konsisten untuk semua kontributor yang menggunakan Kiro.

---

### `ideas/` — Brainstorming (TIDAK masuk repo)

`ideas/` adalah ruang kolaborasi antara operator (manusia) dan Kiro untuk
mengeksplorasi ide sebelum ide tersebut cukup matang untuk dijadikan specs.

**Mengapa TIDAK masuk repo:**

Brainstorming adalah proses, bukan output. Repo adalah tempat output. Memasukkan
proses ke repo menciptakan beberapa masalah:

1. **Noise di git history** — commit "draft ide yang belum jadi" mencemari history
   yang seharusnya berisi perubahan bermakna

2. **Dead files** — ide yang tidak jadi diimplementasi akan menumpuk sebagai file
   yang tidak jelas statusnya. Dalam 6 bulan, tidak ada yang tahu mana yang masih
   relevan

3. **Tekanan untuk "merapikan"** — jika brainstorming masuk repo, ada tekanan
   implisit untuk menulis dengan rapi sebelum commit. Ini membunuh spontanitas
   dan kejujuran dalam eksplorasi ide

4. **Tidak memenuhi kriteria repo** — brainstorming tidak dibutuhkan untuk
   menjalankan proyek (bukan reproducibility), tidak perlu dibaca tim lain
   (bukan collaboration dalam arti yang berguna), dan tidak dibutuhkan automation

**Apa yang terjadi dengan ideas:**

Ideas hidup di luar repo — bisa di Obsidian, Notion, file lokal, atau bahkan
percakapan langsung. Yang penting adalah **output matangnya** yang masuk ke
`.kiro/specs/`, bukan prosesnya.

```
Brainstorming (ideas/ — lokal, di-gitignore)
    ↓
    Diskusi operator↔Kiro hingga narasi matang
    ↓
.kiro/specs/nama-fitur.md  ← masuk repo
    ↓
Implementasi di src/
    ↓
Dokumentasi final di docs/ (jika perlu)
```

**Tambahkan ke `.gitignore`:**
```
ideas/
```

---

## Alur Kerja Lengkap: Dari Ide ke Kode

### Fase 1 — Eksplorasi (di luar repo)

Operator dan Kiro berdiskusi secara bebas. Tidak ada format yang harus diikuti.
Pertanyaan yang dijawab di fase ini:
- Apa masalah yang ingin dipecahkan?
- Siapa yang terdampak?
- Apa solusi yang mungkin?
- Apa tradeoff dari setiap solusi?
- Pendekatan mana yang paling tepat untuk konteks ini?

Output fase ini: narasi yang cukup jelas untuk diterjemahkan ke specs teknis.

### Fase 2 — Specs (masuk repo di `.kiro/specs/`)

Kiro menerjemahkan narasi matang dari fase 1 menjadi specs teknis yang konkret.
Specs harus cukup detail sehingga bisa dikerjakan tanpa perlu diskusi tambahan.

Operator mereview specs dan memberikan approval sebelum implementasi dimulai.

### Fase 3 — Implementasi (masuk repo di `src/`)

Kiro mengerjakan implementasi berdasarkan specs. Setiap perubahan kode harus
bisa ditelusuri ke specs yang relevan.

### Fase 4 — Dokumentasi (masuk repo di `docs/` jika perlu)

Jika fitur yang diimplementasi memerlukan dokumentasi untuk tim (misalnya
perubahan deployment, perubahan arsitektur, atau panduan baru), dokumentasi
dibuat di `docs/`.

Tidak semua fitur perlu dokumentasi di `docs/`. Fitur UI biasa tidak perlu.
Perubahan infrastruktur atau arsitektur perlu.

---

## Ringkasan Keputusan

| Artefak | Lokasi | Masuk Repo | Alasan |
|---------|--------|-----------|--------|
| Kode aplikasi | `src/` | ✅ Ya | Reproducibility |
| Aset statis | `public/` | ✅ Ya | Reproducibility |
| Konfigurasi | `*.config.*` | ✅ Ya | Reproducibility |
| Panduan tim | `docs/` | ✅ Ya | Collaboration |
| Rules Kiro | `.kiro/steering/` | ✅ Ya | Automation + Accountability |
| Specs fitur | `.kiro/specs/` | ✅ Ya | Accountability + Automation |
| Hooks Kiro | `.kiro/hooks/` | ✅ Ya | Automation |
| Brainstorming | `ideas/` (lokal) | ❌ Tidak | Proses, bukan output |
| Secrets | `.env*` | ❌ Tidak | Keamanan |
| Database lokal | `*.db` | ❌ Tidak | Data lokal |
| Build output | `dist/` | ❌ Tidak | Generated |

---

## Catatan untuk Kiro

Saat diminta membuat dokumentasi atau specs:

1. **Tanya dulu:** apakah ini untuk manusia (→ `docs/`) atau untuk Kiro (→ `.kiro/`)
2. **Specs fitur** selalu masuk `.kiro/specs/`, bukan `docs/`
3. **Jangan buat file baru** jika informasi bisa ditambahkan ke file yang sudah ada
4. **Jangan commit docs** sebagai commit tersendiri — commit docs bersamaan dengan
   perubahan kode yang relevan, atau saat ada perubahan signifikan pada docs itu sendiri
5. **Brainstorming** tidak perlu di-commit — cukup diskusikan, lalu output matangnya
   yang masuk ke specs
