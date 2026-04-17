# LMS — Rencana Pengerjaan Menyeluruh

**Dokumen ini adalah panduan bertahap untuk membangun LMS SMAUII Developer Foundation.**  
Update sesuai progress. Setiap fase harus selesai dan diverifikasi sebelum lanjut ke fase berikutnya.

---

## Konteks & Filosofi

LMS ini bukan sekadar kumpulan tutorial. Ia adalah **infrastruktur belajar komunitas** yang:

- **Open source by default** — konten di `smauii-dev-content` bisa diaudit, di-fork, dan dikontribusikan oleh siapa saja
- **Markdown-first** — konten ditulis dalam format yang bisa dibaca langsung di GitHub, bukan terkunci di CMS
- **Mendukung konten teknis** — LaTeX untuk matematika/algoritma, Mermaid untuk diagram arsitektur, syntax highlighting untuk kode
- **Progress tracking sederhana** — "tandai selesai" per lesson, bukan gamifikasi berlebihan
- **Public preview, full access untuk member** — siapa saja bisa lihat kurikulum, tapi konten penuh dan progress tracking butuh login

---

## Arsitektur

### Dua Lapisan Akses

```
/learn                          → publik, index semua track
/learn/[track]                  → publik, preview kurikulum + accordion modul/topik + CTA login
/app/learn                      → member, daftar track dengan progress
/app/learn/[track]              → member, daftar modul dengan progress per modul
/app/learn/[track]/[lesson]     → member, konten penuh + tandai selesai + navigasi prev/next
```

### Struktur Konten (smauii-dev-content)

```
tracks/
  software-engineering/
    README.md               ← track index: title, description, icon, order
    01-git-github/
      README.md             ← modul index: title, track, order
      01-apa-itu-git.md     ← lesson: title, track, module, order, level, duration, ...
      02-github-kolaborasi.md
    02-web-fundamentals/
      README.md
      01-html-dasar.md
      ...
  ai/
    README.md
    ...
```

**Konvensi penamaan:**
- Folder track: `kebab-case`, tanpa nomor urut (urut via `order` di frontmatter)
- Folder modul: `NN-kebab-case` (nomor urut eksplisit di nama folder untuk sorting di GitHub)
- File lesson: `NN-kebab-case.md`
- Index: selalu `README.md` (terbaca langsung di GitHub)

### Frontmatter Schema

**Track README.md:**
```yaml
---
title: "Software Engineering"
description: "..."
icon: "💻"
order: 1
tags: [software, programming]
---
```

**Modul README.md:**
```yaml
---
title: "Git & GitHub"
track: software-engineering
order: 1
---
```

**Lesson .md:**
```yaml
---
title: "Apa itu Git?"
track: software-engineering
module: 01-git-github
order: 1
level: beginner
duration: 20          # menit
prerequisites: []
tags: [git, version-control]
author: sandikodev
updated: 2026-04-16
---
```

### Slug Convention

Astro Content Collections dengan `base: './smauii-dev-content/tracks'` menghasilkan:
- `software-engineering/README` → track index
- `software-engineering/01-git-github/README` → modul index
- `software-engineering/01-git-github/01-apa-itu-git` → lesson

URL yang diekspos ke user:
- `/learn/software-engineering` → track preview (publik)
- `/app/learn/software-engineering` → track di app (member)
- `/app/learn/software-engineering/01-git-github/01-apa-itu-git` → lesson (member)

---

## Database

Tabel `learning_progress` sudah ada:
```ts
export const learningProgress = sqliteTable('learning_progress', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  lessonSlug: text('lesson_slug').notNull(),
  completedAt: integer('completed_at').notNull(),
});
```

API progress sudah ada di `src/pages/api/learn/progress.ts` (GET + POST toggle).

---

## Status Saat Ini

### ✅ Selesai
- `smauii-dev-content` repo dibuat, dijadikan git submodule
- Konten awal: software-engineering track + modul 01-git-github + 2 lesson
- `src/content.config.ts` — Astro Content Collections dengan glob loader
- `learning_progress` tabel di Turso
- `src/pages/api/learn/progress.ts` — GET/POST progress
- `/learn` — public track listing
- `/learn/[track]` — public preview dengan accordion + CTA

### 🔄 Sedang Dikerjakan
- LMS di `/app/learn/*` — belum ada

