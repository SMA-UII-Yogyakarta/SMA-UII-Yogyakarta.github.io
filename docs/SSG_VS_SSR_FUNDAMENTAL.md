# SSG vs SSR: Jamstack vs Fullstack — Panduan Fundamental

> Dokumen ini menjelaskan **perbedaan mendasar** antara SSG (Static Site Generation) dan SSR (Server-Side Rendering), bukan untuk menyatakan mana yang "lebih baik", tapi untuk memahami **kapan dan mengapa** memilih salah satu.

---

## Daftar Isi

1. [Mengapa Dokumen Ini Ada](#1-mengapa-dokumen-ini-ada)
2. [Konsep Dasar: Runtime Web](#2-konsep-dasar-runtime-web)
3. [SSG: Static Site Generation](#3-ssg-static-site-generation)
4. [SSR: Server-Side Rendering](#4-ssr-server-side-rendering)
5. [Perbandingan Apple-to-Apple](#5-perbandingan-apple-to-apple)
6. [Studi Kasus Infrastruktur Nyata](#6-studi-kasus-infrastruktur-nyata)
7. [Decision Framework](#7-decision-framework)
8. [Menepis Perdebatan "X Never Die"](#8-menepis-perdebatan-x-never-die)
9. [Referensi](#9-referensi)

---

## 1. Mengapa Dokumen Ini Ada

### Problem Statement

Dalam komunitas developer, sering muncul perdebatan:

> "PHP never die, paling simpel, gak ribet!"
> "Modern JS stack terlalu complex, mental overhead!"
> "Golang/Rust paling cepat, yang lain sampah!"
> "PHP/Laravel itu monolith, sudah ketinggalan zaman!"

**Tanpa** membawa argumen kontekstual tentang:
- Use case spesifik
- Real case di lapangan
- Edge case dan tradeoff
- Team skill dan resources
- Budget dan timeline

### Tujuan Dokumen Ini

Bukan untuk memenangkan satu kubu, tapi untuk:

1. **Memahami konsep fundamental** — bukan sekadar syntax atau tool
2. **Membedakan konteks** — kapan SSG tepat, kapan SSR tepat
3. **Menyajikan perbandingan apple-to-apple** — bukan apples vs oranges
4. **Memberi decision framework** — bukan jawaban "ini yang terbaik"

---

## 2. Konsep Dasar: Runtime Web

### Apa itu "Runtime"?

Runtime adalah **lingkungan eksekusi** di mana kode berjalan. Di web, ada dua runtime utama:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Web Runtime Spectrum                        │
│                                                                  │
│  Static Files     Edge Runtime      Server Runtime              │
│  (no runtime)     (micro-runtime)    (full runtime)              │
│                                                                  │
│  ┌──────────┐    ┌──────────┐      ┌──────────┐                 │
│  │  HTML    │    │  Workers │      │  Node.js │                 │
│  │  CSS     │    │  Deno    │      │  Bun     │                 │
│  │  JS      │    │  CF Edge │      │  PHP     │                 │
│  │  (only)  │    │          │      │  Python  │                 │
│  └──────────┘    └──────────┘      │  Go      │                 │
│       │               │            │  Rust    │                 │
│       │               │            └──────────┘                 │
│       ▼               ▼                   │                     │
│   CDN only        Edge only              │                     │
│   (cached)        (stateless)             ▼                     │
│                                    Full server                   │
│                                    (stateful)                    │
└─────────────────────────────────────────────────────────────────┘
```

### Tiga Mode Rendering

| Mode | Kapan Render Terjadi | Runtime yang Dibutuhkan |
|------|---------------------|------------------------|
| **SSG** | Build time | Tidak ada (static files) |
| **SSR** | Request time | Server runtime |
| **CSR** | Client time | Browser runtime |

```
SSG (Static Site Generation):
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Developer  │────▶│  Build      │────▶│  Static     │
│  Push Code  │     │  Process    │     │  HTML Files │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────────────────┘
                    ▼
┌─────────────┐     ┌─────────────┐
│  User       │────▶│  CDN        │────▶  Pre-built HTML (instant)
│  Request    │     │  (cached)   │
└─────────────┘     └─────────────┘

SSR (Server-Side Rendering):
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User       │────▶│  Server     │────▶│  Database   │
│  Request    │     │  Runtime    │     │  Query      │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │  Render     │────▶  Fresh HTML (on-demand)
                    │  Response   │
                    └─────────────┘

CSR (Client-Side Rendering):
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User       │────▶│  Browser    │────▶│  JavaScript │
│  Request    │     │  Downloads  │     │  Executes   │
└─────────────┘     │  Empty HTML │     └─────────────┘
                    └─────────────┘            │
                                              ▼
                                        ┌─────────────┐
                                        │  Render in  │
                                        │  Browser    │
                                        └─────────────┘
```

---

## 3. SSG: Static Site Generation

### Definisi

SSG adalah proses di mana **seluruh halaman website di-build menjadi file HTML statis** saat deploy, bukan saat user request.

### Karakteristik

| Aspek | SSG |
|-------|-----|
| **Runtime** | Tidak ada (hanya file statis) |
| **Render timing** | Build time |
| **Database access** | Tidak langsung (harus via API) |
| **Auth** | Client-side only (JWT) |
| **Scaling** | Trivial (CDN cache) |
| **Latency** | ~0ms (cached) |

### Infrastruktur SSG

```
┌─────────────────────────────────────────────────────────────────┐
│                    SSG Deployment Flow                          │
│                                                                  │
│  Build Time:                                                     │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │  Source     │────▶│  Build      │────▶│  Static     │        │
│  │  Code       │     │  Process    │     │  Files      │        │
│  │  (Astro)    │     │  (Node.js)  │     │  (HTML/CSS) │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│                                                  │              │
│  Runtime:                                        ▼              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │  User       │────▶│  CDN        │────▶│  Static     │        │
│  │  Request    │     │  (Global)   │     │  Response   │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│                            │                                    │
│                            ▼                                    │
│                    ┌─────────────────┐                         │
│                    │  Edge Servers   │                         │
│                    │  (cached files) │                         │
│                    └─────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

### Platform SSG

| Platform | Cost | Custom Domain | SSL | Notes |
|----------|------|---------------|-----|-------|
| **GitHub Pages** | Free | ✅ | ✅ | Public repo only for free |
| **Cloudflare Pages** | Free | ✅ | ✅ | SSG default, SSR optional |
| **Vercel** | Free tier | ✅ | ✅ | Auto-deploy from Git |
| **Netlify** | Free tier | ✅ | ✅ | Form handling built-in |

### Kapan SSG Tepat?

✅ **Content-heavy sites** (blogs, docs, marketing)
✅ **Public pages** (SEO critical)
✅ **Global audience** (CDN latency ~0ms)
✅ **Traffic spike tolerant** (CDN handles all)
✅ **Budget minimal** (free hosting available)
✅ **IT team minimal** (no server maintenance)

### Kapan SSG TIDAK Tepat?

❌ **Personalized content** (user-specific dashboard)
❌ **Real-time data** (stock prices, live updates)
❌ **Server-side auth** (session-based login)
❌ **Database queries** (secrets exposure risk)
❌ **Rate limiting** (no server to enforce)

---

## 4. SSR: Server-Side Rendering

### Definisi

SSR adalah proses di mana **halaman di-render menjadi HTML di server** saat user request, bukan di-build time.

### Karakteristik

| Aspek | SSR |
|-------|-----|
| **Runtime** | Full server (Node.js, Bun, PHP, Python, Go, Rust) |
| **Render timing** | Request time |
| **Database access** | Langsung dan aman |
| **Auth** | Server-side (session) atau client-side (JWT) |
| **Scaling** | Perlu orchestration |
| **Latency** | ~10-200ms (tergantung runtime) |

### Infrastruktur SSR

```
┌─────────────────────────────────────────────────────────────────┐
│                    SSR Deployment Flow                          │
│                                                                  │
│  Runtime (per request):                                         │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │  User       │────▶│  Server     │────▶│  Database   │        │
│  │  Request    │     │  Runtime    │     │  Query      │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│                            │                                    │
│                            ▼                                    │
│                      ┌───────────┐                              │
│                      │  Render   │                              │
│                      │  HTML     │                              │
│                      └───────────┘                              │
│                            │                                    │
│                            ▼                                    │
│                      ┌───────────┐                              │
│                      │  Response │────▶  Fresh HTML             │
│                      └───────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### Platform SSR

| Platform | Runtime | Cost | Notes |
|----------|---------|------|-------|
| **Docker/VPS** | Any | $5-20/mo | Full control |
| **Cloudflare Pages** | Workers | Free tier | Edge SSR |
| **Vercel** | Edge Functions | Free tier | Best DX |
| **Railway** | Node.js | $5/mo | Simple deploy |
| **Render** | Node.js | Free tier | Auto-deploy |

### Kapan SSR Tepat?

✅ **Personalized content** (user dashboard)
✅ **Server-side auth** (session-based, secure)
✅ **Database queries** (secrets safe in server)
✅ **Real-time data** (server can fetch fresh)
✅ **Rate limiting** (enforce at server level)
✅ **Complex business logic** (server-side processing)

### Kapan SSR TIDAK Tepat?

❌ **Budget $0** (need server, not just CDN)
❌ **IT team minimal** (server maintenance needed)
❌ **Global audience with tight latency budget** (depends on server location)
❌ **Traffic spike unpredictable** (need scaling strategy)

---

## 5. Perbandingan Apple-to-Apple

### Perbandingan Berdasarkan Use Case

#### Use Case 1: Blog/Dokumentasi

| Kriteria | SSG | SSR |
|----------|-----|-----|
| **SEO** | ⭐⭐⭐⭐⭐ (pre-rendered) | ⭐⭐⭐⭐⭐ (server-rendered) |
| **Latency** | ~0ms (cached) | ~50-200ms (render) |
| **Cost** | $0 (free hosting) | $5-20/mo (server) |
| **Maintenance** | None | Server upkeep |
| **Winner** | ✅ **SSG** | |

**Alasan:** Content jarang berubah, SEO penting, tidak butuh server logic.

---

#### Use Case 2: E-commerce Product Pages

| Kriteria | SSG | SSR |
|----------|-----|-----|
| **SEO** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Personalization** | ❌ (static) | ✅ (user-specific) |
| **Inventory check** | ❌ (stale) | ✅ (real-time) |
| **Latency** | ~0ms | ~50-200ms |
| **Winner** | ✅ **SSG** (catalog) | ✅ **SSR** (cart/checkout) |

**Alasan:** Product catalog bisa SSG (SEO, speed), tapi cart/checkout butuh SSR (real-time, personalized).

---

#### Use Case 3: Dashboard/Admin Panel

| Kriteria | SSG | SSR |
|----------|-----|-----|
| **Auth** | Client-side (JWT) | Server-side (session) |
| **Data freshness** | API fetch | Direct DB query |
| **Security** | ⚠️ (secrets in browser) | ✅ (secrets in server) |
| **Personalization** | Client-side | Server-side |
| **Winner** | | ✅ **SSR** |

**Alasan:** Auth sensitif, data personalized, security critical.

---

#### Use Case 4: Social Media Feed

| Kriteria | SSG | SSR |
|----------|-----|-----|
| **Real-time** | ❌ (polling) | ✅ (server push) |
| **Personalization** | Client-side | Server-side |
| **Infinite scroll** | Client-side | Server-side |
| **Latency** | API calls | Direct query |
| **Winner** | | ✅ **SSR** (or hybrid) |

**Alasan:** Real-time updates, personalized feed, complex interactions.

---

#### Use Case 5: Landing Page/Marketing Site

| Kriteria | SSG | SSR |
|----------|-----|-----|
| **SEO** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Latency** | ~0ms | ~50-200ms |
| **Cost** | $0 | $5-20/mo |
| **Traffic spike** | ✅ (CDN handles) | ⚠️ (need scaling) |
| **Winner** | ✅ **SSG** | |

**Alasan:** Static content, SEO critical, traffic unpredictable, budget minimal.

---

### Matrix Perbandingan

| Aspek | SSG | SSR |
|-------|-----|-----|
| **Runtime** | None (static files) | Server (Node/Bun/PHP/Go/Rust) |
| **Render timing** | Build time | Request time |
| **Database access** | Via API only | Direct |
| **Auth** | Client-side (JWT) | Server-side (session) or JWT |
| **Secrets safety** | ❌ (exposed to browser) | ✅ (safe in server) |
| **Latency** | ~0ms (cached) | ~10-200ms (render) |
| **Scaling** | Trivial (CDN) | Complex (orchestration) |
| **Cost** | $0-5/mo | $5-50/mo |
| **Maintenance** | None | Server upkeep |
| **SEO** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Personalization** | ❌ | ✅ |
| **Real-time data** | ❌ | ✅ |

---

## 6. Studi Kasus Infrastruktur Nyata

### Kasus 1: Sekolah Kecil dengan Budget $0

**Profil:**
- 200 siswa
- 1 IT volunteer (part-time)
- Domain: `sekolah.sch.id`
- Budget: $0

**Kebutuhan:**
- Landing page (public)
- Member directory (public)
- Simple auth untuk admin

**Infrastruktur:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Budget $0 Architecture                        │
│                                                                  │
│  ┌─────────────────────┐     ┌─────────────────────┐          │
│  │  GitHub Pages (SSG)  │     │  CF Workers (API)   │          │
│  │                     │     │                     │          │
│  │  - Landing page     │────▶│  - Auth (JWT)       │          │
│  │  - Member directory │     │  - CRUD             │          │
│  │  - Admin UI (CSR)   │     │  - Free tier        │          │
│  │                     │     │                     │          │
│  │  sekolah.sch.id     │     │  api.sekolah.sch.id │          │
│  └─────────────────────┘     └─────────────────────┘          │
│                                        │                        │
│                              ┌─────────▼─────────┐              │
│                              │  Turso (Free)     │              │
│                              │  - 9GB storage    │              │
│                              │  - Edge replicas  │              │
│                              └───────────────────┘              │
└─────────────────────────────────────────────────────────────────┘

Total Cost: $0/month
```

**Tradeoff:**
- ✅ Biaya $0
- ✅ Global CDN
- ⚠️ Auth harus JWT (client-side)
- ⚠️ CORS configuration needed

---

### Kasus 2: Kampus dengan Data Center

**Profil:**
- 10,000 mahasiswa
- Dedicated IT team (5 orang)
- On-premise data center
- Kebijakan: data harus lokal

**Kebutuhan:**
- Full LMS (learning management)
- Real-time collaboration
- Integration dengan sistem existing (SLiMS, SIAK)
- Data sensitif (nilai, keuangan)

**Infrastruktur:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    On-Premise Architecture                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Docker Cluster (Kubernetes/Docker Swarm)               │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │   │
│  │  │  Frontend   │  │  Backend   │  │  Database   │       │   │
│  │  │  (Astro SSR)│  │  (API)     │  │  (PostgreSQL│       │   │
│  │  │             │  │            │  │   or MariaDB│       │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │   │
│  │         │                │                │              │   │
│  │         └────────────────┼────────────────┘              │   │
│  │                          │                                │   │
│  │                   ┌──────▼──────┐                         │   │
│  │                   │  Load       │                         │   │
│  │                   │  Balancer   │                         │   │
│  │                   └──────┬──────┘                         │   │
│  └──────────────────────────┼───────────────────────────────┘   │
│                             │                                    │
│                    ┌────────▼────────┐                           │
│                    │  Reverse Proxy  │                           │
│                    │  (Nginx/Traefik)│                           │
│                    │  + SSL (Let's   │                           │
│                    │    Encrypt)     │                           │
│                    └────────┬────────┘                           │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  campus.ac.id     │
                    │  (internal DNS)   │
                    └───────────────────┘

Total Cost: Fixed (server ownership)
```

**Tradeoff:**
- ✅ Full control
- ✅ Data lokal
- ✅ Session-based auth
- ⚠️ Maintenance overhead
- ⚠️ Scaling manual

---

### Kasus 3: Startup EdTech Global

**Profil:**
- 100,000+ users worldwide
- Remote team (distributed)
- Need edge performance
- Budget: $500-2000/mo

**Kebutuhan:**
- Global low latency
- Real-time features
- Auto-scaling
- Analytics

**Infrastruktur:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Global Edge Architecture                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Cloudflare Network (Global)                             │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │   │
│  │  │  CF Pages   │  │  CF Workers│  │  D1/Turso   │       │   │
│  │  │  (SSG/SSR)  │  │  (API)     │  │  (Edge DB)  │       │   │
│  │  │             │  │            │  │             │       │   │
│  │  │  - Landing  │  │  - Auth    │  │  - Replicas │       │   │
│  │  │  - Dashboard│  │  - CRUD    │  │  - Auto-sync│       │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │   │
│  │         │                │                │              │   │
│  │         └────────────────┼────────────────┘              │   │
│  │                          │                                │   │
│  │                   ┌──────▼──────┐                         │   │
│  │                   │  CF CDN     │                         │   │
│  │                   │  (300+ PoP) │                         │   │
│  │                   └──────┬──────┘                         │   │
│  └──────────────────────────┼───────────────────────────────┘   │
│                             │                                    │
│                    ┌────────▼────────┐                           │
│                    │  app.edtech.io  │                           │
│                    └─────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘

Total Cost: $50-200/mo (pay as you scale)
```

**Tradeoff:**
- ✅ Global latency < 50ms
- ✅ Auto-scaling
- ✅ DDoS protection
- ⚠️ Vendor lock-in
- ⚠️ Edge runtime limitations

---

## 7. Decision Framework

### Flowchart Pemilihan

```
                    ┌─────────────────────────┐
                    │  Apakah content         │
                    │  personalized per user? │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │ YA                                 │ NEIN
              ▼                                    ▼
    ┌─────────────────────┐           ┌─────────────────────┐
    │  Apakah butuh       │           │  Apakah butuh       │
    │  server-side auth?  │           │  real-time data?    │
    └─────────┬───────────┘           └─────────┬───────────┘
              │                                 │
    ┌─────────┴─────────┐             ┌─────────┴─────────┐
    │ YA                │ NEIN        │ YA                │ NEIN
    ▼                   ▼             ▼                   ▼
┌───────┐         ┌───────┐     ┌───────┐         ┌───────┐
│  SSR  │         │ Hybrid│     │  SSR  │         │  SSG  │
│       │         │(SSG+  │     │       │         │       │
│       │         │ API)  │     │       │         │       │
└───────┘         └───────┘     └───────┘         └───────┘
```

### Checklist: SSG atau SSR?

**Pilih SSG jika:**
- [ ] Content jarang berubah
- [ ] SEO critical
- [ ] Budget minimal ($0)
- [ ] IT team minimal
- [ ] Global audience
- [ ] Traffic spike unpredictable
- [ ] Tidak butuh real-time data
- [ ] Tidak butuh server-side auth

**Pilih SSR jika:**
- [ ] Content personalized per user
- [ ] Butuh server-side auth (session)
- [ ] Database queries langsung
- [ ] Real-time data needed
- [ ] Complex business logic
- [ ] Rate limiting required
- [ ] Secrets must stay in server

---

## 8. Menepis Perdebatan "X Never Die"

### Problem: Language/Framework Wars

```
"PHP is dead!"          vs    "PHP never die!"
"JS is too complex!"    vs    "JS is the future!"
"Go is superior!"       vs    "Go is overrated!"
"Rust is fastest!"      vs    "Rust is too hard!"
```

**Tanpa konteks, semua pernyataan di atas adalah noise.**

### Realitas: Tools untuk Kebutuhan

| Bahasa/Framework | Best For | Tradeoff |
|------------------|----------|----------|
| **PHP/Laravel** | Rapid development, monolith, shared hosting | Not edge-native, runtime heavier |
| **Node.js/Astro** | SSR, fullstack, modern DX | Ecosystem complexity |
| **Go** | High performance, microservices | Steeper learning curve |
| **Rust** | Systems programming, WASM | Longest learning curve |
| **Bun** | Fast runtime, TypeScript native | Newer ecosystem |

### Contoh: PHP vs Modern JS Stack

**Bukan tentang mana yang "lebih baik", tapi mana yang "lebih tepat".**

| Konteks | PHP/Laravel | Modern JS (Astro/Hono) |
|---------|------------|------------------------|
| **Shared hosting** | ✅ Perfect | ❌ Not supported |
| **VPS/Dedicated** | ✅ Works | ✅ Works |
| **Edge deployment** | ⚠️ Possible but not native | ✅ Native |
| **Global CDN** | ⚠️ Need external setup | ✅ Built-in (CF/Vercel) |
| **Session auth** | ✅ Native | ✅ Native (SSR) or JWT (SSG) |
| **Learning curve** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Ecosystem** | Mature | Rapidly evolving |
| **DX** | Simple | Complex but powerful |

### Contoh: Monolith vs Microservices

| Konteks | Monolith | Microservices |
|---------|----------|---------------|
| **Small team (<5)** | ✅ Simpler | ❌ Overkill |
| **Large team (20+)** | ⚠️ Coordination hard | ✅ Independent teams |
| **Rapid MVP** | ✅ Fast | ❌ Slow setup |
| **Global scale** | ⚠️ Single point of failure | ✅ Distributed |
| **Debugging** | ✅ Simple | ❌ Complex tracing |

### Kesimpulan

> **Tidak ada teknologi yang "mati" atau "paling unggul".**
> 
> Yang ada adalah **teknologi yang tepat untuk konteks tertentu**.

**Pertanyaan yang benar:**
- "Apa use case saya?"
- "Apa budget dan resources saya?"
- "Apa skill set tim saya?"
- "Apa timeline saya?"

**Bukan:**
- "Apa framework paling populer?"
- "Apa yang paling cepat?"
- "Apa yang paling modern?"

---

## 9. Referensi

### Dokumentasi Resmi

- [Astro Docs](https://docs.astro.build) — SSG/SSR modes
- [Cloudflare Pages](https://developers.cloudflare.com/pages/) — SSG and SSR
- [Vercel](https://vercel.com/docs) — SSR and Edge Functions

### Konsep Penting

- [SSG vs SSR](https://web.dev/rendering-patterns/) — Rendering patterns
- [Jamstack](https://jamstack.org/) — Static-first architecture
- [Edge Computing](https://developers.cloudflare.com/workers/) — Distributed runtime

### Bacaan Lanjutan

- [PHP vs Modern Stack](./LEARN_ARCHITECTURE_DECISIONS.md) — Detailed comparison
- [Deployment Options](./DEPLOYMENT_OPTIONS.md) — Platform-specific guides

---

## Penutup

Dokumen ini bukan untuk menyatakan "SSG lebih baik" atau "SSR lebih baik".

Tujuannya adalah untuk **memberi pondasi berpikir kontekstual**:

1. **Pahami konsep** — bukan sekadar tool
2. **Identifikasi kebutuhan** — use case, budget, team
3. **Pilih yang tepat** — bukan yang "paling populer"
4. **Terima tradeoff** — setiap pilihan ada konsekuensi

> **"The right tool for the right job."**
> 
> Bukan "the best tool for every job".

---

*Dokumen ini adalah bagian dari Lab Digital Platform — panduan pembelajaran untuk komunitas developer Indonesia.*
