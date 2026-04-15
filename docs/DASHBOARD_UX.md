# Strategi UI/UX Dashboard — Audit & Penyempurnaan

## Kondisi Saat Ini

### Masalah yang Ditemukan

**1. Duplikasi logika sidebar**
- `Sidebar.astro` punya script sendiri untuk toggle state
- `DashboardLayout.astro` punya `initDashboard()` yang juga handle sidebar via `dashboard-init.ts`
- Dua script jalan bersamaan → konflik potensial

**2. Topbar tidak informatif**
- Hanya tampilkan nama halaman + nama user
- Tidak ada breadcrumb, tidak ada konteks role
- "← Back to Site" tersembunyi di mobile, tidak perlu ada di setiap halaman

**3. Pola halaman tidak konsisten**
- `overview.astro` — data dari server via `data-*` attribute, render client-side
- `settings.astro` — pure SSR, render server-side (paling benar)
- `projects.astro`, `activities.astro` — fetch API client-side setelah load
- `profile.astro`, `card.astro` — fetch `/api/profile` client-side
- `members.astro`, `announcements.astro` — fetch API client-side
- Semua masih punya loading spinner `⏳` yang muncul sebelum data datang

**4. Redundansi heading**
- Setiap halaman render `<h1>` di dalam konten
- Topbar sudah tampilkan nama halaman → double title
- Ruang vertikal terbuang

**5. Sidebar user section**
- Avatar, nama, email, logout — terlalu banyak info di area kecil
- Collapsed state tidak elegant

---

## Strategi Penyempurnaan

### A. Unifikasi Sidebar Logic

Hapus script di `Sidebar.astro`, biarkan `dashboard-init.ts` yang handle semua interaksi sidebar. Sidebar hanya render HTML statis.

```
Sidebar.astro  → pure HTML, no script
dashboard-init.ts → satu-satunya controller sidebar
```

### B. Topbar — Lebih Kontekstual

Tambahkan:
- Badge role (maintainer/member) di sebelah nama
- Hapus "← Back to Site" (ada di sidebar logo)
- Tambahkan avatar initial user

```
[☰] [Page Title]          [🔔] [M] Sandikodev ▾
```

### C. Pola Halaman — Standarisasi

**Target pola untuk semua halaman:**

```astro
---
// 1. Guard server-side
// 2. Ambil data yang bisa diambil server-side
// 3. Pass ke template
---

<DashboardLayout title="...">
  <!-- Tidak ada h1 redundan — title sudah di topbar -->
  <!-- Konten langsung, tidak ada loading spinner untuk data kritis -->
  <!-- Fetch client-side hanya untuk data yang benar-benar dinamis -->
</DashboardLayout>
```

**Klasifikasi data per halaman:**

| Halaman | Data Server-side | Data Client-side |
|---|---|---|
| overview | user (role, name, status) | stats, announcements, pending |
| profile | user lengkap + tracks + card | - (semua dari server) |
| card | user + card data | - |
| members | - | list members (paginated) |
| projects | canAdd, isAdmin | list projects |
| activities | canLog, isAdmin | list activities |
| announcements | - | list announcements |
| settings | user data | - |

### D. Hapus Heading Redundan

Topbar sudah tampilkan nama halaman. Hapus `<h1>` di dalam konten halaman, kecuali overview yang punya greeting personal ("Halo, Sandikodev!").

Hemat ~40px ruang vertikal per halaman.

### E. Loading State — Skeleton bukan Spinner

Ganti `⏳ Loading...` dengan skeleton placeholder yang sesuai bentuk konten:

```html
<!-- Bukan ini -->
<div class="text-center py-12">⏳ Loading...</div>

<!-- Tapi ini -->
<div class="space-y-3">
  <div class="h-16 bg-gray-800 rounded-xl animate-pulse"></div>
  <div class="h-16 bg-gray-800 rounded-xl animate-pulse"></div>
</div>
```

### F. Sidebar Collapsed — Icon Mode

Saat collapsed (64px), sidebar hanya tampilkan icon. Tambahkan tooltip on hover untuk label.

---

## Urutan Pengerjaan

### Fase A — Quick wins (tidak breaking)
1. Hapus script duplikat di `Sidebar.astro`
2. Perbaiki Topbar: tambah role badge + avatar
3. Hapus `<h1>` redundan di halaman yang tidak perlu greeting

### Fase B — Data ke server-side
4. `profile.astro` — ambil data dari server, hapus client fetch
5. `card.astro` — sama
6. `settings.astro` — sudah benar ✓

### Fase C — Skeleton loading
7. Ganti semua `⏳ Loading...` dengan skeleton yang sesuai

### Fase D — Konsistensi layout
8. Standarisasi padding, heading hierarchy, action button placement

---

## Prinsip Layout

```
Topbar (sticky, 56px)
├── [mobile menu] [Page Title]     [notif] [user avatar + name]
│
Sidebar (fixed, 256px / 64px collapsed)
├── Logo + toggle
├── Nav items (icon + label)
└── User (avatar + name + logout)

Content area (flex-1, padding 16px)
├── Tidak ada h1 kecuali greeting personal
├── Action button di kanan atas konten (bukan di heading)
└── Grid/list konten
```

---

*Dokumen ini adalah panduan pengerjaan bertahap. Update sesuai progress.*
