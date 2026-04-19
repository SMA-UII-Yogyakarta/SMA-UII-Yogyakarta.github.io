# Workflow Pengembangan — Digital Lab SMA UII

Panduan alur kerja dari menulis kode hingga deploy ke production.
Wajib dibaca sebelum mulai mengerjakan fitur apapun.

---

## Gambaran Umum

```
feature/xxx branch
    ↓ PR ke develop
    ↓ CI otomatis: unit test + E2E + type check
    ↓ Review + approve
    ↓ Merge ke develop
    ↓ Auto-deploy ke staging (lab-dev.localhost)
    ↓ Audit & QA di staging
    ↓ PR develop → main
    ↓ CI otomatis jalan lagi
    ↓ Review + approve
    ↓ Manual trigger deploy ke production
```

**Aturan utama:**
- Tidak ada direct push ke `main` atau `develop`
- Tidak ada deploy production tanpa audit di staging terlebih dahulu
- Deploy production selalu manual trigger — tidak pernah otomatis

---

## Environment

| Environment | URL | Branch | Database | Deploy |
|-------------|-----|--------|----------|--------|
| Development | `http://localhost:4321` | `feature/*` | `smauiilab-prev` | `bun run dev` |
| Staging | `http://lab-dev.localhost` | `develop` | `smauiilab-prev` | Auto saat merge ke `develop` |
| Production | `https://lab.smauiiyk.sch.id` | `main` | `smauiilab-sandikodev` | Manual trigger |

---

## Branch Strategy

```
main      ← production, protected
develop   ← staging, protected
feat/*    ← fitur baru → PR ke develop
fix/*     ← bug fix → PR ke develop
hotfix/*  ← urgent → PR ke main + develop
```

---

## Alur Kerja Harian

```bash
# 1. Mulai dari develop terbaru
git checkout develop && git pull origin develop

# 2. Buat branch
git checkout -b feat/nama-fitur

# 3. Dev server
bun run dev  # http://localhost:4321

# 4. Sebelum push — wajib
bun run check   # harus 0 errors, 0 warnings, 0 hints
bun run build   # harus berhasil

# 5. Push + buat PR ke develop
git push origin feat/nama-fitur
```

---

## CI/CD Pipeline

### Test Workflow (otomatis)
Berjalan saat push atau PR ke `main`/`develop`:
- Unit tests (~10s)
- Type check (~15s)
- E2E tests (~90s) — hanya jika unit tests pass

**Jika CI gagal → PR tidak bisa di-merge.**

### Deploy Workflow
- **Staging** — otomatis saat merge ke `develop`
- **Production** — manual trigger via GitHub Actions, hanya setelah audit staging

---

## Staging & Audit

Setiap fitur harus diverifikasi di staging sebelum masuk production.

**Yang diverifikasi:**
- [ ] Fitur baru sesuai acceptance criteria
- [ ] Tidak ada regresi pada fitur lama
- [ ] Responsif di mobile (375px) dan desktop (1280px)
- [ ] Tidak ada console error di browser
- [ ] Login/logout berfungsi normal

---

## Deploy ke Production

```bash
# Hanya setelah:
# 1. CI pass di main
# 2. Sudah diaudit di staging
# 3. Ada explicit approval

# Trigger via GitHub Actions:
gh workflow run deploy.yml --ref main
# atau via GitHub UI: Actions → Deploy to Awankinton → Run workflow
```

### Verifikasi setelah deploy
```bash
curl -sI https://lab.smauiiyk.sch.id | head -3
docker logs smauii-lab-app --tail=20
```

---

## Pre-Push Checklist

```bash
bun run check   # 0 errors, 0 warnings, 0 hints
bun run build   # build berhasil
```

## Pre-Merge Checklist (PR ke develop)

```
[ ] bun run check: 0 errors, 0 warnings, 0 hints
[ ] bun run build: berhasil
[ ] Test manual di browser
[ ] Tidak ada console.log yang tertinggal
[ ] Tidak ada hardcoded credential atau URL
[ ] Submodule pointer di-update jika ada perubahan konten
```

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Tests gagal lokal | `bun run db:setup:enhanced` |
| Type error setelah pull | `bun run astro sync` |
| Submodule kosong | `git submodule update --init --recursive` |
| Build gagal di Docker | Pastikan `GH_TOKEN` di secrets |
| Container tidak start | `docker logs smauii-lab-app` |

---

## Quick Commands

```bash
bun run dev          # dev server
bun run check        # type check
bun run build        # build
bun run preview      # preview build lokal
bun run ci           # full CI pipeline lokal
bun run test:e2e     # E2E tests
bun run db:push      # push schema ke Turso
bun run db:studio    # Drizzle Studio
```

---

**Terakhir diperbarui:** 2026-04-19
