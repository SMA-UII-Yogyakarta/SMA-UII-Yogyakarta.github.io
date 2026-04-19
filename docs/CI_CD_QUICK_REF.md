# CI/CD Quick Reference

> Panduan lengkap: `docs/WORKFLOW.md` dan `docs/CI_CD_GUIDE.md`

---

## Commands

```bash
# Development
bun run dev                 # dev server (localhost:4321)
bun run check              # type check — harus 0 errors
bun run build              # build production
bun run preview            # preview build lokal

# Testing
bun run ci                 # full CI pipeline lokal
bun test                   # unit tests saja
bun run test:e2e           # E2E saja
bun run test:e2e:ui        # E2E dengan UI interaktif
bunx playwright show-report # lihat laporan terakhir

# Database
bun run db:push            # push schema ke Turso preview
bun run db:studio          # buka Drizzle Studio
bun run db:setup:enhanced  # reset + seed database preview
```

---

## Status Tests

| Suite | Status | Catatan |
|-------|--------|---------|
| Unit Tests | ✅ 3/3 (100%) | — |
| E2E Tests | ⚠️ 43/44 (97.7%) | 1 flaky: projects grid |
| Type Check | ✅ Pass | 0 errors, 0 warnings |
| CI Time | ~2 menit | — |

---

## Branch Strategy

```
main      ← production, protected, manual deploy only
develop   ← staging, protected, auto-deploy ke staging
feat/*    ← fitur baru, PR ke develop
fix/*     ← bug fix, PR ke develop
hotfix/*  ← urgent fix, PR ke main + develop
```

---

## Alur Deploy

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

## GitHub Secrets

```
SERVER_HOST              # IP server
SERVER_USER              # username SSH
SSH_PRIVATE_KEY          # private key SSH
TURSO_URL                # database preview URL
TURSO_TOKEN              # database token
OAUTH_GITHUB_CLIENT_ID
OAUTH_GITHUB_CLIENT_SECRET
GH_TOKEN                 # untuk checkout submodule
PUBLIC_SITE_URL
```

---

## Pre-Push (Wajib)

```bash
bun run check   # 0 errors, 0 warnings, 0 hints
bun run build   # build berhasil
```

---

## Troubleshooting Cepat

| Masalah | Solusi |
|---------|--------|
| Tests gagal lokal | `bun run db:setup:enhanced` |
| E2E timeout | Naikkan timeout di `playwright.config.ts` |
| Type error | `bun run astro sync` |
| Submodule kosong | `git submodule update --init --recursive` |
| Flaky test | Jalankan ulang 2-3x |

---

## ⚠️ Yang Perlu Diperbaiki

1. Deploy workflow harus diubah ke **manual trigger** (bukan auto saat push ke main)
2. Branch protection rules belum di-setup di GitHub
3. Staging environment belum fully automated

Detail: `docs/CI_CD_GUIDE.md` bagian Roadmap CI/CD
