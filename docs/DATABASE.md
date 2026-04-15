# Database Management

Database menggunakan **Turso** (LibSQL) dengan **Drizzle ORM**.

## Setup

1. Copy `.env.example` ke `.env` dan isi credentials Turso
2. Generate migrations: `pnpm db:generate`
3. Push schema ke database: `pnpm db:push`
4. Seed data awal: `pnpm db:seed`

## Available Commands

### Development

```bash
# Generate migration dari schema changes
pnpm db:generate

# Push schema langsung ke database (tanpa migration file)
pnpm db:push

# Pull schema dari database ke local
pnpm db:pull

# Run migrations
pnpm db:migrate

# Open Drizzle Studio (database GUI)
pnpm db:studio

# Seed database dengan sample data
pnpm db:seed
```

### Maintenance

```bash
# Check migration status
pnpm db:check

# Drop migration
pnpm db:drop

# Upgrade Drizzle Kit
pnpm db:up
```

## Schema Overview

### Tables

1. **users** - Data anggota (siswa, alumni, maintainer)
   - NISN/NIS untuk verifikasi dengan SLiMS
   - GitHub account linking
   - Status: pending, active, inactive
   - Role: member, maintainer, alumni

2. **member_tracks** - Track minat yang diikuti member
   - Many-to-many relationship dengan users
   - Track: robotika, ai, data-science, network, security, software

3. **sessions** - Auth sessions (Lucia)
   - Session management untuk login

4. **member_cards** - Kartu anggota digital
   - Card number unik
   - QR code untuk check-in
   - Issued setelah approval

5. **activities** - Log aktivitas member
   - Type: project, contribution, attendance, achievement
   - Tracking kontribusi dan partisipasi

## Workflow

### 1. Pendaftaran Member Baru

```
User Register → Pending Status → Maintainer Approve → Active + Card Generated
```

### 2. Schema Changes

```bash
# 1. Edit src/db/schema.ts
# 2. Generate migration
pnpm db:generate

# 3. Review migration file di drizzle/
# 4. Push to database
pnpm db:push
```

### 3. Switching Database (Dev ↔ Prod)

Edit `.env`:

```bash
# Development
PUBLIC_TURSO_URL=libsql://smauiilab-prev-sandikodev.aws-ap-northeast-1.turso.io
PUBLIC_TURSO_TOKEN=<dev-token>

# Production
PUBLIC_TURSO_URL=libsql://smauiilab-sandikodev.aws-us-east-1.turso.io
PUBLIC_TURSO_TOKEN=<prod-token>
```

## Drizzle Studio

Buka database GUI:

```bash
pnpm db:studio
```

Akses di: https://local.drizzle.studio

## Backup & Restore

### Backup

```bash
# Via Turso CLI
turso db shell smauiilab-prev-sandikodev ".dump" > backup.sql
```

### Restore

```bash
turso db shell smauiilab-prev-sandikodev < backup.sql
```

## Security Notes

- ⚠️ **JANGAN commit `.env`** ke git
- ✅ Turso tokens sudah di `.gitignore`
- ✅ Gunakan `PUBLIC_*` prefix untuk env vars yang di-expose ke client
- ✅ Sensitive operations (approve member, generate card) harus di server-side

## Troubleshooting

### Error: "No such table"

```bash
pnpm db:push
```

### Error: "Migration conflict"

```bash
pnpm db:drop
pnpm db:generate
pnpm db:push
```

### Reset Database

```bash
# Drop all tables
turso db shell smauiilab-prev-sandikodev "DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS member_tracks; DROP TABLE IF EXISTS sessions; DROP TABLE IF EXISTS member_cards; DROP TABLE IF EXISTS activities;"

# Re-push schema
pnpm db:push

# Re-seed
pnpm db:seed
```
