# Database Management

Database menggunakan **Turso** (LibSQL) dengan **Drizzle ORM**.

> **Package manager: `bun`** — semua command menggunakan `bun run`.

## Setup

1. Copy `.env.example` ke `.env` dan isi credentials Turso
2. Push schema ke database: `bun run db:push`
3. Seed data awal: `bun run db:setup:enhanced`

## Available Commands

```bash
# Push schema langsung ke database (dev)
bun run db:push

# Open Drizzle Studio (database GUI)
bun run db:studio

# Reset + seed ulang database (dev)
bun run db:setup:enhanced
```

## Schema Overview

### Tables (Saat Ini)

1. **users** — Data anggota (siswa, maintainer)
   - NIS/NISN untuk verifikasi dengan SLiMS
   - GitHub account linking
   - Status: `pending`, `active`, `inactive`
   - Role: `member`, `maintainer`
   - ⚠️ Role `alumni` direncanakan tapi belum ada di schema — lihat backlog

2. **member_tracks** — Track minat yang diikuti member
   - Many-to-many relationship dengan users
   - Track: `robotika`, `ai`, `data-science`, `network`, `security`, `software`

3. **sessions** — Auth sessions (Lucia v3)
   - Session management untuk login

4. **member_cards** — Kartu anggota digital
   - Card number unik (format: `SMAUII-<base36timestamp>`)
   - QR code (base64 data URL) untuk identifikasi
   - Di-generate otomatis saat maintainer approve member

5. **activities** — Log aktivitas member
   - Type: `contribution`, `event`, `workshop`, `meeting`, `other`
   - Tracking kontribusi dan partisipasi
   - ⚠️ Edit activity (PATCH) belum ada — lihat backlog

6. **notifications** — Notifikasi in-app per user
   - Auto-generated saat approval dan pengumuman baru

7. **announcements** — Pengumuman dari maintainer
   - Broadcast ke semua active member via notifikasi + email
   - ⚠️ Pin announcement belum ada — lihat backlog

8. **projects** — Showcase proyek member
   - Mendukung image upload (base64, maks 2MB)

9. **learning_progress** — Progress belajar per lesson
   - Tandai selesai per lesson slug

10. **reading_sessions** — Sesi baca per lesson
    - Tracking waktu aktif membaca
    - Dipakai untuk contribution graph

### Fields yang Direncanakan (Belum Ada di Schema)

| Field | Table | Keterangan |
|-------|-------|-----------|
| `avatarUrl` | `users` | Foto profil member — saat ini hanya initial huruf |
| `isPinned` | `announcements` | Pin pengumuman penting ke atas |
| `role: 'alumni'` | `users` | Role untuk alumni siswa yang sudah lulus |

## Workflow

### 1. Pendaftaran Member Baru

```
User Register → Pending Status → Maintainer Approve → Active + Card Generated + Email Sent
```

### 2. Schema Changes

```bash
# 1. Edit src/db/schema.ts
# 2. Push ke database (dev)
bun run db:push

# Production: jalankan migration
bun run db:migrate
```

### 3. Switching Database (Dev ↔ Prod)

Edit `.env`:

```bash
# Development (db-preview)
TURSO_URL=libsql://your-db-preview.turso.io
TURSO_TOKEN=<dev-token>

# Production (db-production)
TURSO_URL=libsql://your-db-production.turso.io
TURSO_TOKEN=<prod-token>
```

**Jangan pernah** gunakan prefix `PUBLIC_` untuk `TURSO_URL` atau `TURSO_TOKEN` — ini akan mengekspos credentials ke browser.

## Drizzle Studio

```bash
bun run db:studio
# Akses di: https://local.drizzle.studio
```

## Backup & Restore

```bash
# Backup via Turso CLI
turso db shell db-preview ".dump" > backup.sql

# Restore
turso db shell db-preview < backup.sql
```

## Security Notes

- ⚠️ **JANGAN commit `.env`** ke git
- ✅ Turso tokens sudah di `.gitignore`
- ❌ **JANGAN** gunakan `PUBLIC_TURSO_URL` atau `PUBLIC_TURSO_TOKEN` — ter-expose ke browser
- ✅ Semua DB access hanya dari server-side (API routes, middleware, frontmatter)

## Troubleshooting

### Error: "No such table"

```bash
bun run db:push
```

### Reset Database (dev only)

```bash
bun run db:setup:enhanced
```