### ❌ Belum Dikerjakan
- `/app/learn` — daftar track dengan progress
- `/app/learn/[track]` — daftar modul + progress per modul
- `/app/learn/[track]/[...lesson]` — konten penuh + tandai selesai
- Sidebar nav item "Belajar" di `/app`
- LaTeX rendering (rehype-katex sudah install, perlu verifikasi)
- Mermaid rendering (client-side, bukan server-side)
- `@tailwindcss/typography` untuk prose styling

---

## Fase Pengerjaan

### Fase 1 — Fondasi App LMS ✅ (target: selesai hari ini)

**1.1 Tambah "Belajar" ke sidebar nav**
- File: `src/lib/nav.ts`
- Tambah item untuk role `member` dan `maintainer`
- Icon: buku atau graduation cap

**1.2 Halaman `/app/learn` — daftar track dengan progress**
- Ambil semua track (README entries tanpa `module` field)
- Untuk setiap track, hitung: total lesson, lesson selesai oleh user ini
- Tampilkan progress bar per track
- Link ke `/app/learn/[track]`

**1.3 Halaman `/app/learn/[track]` — daftar modul**
- Tampilkan semua modul dalam track
- Per modul: daftar lesson dengan status selesai/belum
- Progress bar per modul
- Link ke lesson pertama yang belum selesai (atau pertama jika semua selesai)

**1.4 Halaman `/app/learn/[track]/[...lesson]` — konten lesson**
- Render Markdown dengan `render()` dari Astro Content
- Sidebar kiri: daftar lesson dalam modul (dengan status selesai)
- Konten utama: rendered Markdown
- Tombol "Tandai Selesai" / "Tandai Belum Selesai"
- Navigasi prev/next lesson
- Breadcrumb: Belajar → Track → Modul → Lesson

---

### Fase 2 — Rendering Konten Teknis

**2.1 LaTeX**
- `remark-math` + `rehype-katex` sudah diinstall
- Verifikasi di `astro.config.mjs`
- Tambahkan KaTeX CSS ke Layout
- Test dengan konten yang mengandung `$...$` dan `$$...$$`

**2.2 Mermaid**
- Gunakan client-side Mermaid.js (bukan `remark-mermaidjs` yang butuh puppeteer)
- Strategi: render code block dengan `language-mermaid`, lalu client-side script replace dengan SVG
- Tambahkan script di lesson page saja (bukan global)

**2.3 Syntax Highlighting**
- Shiki sudah dikonfigurasi di `astro.config.mjs` dengan theme `github-dark`
- Verifikasi code block tampil dengan benar

**2.4 Typography**
- Install `@tailwindcss/typography` jika belum ada
- Tambahkan class `prose prose-invert` ke wrapper konten lesson

---

### Fase 3 — UX & Polish

**3.1 Progress tracking yang lebih informatif**
- Persentase selesai per track di `/app/learn`
- "Lanjutkan belajar" — link ke lesson terakhir yang dikunjungi atau lesson pertama yang belum selesai
- Streak/statistik sederhana (opsional)

**3.2 Navigasi lesson yang lebih baik**
- Keyboard shortcut: `←` prev, `→` next (opsional)
- Scroll position reset saat pindah lesson
- Highlight lesson aktif di sidebar

**3.3 Mobile responsiveness**
- Sidebar lesson di mobile: collapsible drawer
- Konten prose readable di layar kecil

---

### Fase 4 — Konten

**4.1 Lengkapi konten software-engineering**
- Modul 01-git-github: tambah lesson 03, 04, dst
- Modul 02-web-fundamentals: buat README + lesson awal
- Modul 03-javascript: buat README + lesson awal

**4.2 Track lain**
- Sesuai track yang ada di platform: AI, Data Science, Jaringan Komputer, Keamanan Siber, Robotika/IoT
- Minimal: README track + 1 modul + 2 lesson per track

**4.3 Panduan kontribusi konten**
- Update `smauii-dev-content/README.md` dengan panduan lengkap
- Template frontmatter
- Cara submit PR untuk konten baru

---

---

## Arsitektur Konten: GitHub API + CF Workers Cache

> **Keputusan arsitektur:** Konten tidak di-bundle saat build. Website fetch konten dari `smauii-dev-api` (Hono + Cloudflare Workers) yang menjadi proxy + cache layer ke GitHub API. Update konten di `smauii-dev-content` langsung live tanpa rebuild website.

### Alur Data

