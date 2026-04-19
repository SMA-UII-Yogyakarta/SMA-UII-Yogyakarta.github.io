# CI/CD Configuration — Complete Guide

> **Lihat juga:** `docs/WORKFLOW.md` untuk gambaran lengkap alur kerja dari
> development hingga production.

---

## ⚠️ Masalah yang Diketahui (Harus Diperbaiki)

Deploy workflow saat ini **trigger otomatis saat push ke `main`** — ini salah.
Deploy ke production harus selalu manual dan hanya setelah audit di staging.

**Fix yang dibutuhkan di `.github/workflows/deploy.yml`:**
```yaml
# Ubah dari:
on:
  push:
    branches: [main]

# Menjadi:
on:
  workflow_dispatch:  # manual trigger only
    inputs:
      reason:
        description: 'Alasan deploy'
        required: true
```

---

## 🔄 Workflows

### 1. Test Workflow (`.github/workflows/test.yml`)

Berjalan otomatis pada:
- Push ke `main` atau `develop`
- Pull request ke `main` atau `develop`

**Jobs (berurutan):**

#### Unit Tests (~10 detik)
```bash
bun test tests/unit
```
Menguji: format utilities, helpers, guards

#### Type Check (~15 detik)
```bash
bun run check  # astro check
```
Memvalidasi: TypeScript types, Astro components

#### E2E Tests (~90 detik) — hanya jika unit tests pass
```bash
bun run test:e2e
```
Menguji: full user flows (auth, members, progress, dll)
Database: `smauiilab-prev` (Turso preview — bukan production)
Browser: Chromium only (untuk kecepatan)

**Total runtime: ~2 menit**

**Jika CI gagal → PR tidak bisa di-merge.**

---

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

> ⚠️ Saat ini trigger otomatis — harus diubah ke manual. Lihat bagian atas.

**Target:** Server Awankinton via SSH

**Steps:**
1. Checkout repo + submodules (butuh `GH_TOKEN`)
2. SSH ke server
3. `git pull origin main`
4. `git submodule update --init --recursive`
5. `docker build -t smauii-lab:latest .`
6. `docker compose up -d`
7. `docker image prune -f`

**Runtime:** ~3-5 menit (tergantung perubahan)

---

## 🔐 GitHub Secrets yang Dibutuhkan

Configure di: GitHub repo → Settings → Secrets and variables → Actions

```bash
# Server SSH
SERVER_HOST          # IP server Awankinton
SERVER_USER          # username SSH (dev)
SSH_PRIVATE_KEY      # private key SSH (tanpa passphrase)

# Database (Turso)
TURSO_URL            # libsql://smauiilab-prev-sandikodev.aws-ap-northeast-1.turso.io
TURSO_TOKEN          # auth token Turso

# OAuth (GitHub)
OAUTH_GITHUB_CLIENT_ID
OAUTH_GITHUB_CLIENT_SECRET

# Misc
GH_TOKEN             # GitHub token untuk checkout submodule private
PUBLIC_SITE_URL      # https://lab.smauiiyk.sch.id
```

---

## 📊 Database Strategy

| Database | Nama Turso | Digunakan untuk |
|----------|-----------|----------------|
| Preview | `smauiilab-prev-sandikodev` | Development, CI, staging |
| Production | `smauiilab-sandikodev` | Production only |

**Aturan:** Database production **tidak pernah** dipakai di CI/CD.
Semua test menggunakan database preview yang bisa di-reset kapan saja.

---

## 📊 Status Tests Saat Ini

```
✅ Unit Tests:     3/3 passing (100%)
✅ E2E Tests:     43/44 passing (97.7%)
⚠️  Flaky Tests:   1 — projects grid visibility (timing issue)
✅ Type Check:    Passing (0 errors, 0 warnings)

Total CI Time:    ~2 menit
```

---

## ✅ Pre-Push Checklist

Wajib sebelum push ke remote:

```bash
bun run check   # harus 0 errors, 0 warnings, 0 hints
bun run build   # harus berhasil tanpa error
```

## ✅ Pre-Merge Checklist (PR ke develop)

```
[ ] bun run check: 0 errors, 0 warnings, 0 hints
[ ] bun run build: berhasil
[ ] Test manual di browser
[ ] Fitur baru punya test (jika applicable)
[ ] Tidak ada console.log yang tertinggal
[ ] Tidak ada hardcoded credential atau URL
[ ] Submodule pointer di-update jika ada perubahan konten
```

---

## 🚀 Menjalankan CI Lokal

```bash
# Full pipeline (seperti CI)
bun run ci

# Individual
bun test                    # unit tests
bun run test:e2e           # E2E tests
bun run check              # type check

# Debug
bun run test:e2e:ui        # E2E dengan Playwright UI
bunx playwright show-report # lihat laporan terakhir
```

---

## 🐛 Troubleshooting

| Masalah | Penyebab | Solusi |
|---------|---------|--------|
| Tests gagal di CI tapi pass lokal | State database berbeda | `bun run db:setup:enhanced` |
| E2E timeout | Server startup lambat | Naikkan timeout di `playwright.config.ts` ke 180000 |
| Type error setelah pull | Types belum di-sync | `bun run astro sync` |
| Submodule kosong di CI | `GH_TOKEN` tidak di-set | Tambahkan secret `GH_TOKEN` |
| Flaky test projects grid | Timing issue | Jalankan ulang, atau tambahkan `waitForLoadState` |

---

## 📈 Performance Optimization

**Saat ini:**
- Unit tests: ~10s
- E2E tests: ~90s
- Type check: ~15s
- **Total: ~2 menit**

**Optimasi yang bisa dilakukan:**
1. Cache Playwright browsers di CI → hemat ~20s
2. Parallel E2E tests → butuh DB isolation per worker
3. Incremental type checking → hanya file yang berubah
4. Test sharding → split tests ke multiple workers

---

## 📝 Menambahkan Test Baru

### Unit Test
```typescript
// tests/unit/my-feature.test.ts
import { test, expect } from 'bun:test';

test('should do something', () => {
  expect(true).toBe(true);
});
```

### E2E Test
```typescript
// tests/e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('/my-page');
  await expect(page.locator('h1')).toBeVisible();
});
```

---

## 🎯 Roadmap CI/CD

### Segera (harus diperbaiki)
- [ ] Ubah deploy workflow ke manual trigger (`workflow_dispatch`)
- [ ] Tambahkan branch protection rules di GitHub (`main` dan `develop`)
- [ ] Pisahkan deploy staging (develop) dan production (main)

### Jangka Menengah
- [ ] Fix flaky projects grid test
- [ ] Cache Playwright browsers di CI
- [ ] Tambahkan data-testid attributes untuk selector yang stabil
- [ ] Setup test coverage reporting

### Jangka Panjang
- [ ] Visual regression testing
- [ ] API contract tests
- [ ] Performance benchmarks
- [ ] Load testing

---

**Terakhir diperbarui:** 2026-04-19
**Status:** ⚠️ Perlu perbaikan deploy workflow (lihat bagian atas)
