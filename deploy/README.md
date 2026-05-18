# Digital Lab School — Deployment Guide

> Panduan lengkap deploy platform Digital Lab SMA UII Yogyakarta.
> Universal: bisa dipakai oleh sekolah lain dengan menyesuaikan konfigurasi.

---

## Struktur Folder

```
deploy/
├── README.md                          ← Kamu disini
├── docker/
│   ├── Dockerfile                     ← Production Docker image
│   └── docker-compose.yml             ← Deploy self-hosted
├── nginx/
│   └── lab.conf                       ← Sample reverse proxy config
├── scripts/
│   ├── deploy.sh                      ← One-command deploy
│   ├── setup-server.sh                ← Initial server setup (Ubuntu/Debian)
│   └── migrate.sh                     ← Database migration helper
├── env/
│   └── .env.production.example        ← Template environment variables
└── docs/
    ├── CI_CD.md                       ← GitHub Actions pipeline guide
    ├── DEPLOYMENT_AWANKINTON.md         ← Server infrastructure (Awankinton-specific)
    └── GITHUB_OAUTH.md                ← OAuth app setup guide
```

---

## Quick Start (Self-Hosted)

```bash
# 1. Setup server (SATU KALI)
bash deploy/scripts/setup-server.sh

# 2. Copy & isi environment variables
cp deploy/env/.env.production.example .env
nano .env   # isi TURSO_URL, TURSO_TOKEN, OAUTH_*, dll

# 3. Deploy
bash deploy/scripts/deploy.sh
```

## Quick Start (Docker Only)

```bash
cp deploy/env/.env.production.example .env
# isi .env...
docker compose -f deploy/docker/docker-compose.yml up -d
```

---

## Persyaratan Sistem

| Komponen | Minimal | Rekomendasi |
|----------|---------|-------------|
| CPU | 1 core | 2+ core |
| RAM | 512 MB | 1+ GB |
| Storage | 1 GB | 5+ GB |
| OS | Linux (Ubuntu 22.04+) | Debian 12 / Ubuntu 24.04 |
| Docker | Engine 24+ | Engine 27+ |
| Domain | - | lab.sekolah.sch.id |
| Database | Turso (cloud) | Turso (cloud) |

---

## Lingkungan

### Development
```bash
bun install
bun run dev              # http://localhost:4321
bun run db:push          # database setup
```

### Production (Docker)
```bash
docker compose -f deploy/docker/docker-compose.yml up -d
```

### CI/CD (GitHub Actions)
Push ke `main` → trigger test workflow.
Deploy manual via: Actions → Deploy to Awankinton → Run workflow.

---

## Referensi

- [CI/CD Pipeline](docs/CI_CD.md) — detail GitHub Actions workflows
- [Deploy Awankinton](docs/DEPLOYMENT_AWANKINTON.md) — server infrastructure
- [GitHub OAuth](docs/GITHUB_OAUTH.md) — setup OAuth app
- [Docker Compose](docker/docker-compose.yml) — service definitions
- [Nginx Config](nginx/lab.conf) — reverse proxy sample