```
smauii-dev-content (GitHub repo)
        ↓ GitHub Contents API
smauii-dev-api (Hono + CF Workers)          ← satu-satunya yang pegang GITHUB_TOKEN
  ├── fetch raw file dari GitHub API
  ├── parse frontmatter (gray-matter)
  ├── render Markdown → HTML (remark + rehype + KaTeX + Shiki)
  ├── cache hasil HTML di CF KV (TTL 5 menit, key = path + commit SHA)
  └── serve JSON { frontmatter, html } ke client
        ↓ JSON
smauii-dev-foundation (Astro SSR / static)
  └── /app/learn/* → fetch ke smauii-dev-api, inject HTML ke DOM
```

### Kenapa HTML dari Worker, Bukan Raw Markdown di Client?

| | HTML dari Worker | Raw Markdown di Client |
|---|---|---|
| Bundle JS client | Kecil (tidak perlu remark/KaTeX/Shiki) | Besar (~500KB+) |
| Render time | Instan (HTML langsung inject) | Lambat (parse + render di browser) |
| Cache | Di KV, shared semua user | Per browser |
| LaTeX/Mermaid | Render di worker saat cache miss | Render di browser tiap load |
| Keamanan token | Token di worker secret, tidak ke client | Tidak bisa sembunyikan token |

**Kesimpulan:** Worker render sekali saat cache miss, semua user berikutnya dapat HTML cached.

**Pengecualian Mermaid:** Mermaid diagram tetap di-render client-side karena butuh DOM. Worker hanya output `<pre class="mermaid">...</pre>`, lalu client-side script Mermaid.js replace dengan SVG.

---

### Endpoint API (`smauii-dev-api`)

```
GET /content/tracks
  → list semua track
  → response: { tracks: [{ slug, title, description, icon, order }] }

GET /content/tracks/:track
  → detail track: frontmatter + list modul + list lesson per modul
  → response: { track: {...}, modules: [{ slug, title, lessons: [...] }] }

GET /content/tracks/:track/:module/:lesson
  → konten lesson: frontmatter + rendered HTML
  → response: { frontmatter: {...}, html: string }

GET /content/tracks/:track/README
  → track README: frontmatter + rendered HTML (untuk halaman track di app)
  → response: { frontmatter: {...}, html: string }
```

Semua endpoint:
- Return `Cache-Control: public, max-age=300` (5 menit browser cache)
- Gunakan CF KV sebagai server cache dengan key `content:{path}:{commitSHA}`
- Commit SHA diambil dari GitHub API sekali per request group, di-cache 1 menit

### CF KV Cache Strategy

```
Cache key:   content:{owner}/{repo}/{path}:{commitSHA}
TTL:         300 detik (5 menit)
Invalidasi:  Otomatis saat commit SHA berubah (konten baru = key baru)
             Manual: DELETE /admin/cache/purge (maintainer only, pakai API secret)
```

Commit SHA di-fetch dari `GET /repos/{owner}/{repo}/commits?path={path}&per_page=1`, di-cache terpisah dengan TTL 60 detik.

### Struktur `smauii-dev-api` (Target)

```
smauii-dev-api/
  src/
    index.ts              ← Hono app entry, mount routes
    routes/
      content.ts          ← /content/* routes
    lib/
      github.ts           ← GitHub API client (fetch + auth header)
      markdown.ts         ← remark pipeline: parse → rehype → KaTeX → Shiki → HTML
      cache.ts            ← CF KV wrapper (get/set dengan TTL)
    types.ts              ← shared types (Frontmatter, Track, Module, Lesson)
  wrangler.jsonc          ← KV binding + secrets config
```

### Secrets & Bindings (wrangler.jsonc)

```jsonc
{
  "kv_namespaces": [
    { "binding": "CONTENT_CACHE", "id": "..." }
  ]
}
```

Secrets (via `wrangler secret put`):
- `GITHUB_TOKEN` — GitHub Personal Access Token (read:contents scope)
- `ADMIN_SECRET` — untuk endpoint cache purge

### Dependencies yang Perlu Ditambah ke `smauii-dev-api`

```bash
bun add gray-matter remark remark-math remark-rehype rehype-katex rehype-stringify rehype-shiki
```

Catatan: semua package ini harus kompatibel dengan CF Workers runtime (tidak boleh pakai Node.js built-ins). Shiki v1+ sudah support edge runtime. gray-matter perlu dicek — alternatifnya `@std/front-matter` dari Deno/JSR yang lebih ringan.

---

### Implikasi untuk `smauii-dev-foundation`

