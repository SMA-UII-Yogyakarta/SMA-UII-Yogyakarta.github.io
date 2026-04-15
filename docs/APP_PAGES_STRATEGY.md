# Strategi Konsistensi Halaman /app

## Peta Halaman per Pengguna

### Maintainer
| Halaman | Akses | Tipe Konten |
|---|---|---|
| `/app/overview` | ✅ | Dashboard: stats, pending approvals, announcements |
| `/app/members` | ✅ | Data table: list semua anggota + filter + approve/reject |
| `/app/projects` | ✅ | Gallery grid: semua proyek semua anggota |
| `/app/activities` | ✅ | Feed: semua aktivitas semua anggota |
| `/app/announcements` | ✅ | Feed: buat & lihat pengumuman |
| `/app/settings` | ✅ | Form: akun + set password anggota |
| `/app/profile` | ❌ redirect → overview | (tidak relevan untuk maintainer) |
| `/app/card` | ❌ redirect → overview | (tidak relevan untuk maintainer) |

### Member (active)
| Halaman | Akses | Tipe Konten |
|---|---|---|
| `/app/overview` | ✅ | Dashboard: status akun, quick links |
| `/app/profile` | ✅ | Detail: info pribadi + tracks + card link |
| `/app/card` | ✅ | Visual: kartu anggota + QR code |
| `/app/projects` | ✅ | Gallery grid: proyek sendiri + tambah |
| `/app/activities` | ✅ | Feed: aktivitas sendiri + log baru |
| `/app/members` | ❌ redirect → overview | (maintainer only) |
| `/app/announcements` | ❌ redirect → overview | (maintainer only) |
| `/app/settings` | ❌ redirect → overview | (maintainer only) |

---

## Masalah Konsistensi Saat Ini

### 1. Guard tidak lengkap
- `profile` dan `card` tidak punya guard untuk maintainer → maintainer bisa akses tapi tidak relevan
- `activities` dan `projects` tidak punya guard role → maintainer lihat semua, member lihat milik sendiri (sudah benar di API, tapi tidak ada feedback di UI)

### 2. Pola layout tidak konsisten
Saat ini ada 3 pola berbeda:

**Pola A — Pure SSR** (settings, profile, card):
```
Frontmatter query DB → render HTML langsung
Tidak ada loading state
```

**Pola B — Client fetch dengan header statis** (activities, projects, announcements):
```
Header (tombol aksi) di HTML statis
List/grid di-render JS setelah fetch
Skeleton loading saat fetch
```

**Pola C — Full client render** (members, overview):
```
Seluruh konten di-render JS
Skeleton loading saat fetch
```

**Target:** Semua halaman pakai **Pola B** atau **Pola A** — tidak ada Pola C.
- Overview → Pola C saat ini, idealnya Pola A (data dari server) atau tetap C tapi dengan skeleton yang lebih baik
- Members → Pola C, bisa tetap karena data besar dan perlu filter dinamis

### 3. Page header tidak konsisten
- Activities, projects, announcements: subtitle di bawah topbar title ✅
- Members: tidak ada subtitle, header di-render JS ❌
- Overview: greeting personal di dalam konten JS ❌
- Profile, card, settings: tidak ada subtitle ❌

### 4. Action button placement tidak konsisten
- Activities, projects, announcements: tombol di kanan atas HTML statis ✅
- Members: tombol di dalam JS render ❌
- Overview: tidak ada action button ✅ (benar)

---

## Strategi Perbaikan

### Klasifikasi Tipe Halaman

**Tipe 1 — Dashboard/Overview** (`overview`)
- Greeting personal
- Widget/card ringkasan
- Tidak ada action button utama
- Data dari server (SSR) atau client fetch dengan skeleton

**Tipe 2 — Data Table** (`members`)
- Filter bar di atas
- Table/list rows
- Action per row (approve/reject)
- Pagination
- Tidak ada "Add" button (data dari registrasi)

**Tipe 3 — Content Feed** (`activities`, `announcements`)
- Subtitle deskriptif
- Action button "Tambah" di kanan atas (jika punya akses)
- List chronological
- Modal untuk tambah

**Tipe 4 — Gallery** (`projects`)
- Subtitle deskriptif
- Action button "Tambah" di kanan atas (jika active)
- Grid cards
- Modal untuk tambah

**Tipe 5 — Detail/Profile** (`profile`, `card`)
- Tidak ada action button utama di header
- Layout 2-3 kolom
- Data statis dari server
- Edit inline atau link ke settings

**Tipe 6 — Settings/Form** (`settings`)
- Layout 2-3 kolom
- Form sections
- Save per section

---

## Standar Layout per Tipe

### Header Area (di bawah topbar, sebelum konten)
```
Tipe 1: [tidak ada — greeting ada di dalam konten]
Tipe 2: [Filter bar + search]
Tipe 3: [subtitle]                    [+ Tambah button]
Tipe 4: [subtitle]                    [+ Tambah button]
Tipe 5: [tidak ada]
Tipe 6: [tidak ada]
```

### Guard Matrix
```
Halaman        | !user | pending | inactive | member | maintainer
overview       | /login| /check  | /login   | ✅     | ✅
members        | /login| /check  | /login   | /over  | ✅
announcements  | /login| /check  | /login   | /over  | ✅
settings       | /login| /check  | /login   | /over  | ✅
profile        | /login| /check  | /login   | ✅     | /over
card           | /login| /check  | /login   | ✅     | /over
activities     | /login| /check  | /login   | ✅     | ✅
projects       | /login| /check  | /login   | ✅     | ✅
```

---

## Checklist Pengerjaan

### Prioritas Tinggi
- [ ] Tambah guard maintainer → `/app/overview` di `profile` dan `card`
- [ ] Pindahkan header members dari JS ke HTML statis (filter bar + judul)
- [ ] Pindahkan greeting overview dari JS ke SSR (sudah ada `data-*`, tinggal pindah ke template)

### Prioritas Sedang
- [ ] Tambah subtitle di profile dan card
- [ ] Standarisasi empty state di semua halaman (teks + ilustrasi konsisten)
- [ ] Standarisasi error state

### Prioritas Rendah
- [ ] Pagination di members
- [ ] Filter di activities (by type, by date)
- [ ] Search di projects

---

*Update: 2026-04-15*
