# CI/CD — Panduan Lengkap

> Pipeline GitHub Actions untuk platform Digital Lab SMA UII Yogyakarta.
> **Last updated:** 2026-05-19

---

## Daftar Isi

1. [Workflows](#workflows)
2. [Quick Commands](#quick-commands)
3. [Current Test Status](#current-test-status)
4. [Branch Strategy](#branch-strategy)
5. [Alur Deploy](#alur-deploy)
6. [GitHub Secrets](#github-secrets)
7. [Database Strategy](#database-strategy)
8. [Pre-Push & Pre-Merge Checklist](#pre-push--pre-merge-checklist)
9. [Performance](#performance)
10. [Troubleshooting](#troubleshooting)
11. [Menambahkan Test Baru](#menambahkan-test-baru)
12. [Roadmap CI/CD](#roadmap-cicd)

---

## ⚠️ Masalah yang Diketahui

Deploy workflow **harus manual trigger** (`workflow_dispatch`) — sudah diterapkan.

Masih perlu:
- [ ] Branch protection rules di GitHub (`main` dan `develop`)
- [ ] Pisahkan deploy staging (develop) dan production (main)
- [ ] Fix flaky projects grid test

---

## 🔄 Workflows

### 1. Test Workflow (`.github/workflows/test.yml`)

Berjalan otomatis pada:
- Push ke `main` atau `develop`
- Pull request ke `main` atau `develop`

**Jobs (berurutan):**

#### Unit Tests (~10 detik)
```bash
bun test apps/web/src
```
Menguji: format utilities, helpers, guards

#### E2E Tests (~90 detik) — hanya jika unit tests pass
```bash
bun run test:e2e
```
Menguji: full user flows (auth, members, progress, dll)
Database: Turso preview — bukan production
Browser: Chromium only (kecepatan)

#### Type Check (~15 detik)
```bash
bun run astro check
```
Memvalidasi: TypeScript types, Astro components

**Total runtime: ~2 menit**

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

> Manual trigger via `workflow_dispatch`. Tidak auto-deploy.

**Target:** Server Awankinton via SSH

**Steps:**
1. Pre-deployment checks (unit tests + type check)
2. Checkout repo + submodules (butuh `GH_TOKEN`)
3. SSH ke server
4. `git pull origin main`
5. `git submodule update --init --recursive`
6. `docker build -f deploy/docker/Dockerfile -t smauii-lab:latest .`
7. `docker compose up -d`
8. `docker image prune -f`

**Runtime:** ~3-5 menit (tergantung perubahan)

---

## ⚡ Quick Commands

```bash
# Development
bun run dev                 # dev server (localhost:4321)
bun run check              # type check — harus 0 errors
bun run build              # build production
bun run preview            # preview build lokal

# Testing
bun test apps/web/src      # unit tests saja
bun run test:e2e           # E2E saja
bun run test:e2e:ui        # E2E dengan UI interaktif
bunx playwright show-report # lihat laporan terakhir

# Database
bun run --cwd packages/db scripts/drop-tables.ts
bun run --cwd packages/db drizzle-kit push --force
bun run --cwd packages/db scripts/seed-enhanced.ts

# Type check
bun run astro check        # 0 errors, 0 warnings, 0 hints
```

---

## 📊 Current Test Status

| Suite | Status | Catatan |
|-------|--------|---------|
| Unit Tests | ✅ 3/3 (100%) | — |
| E2E Tests | ⚠️ 43/44 (97.7%) | 1 flaky: projects grid |
| Type Check | ✅ Pass | 0 errors, 0 warnings |
| CI Time | ~2 menit | — |

### Performance
```
Unit Tests:       ~10 detik
E2E Tests:        ~90 detik
Type Check:       ~15 detik
Total CI Time:    ~2 menit
```

---

## 🌿 Branch Strategy

```
main      ← production, protected, manual deploy only
develop   ← staging, protected, auto-deploy ke staging
feat/*    ← fitur baru, PR ke develop
fix/*     ← bug fix, PR ke develop
hotfix/*  ← urgent fix, PR ke main + develop
```

---

## 📦 Alur Deploy

```
feat/xxx → PR ke develop → CI → review → merge
                                           ↓
                                    staging (lab-dev.localhost)
                                           ↓
                                    audit & QA
                                           ↓
                              PR develop → main → CI → review → merge
                                                                  ↓
                                                    manual trigger deploy
                                                                  ↓
                                                    production (lab.smauiiyk.sch.id)
```

---

## 🔐 GitHub Secrets

Configure di: GitHub repo → Settings → Secrets and variables → Actions

```bash
# Server SSH
SERVER_HOST              # IP server Awankinton
SERVER_USER              # username SSH (dev)
SSH_PRIVATE_KEY          # private key SSH (tanpa passphrase)
DEPLOY_APP_PATH          # path ke project di server

# Database (Turso)
TURSO_URL                # libsql://your-db-preview.turso.io
TURSO_TOKEN              # auth token Turso

# OAuth (GitHub)
OAUTH_GITHUB_CLIENT_ID
OAUTH_GITHUB_CLIENT_SECRET

# SLiMS Integration
SLIMS_API_URL            # http://slims-container/plugins/lab-digital-api
SLIMS_API_KEY            # API key untuk SLiMS

# Misc
GH_TOKEN                 # GitHub token untuk checkout submodule private
PUBLIC_SITE_URL          # https://lab.smauiiyk.sch.id
```

---

## 📊 Database Strategy

| Database | Alias | Digunakan untuk |
|----------|-------|----------------|
| Preview | `db-preview` | Development, CI, staging |
| Production | `db-production` | Production only |

**Aturan:** Database production **tidak pernah** dipakai di CI/CD.
Semua test menggunakan database preview yang bisa di-reset kapan saja.

---

## ✅ Pre-Push & Pre-Merge Checklist

### Pre-Push (wajib sebelum push ke remote)
```bash
bun run check   # 0 errors, 0 warnings, 0 hints
bun run build   # build berhasil
```

### Pre-Merge Checklist (PR ke develop)
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

## 📈 Performance Optimization

**Optimasi yang bisa dilakukan:**
1. Cache Playwright browsers di CI → hemat ~20s
2. Parallel E2E tests → butuh DB isolation per worker
3. Incremental type checking → hanya file yang berubah
4. Test sharding → split tests ke multiple workers

---

## 🐛 Troubleshooting

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| Tests gagal di CI tapi pass lokal | State database berbeda | Reset database preview |
| E2E timeout | Server startup lambat | Naikkan timeout di `playwright.config.ts` ke 180000 |
| Type error setelah pull | Types belum di-sync | `bun run astro sync` |
| Submodule kosong di CI | `GH_TOKEN` tidak di-set | Tambahkan secret `GH_TOKEN` |
| Flaky test projects grid | Timing issue | Jalankan ulang, atau tambahkan `waitForLoadState` |
| Tests gagal lokal | State database | `bun run --cwd packages/db scripts/seed-enhanced.ts` |

---

## 📝 Menambahkan Test Baru

### Unit Test
```typescript
// apps/web/src/lib/my-feature.test.ts
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

### Segera
- [ ] Branch protection rules di GitHub (`main` dan `develop`)
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

**Status:** ✅ Production Ready
**Confidence:** High (97.7% test pass rate)
