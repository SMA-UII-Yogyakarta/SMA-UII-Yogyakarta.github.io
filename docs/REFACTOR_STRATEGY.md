# Strategi Refaktor Dashboard — Komprehensif

> Versi 2 — setelah audit menyeluruh semua halaman
> Update: 2026-04-15

---

## Audit Kondisi Saat Ini

### Duplikasi Kode yang Ditemukan

**1. `esc()` function — ada di 5 file berbeda**
```
overview.astro    → esc()
members.astro     → esc()
activities.astro  → esc()
projects.astro    → esc()
announcements.astro → esc()
```
Solusi: ekstrak ke `src/lib/client-utils.ts` yang di-import sebagai module.

**2. `fmtDate()` — ada di 4 file**
```
profile.astro     → fmtDate() (server-side TS)
card.astro        → fmtDate() (server-side TS)
activities.astro  → fmtDate() (client JS)
announcements.astro → fmtDate() (client JS)
```
Solusi: satu helper di `src/lib/format.ts` untuk server-side, satu di client utils untuk client-side.

**3. Modal pattern — copy-paste di 3 file**
```
activities.astro  → modal + form + open/close handlers
projects.astro    → modal + form + open/close handlers
announcements.astro → modal + form + open/close handlers
```
Pola identik: `open-modal` button → `add-modal` div → form → `close-modal` button.
Solusi: komponen `Modal.astro` yang reusable.

**4. Guard pattern — copy-paste di setiap halaman**
```
if (!user) return Astro.redirect('/login');
if (user.status === 'pending') return Astro.redirect(`/check-status?nisn=${user.nisn}`);
if (user.status === 'inactive') return Astro.redirect('/login?error=inactive');
```
Solusi: helper function `requireAuth()` dan `requireMaintainer()` di `src/lib/guards.ts`.

**5. Skeleton loading — copy-paste dengan variasi minor**
Solusi: komponen `Skeleton.astro` dengan props untuk tipe (rows/grid/cards).

**6. `statusColors` object — duplikat di members dan overview**
Solusi: konstanta di `src/lib/constants.ts`.

**7. API fetch + render pattern — identik di activities, projects, announcements**
```js
async function load() {
  const res = await fetch('/api/...');
  const json = await res.json();
  const data = json.data || [];
  el.innerHTML = data.map(item => `...`).join('');
}
```
Solusi: tidak perlu abstraksi JS (terlalu dinamis), tapi standarisasi struktur.

---

## Masalah Konsistensi Layout

### Header area tidak seragam

| Halaman | Subtitle | Action button | Posisi |
|---|---|---|---|
| activities | ✅ teks deskriptif | ✅ kanan atas | Konsisten |
| projects | ✅ teks deskriptif | ✅ kanan atas | Konsisten |
| announcements | ✅ teks deskriptif | ✅ kanan atas | Konsisten |
| members | ❌ tidak ada | ❌ tidak ada | Perlu subtitle |
| overview | ✅ greeting SSR | ❌ tidak ada | Benar (no action) |
| profile | ❌ tidak ada | ❌ tidak ada | Perlu subtitle |
| card | ❌ tidak ada | ❌ tidak ada | Perlu subtitle |
| settings | ❌ tidak ada | ❌ tidak ada | Perlu subtitle |

### Empty state tidak konsisten

| Halaman | Empty state |
|---|---|
| activities | `<div class="text-center py-8 text-gray-500 text-sm">` |
| projects | `<div class="col-span-full text-center py-12 text-gray-500">` |
| announcements | `<div class="text-center py-8 text-gray-500 text-sm">` |
| members | `<p class="text-gray-500 text-center py-8 text-sm">` |

Berbeda padding, berbeda tag. Perlu standar.

### Input/form styling tidak konsisten

Settings pakai `px-4 py-2`, modal pakai `px-3 py-2`. Perlu satu standar.

---

## Arsitektur Target

### Struktur File Baru