Halaman `/app/learn/*` yang sekarang menggunakan `getCollection()` dari Astro Content Collections akan **diganti** dengan fetch ke `smauii-dev-api`. Perubahan ini dilakukan di Fase 3 (setelah API siap).

Sementara ini, implementasi saat ini (Astro Content Collections + submodule) tetap dipakai sebagai **development fallback** — berguna untuk development lokal tanpa perlu API running.

Submodule `smauii-dev-content` tetap dipertahankan di repo untuk:
1. Development lokal (tanpa API)
2. Referensi struktur konten
3. Kontribusi via PR tetap bisa di-preview lokal

---

## Koordinasi dengan Migrasi JAMstack

> Dokumen migrasi lengkap ada di `docs/MIGRATION_JAMSTACK.md`. Seksi ini menjelaskan **titik temu antara LMS dan migrasi JAMstack** — apa yang harus dikerjakan di `smauii-dev-api` terlebih dahulu agar LMS bisa berjalan tanpa konflik.

### Konteks: Dua Jalur Paralel

Migrasi JAMstack (`MIGRATION_JAMSTACK.md`) dan LMS adalah dua jalur yang **berbagi infrastruktur yang sama** (`smauii-dev-api`). Jika tidak dikoordinasikan, keduanya bisa saling konflik saat merge.

```
smauii-dev-api/
  src/
    routes/
      auth.ts          ← migrasi JAMstack (Fase 1)
      members.ts       ← migrasi JAMstack (Fase 5)
      content.ts       ← LMS (Fase 3 LMS)   ← TIDAK KONFLIK, domain berbeda
    lib/
      jwt.ts           ← migrasi JAMstack (Fase 0)
      github.ts        ← LMS (Fase 3 LMS)   ← TIDAK KONFLIK
      markdown.ts      ← LMS (Fase 3 LMS)   ← TIDAK KONFLIK
      cache.ts         ← LMS (Fase 3 LMS)   ← TIDAK KONFLIK, tapi bisa di-share
```

**Kesimpulan:** LMS content routes (`/content/*`) dan migrasi JAMstack routes (`/api/auth/*`, `/api/members/*`, dll) adalah domain yang **sepenuhnya terpisah** — tidak ada konflik kode. Yang perlu dikoordinasikan adalah:

1. **Setup awal `smauii-dev-api`** — harus dikerjakan sekali, dipakai bersama
2. **CF KV namespace** — LMS butuh KV untuk cache konten, migrasi JAMstack mungkin butuh KV untuk rate limiting
3. **CORS config** — harus include semua origin yang dibutuhkan kedua jalur
4. **Wrangler secrets** — `GITHUB_TOKEN` untuk LMS, `JWT_SECRET` untuk auth

---

### Urutan Pengerjaan `smauii-dev-api` yang Optimal

Agar LMS bisa berjalan seamless tanpa menunggu migrasi JAMstack selesai, urutan yang tepat adalah:

#### Step 1 — Setup Fondasi (Fase 0 Migrasi, dikerjakan sekarang)

Ini adalah prasyarat untuk **kedua jalur** (LMS dan migrasi JAMstack). Kerjakan sekali, dipakai bersama.

```
smauii-dev-api/
  src/
    index.ts          ← mount semua routes, setup CORS, error handler
  wrangler.jsonc      ← KV binding, compatibility flags
```

Checklist:
- [ ] Enable `nodejs_compat` di `wrangler.jsonc` (dibutuhkan untuk crypto, dll)
- [ ] Setup CORS di `index.ts`: allow `https://lab.smauiiyk.sch.id` + `http://localhost:4321`
- [ ] Buat CF KV namespace `CONTENT_CACHE` di Cloudflare dashboard
- [ ] Tambahkan KV binding ke `wrangler.jsonc`
- [ ] `wrangler secret put GITHUB_TOKEN` — token GitHub untuk baca `smauii-dev-content`
- [ ] `wrangler secret put JWT_SECRET` — untuk auth (dipakai Fase 1 migrasi)
- [ ] Test deploy: `wrangler deploy` → `GET /` harus return 200

#### Step 2 — LMS Content Routes (Fase 3 LMS, bisa dikerjakan independen)

Setelah fondasi siap, bangun content proxy untuk LMS. Ini **tidak bergantung** pada migrasi JAMstack — bisa dikerjakan paralel atau bahkan lebih dulu.

