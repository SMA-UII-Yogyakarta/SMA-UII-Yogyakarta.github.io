# Arsitektur Web Modern: Panduan Pembelajaran

> Dokumen ini menjelaskan **kenapa** ada berbagai framework dengan pendekatan berbeda, dan bagaimana memilih arsitektur yang tepat untuk kebutuhan spesifik.

---

## Daftar Isi

1. [Paradigma Runtime Web](#1-paradigma-runtime-web)
2. [Astro: SSR dengan Island Architecture](#2-astro-ssr-dengan-island-architecture)
3. [Hono: Edge-First Framework](#3-hono-edge-first-framework)
4. [Perbandingan Arsitektur](#4-perbandingan-arsitektur)
5. [Studi Kasus: Monorepo Ini](#5-studi-kasus-monorepo-ini)
6. [Mengapa Bukan PHP/Laravel?](#6-mengapa-bukan-phplaravel)
7. [Decision Framework](#7-decision-framework)
8. [Referensi Lanjutan](#8-referensi-lanjutan)

---

## 1. Paradigma Runtime Web

### Era Tradisional: Single Runtime

```
┌─────────────────────────────────────────────────────────┐
│                    PHP/Laravel                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Routing    │  │  Database   │  │  Template   │     │
│  │  Controller │──│  Query      │──│  Rendering  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
│  Semua berjalan di satu server, satu runtime,         │
│  satu lingkungan eksekusi.                              │
└─────────────────────────────────────────────────────────┘
```

**Karakteristik:**
- Semua logic di server
- Database di server yang sama atau dedicated
- Rendering di server (SSR)
- Scaling = vertical (tambah resource server) atau horizontal (load balancer + replica)

**Kelebihan:**
- Simpel, satu lingkungan
- Debugging mudah
- Ecosystem mature

**Keterbatasan:**
- Latency tinggi untuk user jauh dari server
- Scaling kompleks dan mahal
- Tidak optimal untuk global audience

### Era Modern: Distributed Runtime

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Edge Server    │     │   Edge Server    │     │   Edge Server    │
│  (Tokyo)         │     │  (Frankfurt)     │     │  (New York)      │
│  ┌────────────┐  │     │  ┌────────────┐  │     │  ┌────────────┐  │
│  │  Hono API  │  │     │  │  Hono API  │  │     │  │  Hono API  │  │
│  └─────┬──────┘  │     │  └─────┬──────┘  │     │  └─────┬──────┘  │
└────────┼─────────┘     └────────┼─────────┘     └────────┼─────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Edge Database           │
                    │   (Turso/PlanetScale/     │
                    │    Neon/D1)               │
                    │   - Data replication       │
                    │   - Edge-optimized         │
                    └───────────────────────────┘
```

**Karakteristik:**
- Code berjalan dekat user (edge)
- Database juga di edge (replicated)
- Latency < 50ms untuk user manapun
- Scaling otomatis oleh platform

---

## 2. Astro: SSR dengan Island Architecture

### Apa itu Astro?

Astro adalah **hybrid framework** yang menggabungkan:
- Static Site Generation (SSG)
- Server-Side Rendering (SSR)
- Client-side interactivity (Islands)

### Island Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Page (Static HTML - rendered at build time)            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Header (static)                                │   │
│  │  <nav>...</nav>                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🏝️ RegisterForm (interactive island)          │   │
│  │  - Hydrated only when visible                   │   │
│  │  - Uses React/Svelte/Vue/Solid                  │   │
│  │  - Zero JS for rest of page                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Footer (static)                                │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Astro SSR Mode

```astro
---
// Server-side code (runs on each request)
import { db } from '@smauii/db';
import { users } from '@smauii/db';
import { eq } from 'drizzle-orm';

const user = await db.query.users.findFirst({
  where: eq(users.id, Astro.locals.user.id)
});
---

<html>
  <head><title>Dashboard</title></head>
  <body>
    <h1>Welcome, {user.name}</h1>
    
    <!-- This island is hydrated on client -->
    <RegisterForm client:visible />
  </body>
</html>
```

### Deployment Targets

| Platform | Mode | Kelebihan |
|----------|------|-----------|
| **Node.js** | SSR | Full control, self-hosted |
| **Vercel** | SSR/SSG | Auto-scaling, edge functions |
| **Cloudflare Pages** | SSR/SSG | Edge, global CDN |
| **Netlify** | SSR/SSG | Simple, serverless functions |

### Kapan Pakai Astro?

✅ **Content-heavy websites** (blogs, docs, marketing)
✅ **Dashboard dengan interaktivitas terbatas**
✅ **E-commerce dengan product pages static**
✅ **Multi-page apps yang butuh SEO**
✅ **Project yang butuh flexibility deployment** (bisa Vercel, CF Pages, self-hosted)

❌ **Tidak ideal untuk:**
- Real-time apps (chat, collaboration)
- Heavy client-side state (complex SPAs)
- Apps yang butuh WebSocket persistent

---

## 3. Hono: Edge-First Framework

### Apa itu Hono?

Hono adalah **lightweight web framework** yang dirancang untuk edge runtime:
- Cloudflare Workers
- Deno Deploy
- Vercel Edge Functions
- Bun

### Karakteristik Edge Runtime

```
Traditional Server Request Flow:
┌────────┐    ┌────────────┐    ┌──────────┐    ┌────────┐
│ Client │───▶│ Load       │───▶│ Execute  │───▶│ Respond│
│        │    │ Balancer   │    │ (cold)   │    │        │
└────────┘    └────────────┘    └──────────┘    └────────┘
              ~100-500ms        ~50-200ms       ~50-100ms
              (routing)         (startup)       (query)

Edge Runtime Request Flow:
┌────────┐    ┌────────────┐    ┌──────────┐
│ Client │───▶│ Edge       │───▶│ Respond  │
│        │    │ (warm)      │    │          │
└────────┘    └────────────┘    └──────────┘
              ~5-20ms          ~10-50ms
              (instant)         (edge DB)
```

### Hono Code Example

```typescript
// apps/api/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';

type Bindings = {
  TURSO_URL: string;
  TURSO_TOKEN: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', cors());
app.use('/api/*', jwt({ secret: c => c.env.JWT_SECRET }));

// Routes
app.get('/api/users/:id', async (c) => {
  const db = createDb(c.env);
  const user = await db.query.users.findFirst({
    where: eq(users.id, c.req.param('id'))
  });
  return c.json(user);
});

export default app; // CF Workers entry point
```

### Edge Database: Turso

```
┌─────────────────────────────────────────────────────────┐
│                    Turso Architecture                    │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Primary    │  │  Replica    │  │  Replica    │     │
│  │  (US East)  │──│  (EU West)  │  │  (Asia)     │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │             │
│         └────────────────┼────────────────┘             │
│                          │                              │
│              Synchronous replication via libSQL         │
│              Edge-optimized query engine                │
└─────────────────────────────────────────────────────────┘
```

### Kapan Pakai Hono?

✅ **API-first applications**
✅ **Global audience (butuh latency rendah)**
✅ **Microservices di edge**
✅ **Serverless/edge deployment**
✅ **Backend untuk mobile apps**

❌ **Tidak ideal untuk:**
- Apps yang butuh long-running processes
- Heavy server-side rendering
- WebSocket connections (edge limitations)

---

## 4. Perbandingan Arsitektur

### Matrix Pemilihan

| Kebutuhan | Astro SSR | Hono Edge | Next.js | PHP/Laravel |
|-----------|-----------|-----------|---------|-------------|
| **SEO Critical** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Global Latency** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **Content-heavy** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Real-time features** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Simple deployment** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Cost efficiency** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Learning curve** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### Performance Comparison

```
Scenario: User di Indonesia mengakses app

Traditional (US Server):
┌─────────────────────────────────────────────────────────┐
│  Request: Jakarta → Singapore → US West → Database     │
│  Latency: ~200-400ms per request                        │
│  Total page load: 2-5 seconds                           │
└─────────────────────────────────────────────────────────┘

Edge (CF Workers + Turso):
┌─────────────────────────────────────────────────────────┐
│  Request: Jakarta → Singapore Edge → Singapore DB       │
│  Latency: ~20-50ms per request                          │
│  Total page load: 200-500ms                             │
└─────────────────────────────────────────────────────────┘

Improvement: 4-10x faster
```

---

## 5. Studi Kasus: Monorepo Ini

### Arsitektur Saat Ini

```
smauii-dev-foundation/
├── apps/
│   ├── web/                    # Astro SSR (Primary)
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── index.astro          # Static homepage
│   │   │   │   ├── app/                 # Dashboard (SSR)
│   │   │   │   └── api/                 # API routes
│   │   │   │       ├── auth/
│   │   │   │       │   ├── login.ts     # Login endpoint
│   │   │   │       │   └── register.ts  # Register endpoint
│   │   │   │       └── admin/
│   │   │   │           └── users.ts     # Admin endpoints
│   │   │   └── components/
│   │   │       └── RegisterForm.tsx    # Interactive island
│   │   └── package.json
│   │
│   └── api/                    # Hono (CF Workers) - OPTIONAL
│       ├── src/
│       │   ├── routes/
│       │   │   └── auth.ts     # Alternative auth API
│       │   └── index.ts
│       └── wrangler.jsonc
│
└── packages/
    ├── db/                     # Shared database layer
    ├── validation/             # Shared Zod schemas
    └── shared/                # Shared utilities
```

### Decision: Astro sebagai Primary

**Kenapa Astro SSR cukup untuk project ini?**

1. **API routes di Astro sudah powerful**
   ```typescript
   // apps/web/src/pages/api/auth/login.ts
   import type { APIRoute } from 'astro';
   import { db } from '@smauii/db';
   
   export const POST: APIRoute = async ({ request, cookies }) => {
     const body = await request.json();
     // Full database access, session management, etc.
     return new Response(JSON.stringify({ success: true }));
   };
   ```

2. **Deployment flexibility**
   - Self-hosted: Docker + VPS
   - Cloud: Vercel, Cloudflare Pages, Netlify
   - Tidak lock-in ke satu platform

3. **SEO + Performance**
   - SSR untuk halaman yang butuh SEO
   - Islands untuk interaktivitas
   - Zero JS untuk static content

4. **Simplicity**
   - Satu codebase untuk frontend + API
   - Tidak perlu manage dua deployment
   - Debugging lebih mudah

### Kapan `apps/api` (Hono) Dipakai?

**Hanya jika:**
- Butuh edge API terpisah dari frontend
- Ingin deploy ke Cloudflare Workers untuk latency global
- Frontend di platform berbeda (misal: mobile app)

**Saat ini: TIDAK DIPERLUKAN**
- Astro SSR sudah handle semua API needs
- Deployment ke satu server (Awankinton)
- Tidak ada kebutuhan edge global

---

## 6. Mengapa Bukan PHP/Laravel?

### PHP/Laravel: Solusi Valid, Tapi...

**Kelebihan PHP/Laravel:**
- Ecosystem mature, banyak package
- Learning curve rendah
- Shared hosting murah
- Monolith simplicity

**Tapi ada trade-offs:**

| Aspek | PHP/Laravel | Modern JS Stack |
|-------|-------------|-----------------|
| **Runtime** | Single server | Distributed (edge) |
| **Scaling** | Manual orchestration | Platform auto-scale |
| **Global latency** | 200-500ms | 20-50ms (edge) |
| **Type safety** | Optional (PHP 8+) | Native (TypeScript) |
| **Frontend integration** | Blade/Inertia | Native (React/Vue/Svelte) |
| **Deployment** | Traditional server | Edge/Serverless options |
| **Real-time** | Pusher/Laravel Echo | Native WebSocket support |

### Contoh: Scaling Global

```
PHP/Laravel Global Setup:
┌─────────────────────────────────────────────────────────┐
│  Option 1: Single Server (US)                          │
│  - User Asia: 300ms latency                            │
│  - User EU: 200ms latency                              │
│  - User US: 50ms latency                               │
│                                                         │
│  Option 2: Multi-region                                │
│  - Setup: Load balancer + 3 servers + DB replication   │
│  - Cost: $300-1000/month minimum                       │
│  - Complexity: High (DevOps heavy)                     │
└─────────────────────────────────────────────────────────┘

Modern JS Stack (Edge):
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Workers + Turso                            │
│  - User Asia: 30ms latency                             │
│  - User EU: 25ms latency                               │
│  - User US: 20ms latency                               │
│  - Cost: $0-50/month (free tier generous)              │
│  - Complexity: Low (platform handles everything)       │
└─────────────────────────────────────────────────────────┘
```

### Bukan Soal "Lebih Baik", Tapi "Lebih Tepat"

**PHP/Laravel cocok untuk:**
- Startup lokal, satu region
- Team yang sudah familiar PHP
- Budget terbatas, shared hosting
- Project dengan timeline ketat

**Modern JS Stack cocok untuk:**
- Global audience
- Team TypeScript-native
- Butuh edge performance
- Project dengan lifecycle panjang

---

## 7. Decision Framework

### Flowchart Pemilihan Framework

```
                    ┌─────────────────────┐
                    │  Apa kebutuhan      │
                    │  utama project?     │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
    ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
    │   Content   │     │    API      │     │   Real-time │
    │   Heavy     │     │   First     │     │   / SPA     │
    └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
           │                   │                   │
    ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
    │   Astro     │     │   Hono      │     │  Next.js    │
    │   (SSG/SSR) │     │   (Edge)    │     │  (SSR/SPA)  │
    └─────────────┘     └─────────────┘     └─────────────┘
           │                   │                   │
           │                   │                   │
    ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
    │ Deployment: │     │ Deployment: │     │ Deployment: │
    │ - Vercel    │     │ - CF Workers│     │ - Vercel    │
    │ - CF Pages  │     │ - Deno      │     │ - Self-host │
    │ - Self-host │     │ - Bun       │     │             │
    └─────────────┘     └─────────────┘     └─────────────┘
```

### Checklist: Apakah Astro SSR Cocok?

- [ ] Butuh SEO untuk halaman publik?
- [ ] Content lebih dominan dari interaktivitas?
- [ ] API endpoints relatif sederhana?
- [ ] Deployment ke berbagai platform?
- [ ] Budget development terbatas?

**Jika 3+ ✅ → Astro SSR adalah pilihan tepat**

### Checklist: Apakah Hono Edge Cocok?

- [ ] API-first application?
- [ ] Global audience dengan latency concern?
- [ ] Microservices architecture?
- [ ] Deploy ke Cloudflare Workers?
- [ ] Frontend terpisah (mobile/web)?

**Jika 3+ ✅ → Hono Edge adalah pilihan tepat**

---

## 8. Referensi Lanjutan

### Dokumentasi Resmi

- [Astro Docs](https://docs.astro.build) — SSR, Islands, Deployment
- [Hono Docs](https://hono.dev) — Edge runtime, middleware
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) — Edge computing
- [Turso](https://docs.turso.tech) — Edge database

### Konsep Penting

1. **Island Architecture** — [Astro Islands](https://docs.astro.build/en/concepts/islands/)
2. **Edge Computing** — [CF Workers Overview](https://developers.cloudflare.com/workers/platform/)
3. **Edge Databases** — [Turso Architecture](https://docs.turso.tech/concepts)
4. **Hydration** — [Partial Hydration Explained](https://www.patterns.dev/posts/partial-hydration)

### Video & Tutorial

- [Astro for Everyone](https://www.youtube.com/watch?v=XL6k5u8VXKk)
- [Hono - Ultra Fast Web Framework](https://www.youtube.com/watch?v=br6KY7qrU0I)
- [Edge Computing Explained](https://www.youtube.com/watch?v=QWw7CfQrQKU)

---

## Kesimpulan

**Tidak ada framework "terbaik"** — ada framework **"paling tepat"** untuk kebutuhan spesifik.

| Framework | Best For |
|-----------|----------|
| **Astro** | Content sites, dashboards, SEO-critical apps |
| **Hono** | Edge APIs, microservices, global latency |
| **Next.js** | Full-featured SPAs, real-time apps |
| **PHP/Laravel** | Traditional monoliths, local/regional apps |

**Monorepo ini memilih Astro SSR** karena:
1. SEO untuk halaman publik
2. API routes sudah cukup untuk kebutuhan
3. Deployment flexibility (self-hosted atau cloud)
4. Simplicity — satu codebase, satu deployment

**Hono di `apps/api`** disiapkan sebagai **opsi** untuk edge deployment di masa depan, bukan kebutuhan saat ini.

---

*Dokumen ini dibuat untuk pembelajaran komunitas developer Indonesia. Silakan share dan modifikasi sesuai kebutuhan.*