```
src/
├── lib/
│   ├── guards.ts          ← NEW: requireAuth, requireMaintainer
│   ├── format.ts          ← NEW: fmtDate (server-side)
│   ├── constants.ts       ← NEW: statusColors, typeColors
│   ├── api-utils.ts       ← existing
│   ├── auth.ts            ← existing
│   ├── nav.ts             ← existing
│   └── validation.ts      ← existing
├── components/
│   ├── app/               ← NEW directory
│   │   ├── PageHeader.astro    ← subtitle + optional action button
│   │   ├── Modal.astro         ← reusable modal wrapper
│   │   ├── EmptyState.astro    ← consistent empty state
│   │   └── SkeletonList.astro  ← skeleton rows
│   ├── Sidebar.astro      ← existing
│   └── Topbar.astro       ← existing
└── pages/app/
    ├── overview.astro
    ├── members.astro
    ├── profile.astro
    ├── card.astro
    ├── activities.astro
    ├── projects.astro
    ├── announcements.astro
    └── settings.astro
```

---

## Komponen Baru yang Dibutuhkan

### 1. `src/lib/guards.ts`
```ts
// Mengganti copy-paste guard di setiap halaman
export function requireAuth(user, nisn) { ... }
export function requireMaintainer(user) { ... }
export function requireMember(user) { ... }
```

### 2. `src/lib/format.ts`
```ts
// Server-side formatting
export function fmtDate(ts: number | null, opts?): string
export function fmtDateShort(ts: number | null): string
```

### 3. `src/lib/constants.ts`
```ts
export const STATUS_COLORS = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  active: 'text-green-400 bg-green-400/10',
  rejected: 'text-red-400 bg-red-400/10',
  inactive: 'text-gray-400 bg-gray-400/10',
}

export const ACTIVITY_TYPE_COLORS = {
  contribution: 'bg-purple-500/20 text-purple-400',
  event: 'bg-blue-500/20 text-blue-400',
  workshop: 'bg-green-500/20 text-green-400',
  meeting: 'bg-yellow-500/20 text-yellow-400',
  other: 'bg-gray-500/20 text-gray-400',
}
```

### 4. `src/components/app/PageHeader.astro`
```astro
---
interface Props {
  subtitle?: string;
  actionLabel?: string;
  actionId?: string;  // id untuk button yang di-trigger JS
}
---
<div class="flex justify-between items-center mb-4">
  {subtitle && <p class="text-gray-400 text-sm">{subtitle}</p>}
  {actionLabel && (
    <button id={actionId} class="...">+ {actionLabel}</button>
  )}
</div>
```

### 5. `src/components/app/Modal.astro`
```astro
---
interface Props {
  id: string;
  title: string;
  closeId?: string;
}
---
<div id={id} class="hidden fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
  <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
    <h2 class="text-lg font-bold mb-4">{title}</h2>
    <slot />
    <button id={closeId || `${id}-close`} class="...">Batal</button>
  </div>
</div>
```

### 6. `src/components/app/EmptyState.astro`
```astro
---
interface Props {
  message: string;
  icon?: string;
}
---
<div class="text-center py-10 text-gray-500 text-sm">{message}</div>
```

### 7. `src/components/app/SkeletonList.astro`
```astro
---
interface Props {
  count?: number;
  type?: 'rows' | 'cards' | 'grid'
}
---
```

---

## Standar Layout per Tipe Halaman

### Tipe A — Dashboard (overview)
```
[Greeting SSR]
[Dynamic content area dengan skeleton]
```
- Greeting di SSR, konten dinamis di client
- Tidak ada action button di header
- Skeleton sesuai layout konten

### Tipe B — Data Table (members)
```
[Filter bar + search — HTML statis]
[List area dengan skeleton]
```
- Filter/search di HTML statis
- List di-render JS
- Tidak ada "Add" button

### Tipe C — Content Feed (activities, announcements)
```
[PageHeader: subtitle + action button]
[List area dengan skeleton]
[Modal]
```
- Header statis
- List dinamis
- Modal untuk tambah

### Tipe D — Gallery (projects)
```
[PageHeader: subtitle + action button]
[Grid area dengan skeleton]
[Modal]
```
- Header statis
- Grid dinamis
- Modal untuk tambah

### Tipe E — Detail/Profile (profile, card)
```
[Konten SSR langsung — tidak ada loading]
```
- Pure SSR
- Tidak ada action button di header
- Layout multi-kolom