```
smauii-dev-api/
  src/
    lib/
      github.ts       ← GitHub API client
      markdown.ts     ← remark pipeline → HTML
      cache.ts        ← CF KV wrapper
    routes/
      content.ts      ← /content/* endpoints
```

Checklist:
- [ ] `bun add gray-matter unified remark remark-math remark-rehype rehype-katex rehype-stringify @shikijs/rehype`
- [ ] Verifikasi semua package kompatibel CF Workers (tidak pakai Node built-ins)
- [ ] Buat `src/lib/github.ts` — fetch file dari GitHub Contents API dengan auth header
- [ ] Buat `src/lib/markdown.ts` — remark pipeline: parse → math → rehype → katex → shiki → stringify
- [ ] Buat `src/lib/cache.ts` — KV get/set dengan TTL, key = `content:{path}:{sha}`
- [ ] Buat `src/routes/content.ts` — mount ke `index.ts`
- [ ] Test semua endpoint dengan `wrangler dev`

#### Step 3 — Auth Routes (Fase 1 Migrasi JAMstack, dikerjakan setelah Step 2 atau paralel)

Auth routes untuk migrasi JAMstack. Tidak memblokir LMS.

```
smauii-dev-api/
  src/
    lib/
      jwt.ts          ← generate + verify JWT
    middleware/
      auth.ts         ← Hono middleware verify JWT
    routes/
      auth.ts         ← /api/auth/*
      register.ts     ← /api/register
```

#### Step 4 — Domain Routes Lainnya (Fase 2-5 Migrasi JAMstack)

Profile, notifications, projects, activities, announcements, members, admin — dikerjakan bertahap sesuai `MIGRATION_JAMSTACK.md`.

---

### Dependency Map: LMS ↔ Migrasi JAMstack

```
LMS Fase 1 (app pages, Astro Content Collections)
  → TIDAK butuh smauii-dev-api sama sekali
  → Bisa dikerjakan dan di-test sekarang

LMS Fase 2 (LaTeX, Mermaid, typography)
  → TIDAK butuh smauii-dev-api
  → Bisa dikerjakan sekarang

LMS Fase 3 (smauii-dev-api content proxy)
  → Butuh: Step 1 (fondasi) + Step 2 (content routes)
  → TIDAK butuh migrasi JAMstack selesai

LMS Fase 4 (frontend fetch dari API)
  → Butuh: LMS Fase 3 selesai
  → TIDAK butuh migrasi JAMstack selesai
  → Tapi perlu koordinasi: jika migrasi JAMstack sudah di Fase 1 (JWT),
    maka LMS Fase 4 harus pakai JWT auth juga (bukan session cookie)

LMS Fase 5 (webhook invalidasi cache)
  → Bisa dikerjakan kapan saja setelah LMS Fase 3
```

**Kesimpulan praktis:** LMS Fase 1 dan 2 bisa dikerjakan **sekarang** tanpa menyentuh `smauii-dev-api`. LMS Fase 3 ke atas butuh `smauii-dev-api` tapi tidak bergantung pada migrasi JAMstack.

---

### Titik Koordinasi Kritis

**Satu hal yang perlu disepakati sebelum LMS Fase 4:** apakah saat frontend LMS fetch dari `smauii-dev-api`, auth-nya pakai:

- **Session cookie Lucia** (arsitektur saat ini) — berarti LMS Fase 4 bisa dikerjakan sebelum migrasi JAMstack
- **JWT Bearer token** (arsitektur target JAMstack) — berarti LMS Fase 4 harus menunggu migrasi JAMstack Fase 1 selesai, atau dikerjakan bersamaan

Rekomendasi: **kerjakan LMS Fase 4 bersamaan dengan migrasi JAMstack Fase 1**, sehingga keduanya langsung pakai JWT dari awal. Ini menghindari refactor auth dua kali.

#### Fase 1 — Fondasi App LMS ✅ (selesai)
- Nav "Belajar" di sidebar
- `/app/learn` — daftar track dengan progress
- `/app/learn/[track]` — daftar modul + lesson
- `/app/learn/[track]/[...lesson]` — konten lesson + tandai selesai

#### Fase 2 — Rendering Konten Teknis (menggunakan Astro Content Collections)
- LaTeX via rehype-katex
- Mermaid client-side
- Syntax highlighting via Shiki
- Typography prose

