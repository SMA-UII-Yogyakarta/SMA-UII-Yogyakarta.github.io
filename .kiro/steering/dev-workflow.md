# Development Workflow

> **Package manager: `bun`** — bukan `pnpm`. Semua command menggunakan `bun`.

---

## Branch Strategy

```
main      ← production only, protected — tidak ada direct push
develop   ← staging/integration — tidak ada direct push
feat/*    ← fitur baru, PR ke develop
fix/*     ← bug fix, PR ke develop
hotfix/*  ← urgent fix, PR ke main + develop
```

**Aturan:** Tidak ada yang boleh push langsung ke `main` atau `develop`.
Semua perubahan melalui PR. CI harus pass sebelum merge.

---

## Alur Kerja Harian

```bash
# 1. Mulai dari develop yang terbaru
git checkout develop && git pull origin develop

# 2. Buat branch baru
git checkout -b feat/nama-fitur

# 3. Jalankan dev server (manual di terminal — jangan via agent)
bun run dev
# → http://localhost:4321

# 4. Setelah selesai — wajib sebelum push
bun run check   # harus 0 errors, 0 warnings, 0 hints
bun run build   # harus berhasil

# 5. Push dan buat PR ke develop
git push origin feat/nama-fitur
```

---

## Checklist Sebelum Push (Wajib)

```bash
bun run check   # 0 errors, 0 warnings, 0 hints
bun run build   # build berhasil tanpa error
```

Jika salah satu gagal, jangan push. Fix dulu.

---

## Menambahkan Fitur Baru

### API endpoint baru
1. Buat file di `src/pages/api/[category]/[name].ts`
2. Tambahkan Zod schema ke `src/lib/validation.ts`
3. Ikuti template di `api-patterns.md`
4. Tambahkan ke tabel referensi endpoint di `api-patterns.md`
5. Test manual via browser atau curl

### Halaman dashboard baru
1. Buat `src/pages/app/[name].astro`
2. Tambahkan guard yang benar (lihat `auth-guards.md`)
3. Gunakan `DashboardLayout` dengan pola yang sesuai (lihat `ui-patterns.md`)
4. Tambahkan nav item ke `src/lib/nav.ts` jika perlu
5. Update guard matrix di `auth-guards.md`

### Tabel database baru
1. Tambahkan definisi tabel ke `src/db/schema.ts`
2. Tambahkan relasi
3. Export inferred type di bagian bawah schema file
4. Jalankan `bun run db:push`
5. Update `database-schema.md`

### Komponen reusable baru
- UI server-rendered → `src/components/app/[Name].astro`
- Butuh client interactivity → `src/components/[Name].tsx`
- Spesifik dashboard → `src/components/app/`

---

## Environment Variables

```bash
# .env (copy dari .env.example)
TURSO_URL=libsql://...
TURSO_TOKEN=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
PUBLIC_SITE_URL=http://localhost:4321
```

**Aturan:**
- **Jangan pernah** gunakan prefix `PUBLIC_` untuk secrets atau DB credentials
- `PUBLIC_SITE_URL` adalah satu-satunya var dengan `PUBLIC_` — digunakan untuk OAuth callback
- Semua var lain adalah server-only

---

## Database Commands

```bash
bun run db:push            # push schema ke Turso preview
bun run db:studio          # buka Drizzle Studio di browser
bun run db:setup:enhanced  # reset + seed ulang database preview
```

**Database preview** (`smauiilab-prev-sandikodev`) digunakan untuk development dan CI.
**Database production** (`smauiilab-sandikodev`) tidak pernah disentuh di development.

---

## Git Conventions

```bash
# Nama branch
feat/nama-fitur
fix/nama-bug
refactor/nama-komponen
docs/nama-dokumen
chore/nama-task

# Commit messages — English, conventional commits
feat: add toast notification for lesson completion
fix: mobile drawer not closing on backdrop click
chore: update smauii-dev-content submodule pointer
docs: update deployment guide
refactor: extract lesson progress calculation to helper
```

---

## Konvensi Penamaan File

| Tipe | Konvensi | Contoh |
|------|---------|--------|
| Astro pages | kebab-case | `check-status.astro` |
| Astro components | PascalCase | `PageHeader.astro` |
| React components | PascalCase | `RegisterForm.tsx` |
| API routes | `index.ts` atau nama action | `index.ts`, `approve.ts` |
| Lib utilities | kebab-case | `api-utils.ts`, `dashboard-init.ts` |
| Scripts | kebab-case | `seed-enhanced.ts` |

---

## Urutan Import

```ts
// 1. Astro/framework
import type { APIRoute } from 'astro';

// 2. Database
import { db } from '@db';
import { users, memberCards } from '@db/schema';

// 3. ORM utilities
import { eq, or, desc } from 'drizzle-orm';

// 4. Internal lib
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';
import { requireAuth } from '@lib/guards';

// 5. External packages
import { nanoid } from 'nanoid';
import { z } from 'zod';
```

---

## Debugging

```bash
# Cek session user saat ini
curl -s http://localhost:4321/api/auth/me \
  -H "Cookie: <paste cookie dari browser DevTools>"

# Cek state database
bun run db:studio
# → buka https://local.drizzle.studio

# Cek API response
curl -s -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"0000000001","password":"test123"}' | jq

# Reset semua
bun run db:setup:enhanced
```

---

## Akun Testing

Selalu gunakan akun ini untuk testing manual — jangan buat data siswa nyata di dev:

| Role | Identifier | Password |
|------|-----------|----------|
| Maintainer | `0000000001` | `test123` |
| Active Member | `1234567890` | `test123` |
| Active Member | `1234567891` | `test123` |
| Pending Member | `1234567895` | (tidak ada) |

Reset: `bun run db:setup:enhanced`

---

## Production Deployment

App berjalan sebagai Node.js SSR server (bukan static):
- Build: `bun run build`
- Output: `dist/` dengan `dist/server/entry.mjs`
- Start: `node dist/server/entry.mjs`
- Port: via env var `PORT` (default 4321)

**Tidak kompatibel dengan GitHub Pages** — butuh Node.js server.
Deploy via Docker ke Awankinton. Detail di `docs/DEPLOYMENT_AWANKINTON.md`.

**Deploy production hanya via manual trigger GitHub Actions** — tidak pernah
langsung dari terminal. Tidak pernah tanpa audit di staging terlebih dahulu.
