# Known Issues & Backlog

Status aktual per 2026-04-15. Update file ini setiap kali isu diselesaikan atau ditemukan yang baru.

---

## 🔴 Kritis — Harus Diselesaikan

### 1. SLIMS Integration Masih Mock
**File:** `src/pages/api/slims/verify.ts`  
**Status:** Hardcoded 8 data siswa — hanya NISN tertentu yang bisa registrasi  
**Dampak:** Semua siswa di luar 8 NISN tersebut tidak bisa mendaftar  
**Keputusan:** Tetap mock sampai ada API SLiMS yang real. Expand data mock jika ada siswa baru — lihat `slims-mock.md`.

---

## 🟢 Nice to Have — Dikerjakan Jika Ada Waktu

*(tidak ada saat ini)*

---

## ✅ Sudah Selesai (Jangan Dikerjakan Ulang)

- ✅ QR Code generation — sudah pakai library `qrcode` yang real di `approve.ts`
- ✅ Login bug fix — API menerima `identifier` (bukan `nisn`/`nis` terpisah)
- ✅ Sidebar/topbar UX — profile dropdown, collapse button di topbar
- ✅ Guard functions — `requireAuth`, `requireMaintainer`, `requireMember` di `@lib/guards`
- ✅ Path aliases — semua import pakai `@lib/`, `@db`, `@components/`, dll
- ✅ Security headers — di middleware (CSP, X-Frame-Options, HSTS, dll)
- ✅ Session validation — satu kali di middleware, disimpan di `locals`
- ✅ Reusable components — `PageHeader`, `Modal`, `EmptyState`, `SkeletonList`
- ✅ Shared constants — `STATUS_COLORS`, `ACTIVITY_TYPE_COLORS` di `@lib/constants`
- ✅ Format helpers — `fmtDate`, `fmtDateTime` di `@lib/format`
- ✅ TypeScript errors di `settings.astro` — fixed
- ✅ Notification auto-generation — `src/lib/notifications.ts` + trigger di `approve.ts` dan `announcements/index.ts`
- ✅ Edit/Delete Projects — `PATCH/DELETE /api/projects/[id]` + UI
- ✅ Delete Activities — `DELETE /api/activities/[id]` + UI
- ✅ Edit/Delete Announcements — `PATCH/DELETE /api/announcements/[id]` + UI
- ✅ Pagination — semua list endpoints (members, projects, activities, announcements) + UI Prev/Next
- ✅ E2E Tests — 44 tests, 42 passed, 2 flaky (pass on retry)
- ✅ CI/CD Pipeline — `.github/workflows/test.yml` (unit + E2E + type check on push/PR)
- ✅ `pnpm test` fix — Bun test runner hanya jalankan `tests/unit/`
- ✅ Playwright config — `workers: 1`, `retries: 1`
- ✅ Image Upload untuk Projects — `POST /api/upload/image` (base64, maks 2MB), preview di modal, placeholder jika tidak ada gambar
- ✅ TypeScript errors di `tests/helpers/` — fixed (`likes` field, `import type`, `expect` unused)
- ✅ Steering files — 9 files: product, structure, tech, ui-patterns, api-patterns, auth-guards, database-schema, dev-workflow, known-issues, testing-patterns, notifications, security, deployment, slims-mock
- ✅ Hooks — 10 hooks aktif

---

## Test Accounts (Seed Data)

```
Maintainer:   NISN 0000000001 / password test123
Active Member: NISN 1234567890 / password test123
Active Member: NISN 1234567891 / password test123
Pending Member: NISN 1234567895 / (no password)
```

Seed ulang: `pnpm db:seed:enhanced`