#### Fase 3 — `smauii-dev-api` Content Proxy
1. Setup CF KV namespace di Cloudflare dashboard
2. Update `wrangler.jsonc` dengan KV binding
3. Buat `src/lib/github.ts` — GitHub API client
4. Buat `src/lib/markdown.ts` — remark pipeline (kompatibel CF Workers)
5. Buat `src/lib/cache.ts` — KV wrapper
6. Buat `src/routes/content.ts` — endpoint `/content/*`
7. Mount di `src/index.ts`
8. Deploy ke CF Workers
9. Test semua endpoint

#### Fase 4 — Migrasi Frontend ke API
1. Buat `src/lib/content-api.ts` di `smauii-dev-foundation` — typed client ke `smauii-dev-api`
2. Refactor `/app/learn/*` untuk fetch dari API (bukan `getCollection`)
3. Inject HTML dari API ke DOM (sanitize dengan DOMPurify)
4. Handle loading state + error state
5. Mermaid client-side init setelah HTML di-inject

#### Fase 5 — Cache Invalidation & Webhook
1. GitHub webhook → CF Worker endpoint `/webhook/github`
2. Saat push ke `smauii-dev-content`, purge KV cache untuk path yang berubah
3. Setup webhook secret di GitHub repo settings

`remark-mermaidjs` butuh puppeteer (headless Chrome) untuk render SVG di server. Ini terlalu berat untuk deployment.

**Keputusan: client-side Mermaid.js**

```html
<!-- Di lesson page, setelah konten di-render -->
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  mermaid.initialize({ startOnLoad: true, theme: 'dark' });
</script>
```

Astro render code block `\`\`\`mermaid` sebagai `<pre><code class="language-mermaid">`. Script Mermaid.js akan detect dan replace dengan SVG.

### Progress API

Sudah ada di `src/pages/api/learn/progress.ts`. Endpoint:
- `GET /api/learn/progress?slug=...` — cek apakah lesson selesai
- `POST /api/learn/progress` body `{ slug, completed }` — toggle

Di lesson page, gunakan fetch client-side untuk toggle (tidak perlu full page reload).

### Layout Lesson

Lesson page menggunakan `DashboardLayout` (sidebar + topbar) dengan tambahan sidebar kanan/kiri untuk navigasi lesson. Dua opsi:

**Opsi A: Sidebar kiri untuk lesson nav, konten di tengah**
```
[App Sidebar] [Lesson Nav] [Konten Lesson]
```

**Opsi B: Konten penuh lebar, lesson nav di atas/bawah**
```
[App Sidebar] [Konten Lesson + Lesson Nav di bawah]
```

**Keputusan: Opsi A** — lebih familiar untuk LMS (mirip Udemy, Coursera). Lesson nav sidebar bisa collapse di mobile.

---

## Checklist Pengerjaan

### Fase 1
- [ ] Tambah "Belajar" ke `src/lib/nav.ts`
- [ ] Buat `src/pages/app/learn/index.astro`
- [ ] Buat `src/pages/app/learn/[track].astro`
- [ ] Buat `src/pages/app/learn/[track]/[...lesson].astro`
- [ ] Verifikasi auth guard di semua halaman `/app/learn/*`
- [ ] Test flow: login → /app/learn → pilih track → pilih lesson → tandai selesai

### Fase 2
- [ ] Verifikasi KaTeX CSS dimuat
- [ ] Test render LaTeX di lesson
- [ ] Implementasi client-side Mermaid
- [ ] Test render Mermaid diagram
- [ ] Verifikasi syntax highlighting
- [ ] Install + konfigurasi `@tailwindcss/typography`

### Fase 3
- [ ] Progress bar di track listing
- [ ] "Lanjutkan belajar" shortcut
- [ ] Mobile sidebar lesson nav

### Fase 4
- [ ] Tambah konten lesson ke submodule
- [ ] Update README smauii-dev-content

---

## Referensi File

| File | Fungsi |
|------|--------|
| `src/content.config.ts` | Astro Content Collections config |
| `src/db/schema.ts` | `learningProgress` table |
| `src/pages/api/learn/progress.ts` | Progress API |
| `src/pages/learn/index.astro` | Public track listing |
| `src/pages/learn/[track].astro` | Public track preview |
| `src/lib/nav.ts` | Sidebar nav items |
| `src/lib/guards.ts` | `requireAuth`, `requireMember` |
| `smauii-dev-content/tracks/` | Konten Markdown |

---

*Dibuat: 2026-04-16. Dikerjakan bersama dengan Kiro AI.*
