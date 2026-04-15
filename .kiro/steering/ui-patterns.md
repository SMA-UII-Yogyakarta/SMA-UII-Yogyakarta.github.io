# UI Patterns & Component Usage

## Design System

Dark theme throughout. Color palette:
- Background: `bg-gray-950` (page), `bg-gray-900` (cards/panels), `bg-gray-800` (inputs/hover)
- Border: `border-gray-800` (default), `border-gray-700` (hover)
- Text: `text-gray-100` (primary), `text-gray-400` (secondary), `text-gray-500` (muted)
- Accent: `blue-600` (primary action), `green-600` (approve/success), `red-600` (reject/danger)

---

## Dashboard Page Types & Required Structure

Every `/app/*.astro` page follows one of these patterns:

### Type A — Data Table (`members`)
```astro
---
import DashboardLayout from '@layouts/DashboardLayout.astro';
import SkeletonList from '@components/app/SkeletonList.astro';
import { requireMaintainer } from '@lib/guards';
const redirect = requireMaintainer(Astro); if (redirect) return redirect;
---
<DashboardLayout title="Members">
  <p class="text-gray-400 text-sm mb-4">Subtitle deskriptif</p>
  <!-- Filter bar statis (HTML, bukan JS) -->
  <div id="content"><SkeletonList count={5} /></div>
  <!-- Modal jika perlu -->
  <script>/* fetch + render */</script>
</DashboardLayout>
```

### Type B — Content Feed (`activities`, `announcements`)
```astro
---
import DashboardLayout from '@layouts/DashboardLayout.astro';
import PageHeader from '@components/app/PageHeader.astro';
import Modal from '@components/app/Modal.astro';
import SkeletonList from '@components/app/SkeletonList.astro';
import { requireAuth } from '@lib/guards';
const redirect = requireAuth(Astro); if (redirect) return redirect;
const canAdd = user!.status === 'active';
---
<DashboardLayout title="...">
  <PageHeader subtitle="..." actionLabel={canAdd ? "Tambah" : undefined} />
  <div id="list"><SkeletonList count={5} /></div>
  {canAdd && <Modal id="add-modal" title="..."><form>...</form></Modal>}
  <script>/* fetch + render + modal handlers */</script>
</DashboardLayout>
```

### Type C — Gallery (`projects`)
Same as Type B but use `<SkeletonList count={6} type="cards" />` and render a CSS grid.

### Type D — Pure SSR Detail (`profile`, `card`, `settings`)
```astro
---
// All data fetched server-side, no client fetch needed
const [tracks, card] = await Promise.all([...]);
---
<DashboardLayout title="...">
  <PageHeader subtitle="..." />
  <!-- Render data directly, no loading state -->
</DashboardLayout>
```

---

## Reusable Components

### `PageHeader.astro`
```astro
<PageHeader subtitle="Deskripsi halaman" />
<PageHeader subtitle="..." actionLabel="Tambah Item" actionId="open-modal" />
```
Props: `subtitle?`, `actionLabel?`, `actionId?` (default: `'open-modal'`)

### `Modal.astro`
```astro
<Modal id="add-modal" title="Judul Modal">
  <form id="my-form" class="space-y-3">
    <!-- form fields -->
    <div class="flex gap-3 pt-2">
      <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm transition">Simpan</button>
      <button type="button" id="close-modal" class="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition">Batal</button>
    </div>
  </form>
</Modal>
```
Open/close via JS: `modal.classList.remove('hidden')` / `modal.classList.add('hidden')`

### `SkeletonList.astro`
```astro
<SkeletonList count={5} />              <!-- rows (default) -->
<SkeletonList count={6} type="cards" /> <!-- grid cards -->
```

### `EmptyState.astro`
```astro
<EmptyState message="Belum ada data" />
```

---

## Standard Form Input Styling

All form inputs use this exact class set — never deviate:
```html
<!-- Input / Textarea / Select -->
class="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-100"

<!-- Label -->
class="block text-xs text-gray-400 mb-1"

<!-- Disabled input -->
class="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-500 cursor-not-allowed"
```

---

## Status & Type Badge Colors

Import from `@lib/constants` for server-side use:
```ts
import { STATUS_COLORS, ACTIVITY_TYPE_COLORS } from '@lib/constants';
// STATUS_COLORS: pending, active, rejected, inactive
// ACTIVITY_TYPE_COLORS: contribution, event, workshop, meeting, other
```

For client-side scripts (inline JS in `<script>` tags), define locally:
```js
const statusColors = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  active: 'text-green-400 bg-green-400/10',
  rejected: 'text-red-400 bg-red-400/10',
};
const typeColor = {
  contribution: 'bg-purple-500/20 text-purple-400',
  event: 'bg-blue-500/20 text-blue-400',
  workshop: 'bg-green-500/20 text-green-400',
  meeting: 'bg-yellow-500/20 text-yellow-400',
  other: 'bg-gray-500/20 text-gray-400',
};
```

---

## Client-Side Script Patterns

### XSS-safe HTML rendering (always use `esc()`)
```js
function esc(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'}[c])
  );
}
```
**Never** interpolate user data into innerHTML without `esc()`.

### Date formatting (client-side)
```js
function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}
```

### Standard fetch + render pattern
```js
async function load() {
  const res = await fetch('/api/endpoint');
  const json = await res.json();
  const items = json.data || [];
  const el = document.getElementById('content');
  if (!items.length) {
    el.innerHTML = '<div class="text-center py-10"><p class="text-gray-500 text-sm">Belum ada data</p></div>';
    return;
  }
  el.innerHTML = items.map(item => `...${esc(item.name)}...`).join('');
}
load();
```

### Modal open/close
```js
const modal = document.getElementById('add-modal');
document.getElementById('open-modal')?.addEventListener('click', () => modal?.classList.remove('hidden'));
document.getElementById('close-modal')?.addEventListener('click', () => modal?.classList.add('hidden'));
```

---

## Card / Panel Styling

Standard card:
```html
<div class="bg-gray-900 border border-gray-800 rounded-xl p-6">
```

Hoverable card:
```html
<div class="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition">
```

Info panel (sidebar right column):
```html
<div class="bg-gray-900 border border-gray-800 rounded-xl p-5 self-start">
  <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Label</h2>
```

---

## Avatar Initial Pattern

```html
<div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
  ${esc(name).charAt(0).toUpperCase()}
</div>
```

---

## Layouts

| Context | Layout |
|---------|--------|
| Public pages (`/`, `/about`, `/members`, etc.) | `Layout.astro` |
| Auth pages (`/login`, `/register`) | `AuthLayout.astro` |
| Dashboard pages (`/app/*`) | `DashboardLayout.astro` |

`DashboardLayout` accepts `title` prop — this becomes the topbar page title. Do not add a redundant `<h1>` inside the page unless it's a personal greeting (like overview).
