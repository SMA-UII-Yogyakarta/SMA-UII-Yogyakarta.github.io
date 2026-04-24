# Conventions

## Kode

### Astro Pages
- Server-side logic di frontmatter (`---`)
- Interaktivitas via `<script>` inline atau `.tsx` component
- Tidak pakai React Query / SWR — fetch manual + `load()` pattern
- Guard auth di awal: `const redirect = requireAuth(Astro); if (redirect) return redirect;`

### API Routes
- Selalu return via `createSuccessResponse` / `createErrorResponse` dari `@lib/api-utils`
- Validasi input sebelum DB query
- Admin-only endpoint: cek `user.role === 'maintainer'`

### Database
- Semua query via Drizzle ORM (`@db`)
- Schema di `src/db/schema.ts`
- Tidak ada raw SQL kecuali untuk `GROUP_CONCAT` atau query kompleks

### Komponen
- `.astro` untuk komponen statis / server-rendered
- `.tsx` hanya jika butuh client-side state yang kompleks
- Tailwind utility classes, tidak ada CSS custom kecuali di `global.css`

---

## Naming

| Hal | Konvensi | Contoh |
|-----|----------|--------|
| File halaman | kebab-case | `top-visitors.ts` |
| Komponen | PascalCase | `MemberCard.tsx` |
| Variabel | camelCase | `visitCount` |
| Konstanta | UPPER_SNAKE | `PAGE_LIMIT` |
| DB columns | snake_case | `joined_at` |

---

## Git

- Commit: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- Bahasa commit: Inggris
- Push hanya saat milestone bermakna, bukan setiap perubahan kecil
- Tidak commit: `.env`, `.env.*` (kecuali `.env.example`), `*.local.*`

---

## Deploy

```bash
# Build image
cd /home/dev/web/instances/smauii/lab
docker compose --env-file .env build

# Deploy
docker compose --env-file .env up -d --force-recreate
```

Jangan gunakan `docker build` manual — secrets tidak akan ter-inject dengan benar.

---

## Folder Structure

```
src/
├── pages/
│   ├── api/          — API routes (Astro endpoints)
│   ├── app/          — Protected dashboard pages
│   └── *.astro       — Public pages
├── components/
│   ├── app/          — Dashboard-specific components
│   └── *.astro/.tsx  — Shared components
├── layouts/          — Page layouts
├── lib/              — Utilities, helpers, guards
└── db/               — Schema, migrations

context/              — Living docs (AI + human)
docs/                 — Arsip, referensi historis
.kiro/steering/       — AI-specific instructions
```