### Tipe F — Settings/Form (settings)
```
[Grid form sections — SSR]
```
- Pure SSR
- Form sections
- Save per section dengan feedback inline

---

## Standar Input/Form

Satu standar untuk semua form:
```html
<!-- Label -->
<label class="block text-xs text-gray-400 mb-1">Label *</label>

<!-- Input -->
<input class="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm 
              focus:outline-none focus:border-blue-500 text-gray-100">

<!-- Textarea -->
<textarea class="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm 
                 focus:outline-none focus:border-blue-500 text-gray-100">

<!-- Select -->
<select class="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm 
               focus:outline-none focus:border-blue-500 text-gray-100">
```

Settings saat ini pakai `px-4 py-2` — perlu diseragamkan ke `px-3 py-2`.

---

## Standar Empty State

```html
<div class="text-center py-10">
  <p class="text-gray-500 text-sm">{pesan}</p>
</div>
```

---

## Standar Skeleton

**Rows (members, activities, announcements):**
```html
{Array.from({length: N}).map(() => (
  <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse flex gap-3">
    <div class="w-10 h-10 rounded-full bg-gray-800 flex-shrink-0"></div>
    <div class="flex-1 space-y-2">
      <div class="h-4 bg-gray-800 rounded w-1/3"></div>
      <div class="h-3 bg-gray-800 rounded w-1/2"></div>
    </div>
  </div>
))}
```

**Cards/Grid (projects):**
```html
{Array.from({length: N}).map(() => (
  <div class="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden animate-pulse">
    <div class="aspect-video bg-gray-800"></div>
    <div class="p-4 space-y-2">
      <div class="h-4 bg-gray-800 rounded w-2/3"></div>
      <div class="h-3 bg-gray-800 rounded w-full"></div>
    </div>
  </div>
))}
```

---

## Checklist Pengerjaan

### Fase 1 — Shared utilities (tidak breaking)
- [ ] Buat `src/lib/guards.ts`
- [ ] Buat `src/lib/format.ts`
- [ ] Buat `src/lib/constants.ts`
- [ ] Update semua halaman pakai guards dari lib
- [ ] Update profile/card pakai fmtDate dari lib

### Fase 2 — Komponen reusable
- [ ] Buat `src/components/app/PageHeader.astro`
- [ ] Buat `src/components/app/Modal.astro`
- [ ] Buat `src/components/app/EmptyState.astro`
- [ ] Update activities, projects, announcements pakai komponen baru

### Fase 3 — Standarisasi
- [ ] Seragamkan input styling (settings: px-4 → px-3)
- [ ] Tambah subtitle di members, profile, card, settings
- [ ] Seragamkan empty state semua halaman

### Fase 4 — Client utils
- [ ] Buat `src/lib/client-utils.ts` dengan `esc()` dan `fmtDate()`
- [ ] Pertimbangkan: apakah worth mengekstrak ke module? (perlu `type="module"` di script)
- [ ] Alternatif: inline di setiap halaman (sudah cukup kecil)

---

## Keputusan Arsitektur

### Client-side utils: inline vs module?

**Inline (saat ini):**
- Pro: tidak ada overhead import, tidak ada masalah `define:vars` + import
- Con: duplikasi `esc()` di 5 file

**Module:**
- Pro: DRY
- Con: tidak bisa pakai `define:vars` di script yang sama, perlu `data-*` workaround

**Rekomendasi:** Tetap inline untuk `esc()` dan `fmtDate()` di client scripts. Fungsinya kecil (3-4 baris), overhead duplikasi minimal. Fokus DRY pada server-side (guards, format, constants).

### Modal: komponen vs inline?

**Komponen:**
- Pro: konsisten, satu tempat untuk update styling
- Con: slot API Astro terbatas untuk form yang berbeda-beda

**Inline (saat ini):**
- Pro: fleksibel, form berbeda per halaman
- Con: duplikasi wrapper div dan button

**Rekomendasi:** Buat komponen untuk wrapper modal saja, form tetap sebagai slot.

---

*Dokumen ini adalah panduan pengerjaan. Fase 1 adalah prioritas tertinggi karena tidak breaking dan langsung mengurangi duplikasi.*
