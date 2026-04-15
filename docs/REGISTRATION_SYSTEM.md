# SMAUII Lab - Member Registration System

Sistem pendaftaran anggota dengan fitur:
- ✅ Form pendaftaran dengan validasi NISN/NIS (SLiMS integration ready)
- ✅ Link GitHub account
- ✅ Kartu anggota digital dengan QR code
- ✅ Dashboard member
- ✅ Admin approval workflow
- ✅ Activity tracking
- ✅ Client-side rendering dengan React
- ✅ Database Turso (LibSQL) dengan Drizzle ORM
- ✅ Compatible dengan Bun dan Node.js

## Quick Start

### 1. Setup Environment

```bash
# Copy .env.example ke .env
cp .env.example .env

# Edit .env dan isi credentials (sudah ada default untuk dev)
```

### 2. Setup Database

```bash
# Generate migrations
pnpm db:generate

# Run migrations dan seed data
bun run db:setup

# Atau manual:
bun run db:migrate
bun run db:seed
```

### 3. Run Development Server

```bash
pnpm dev
# atau
bun run dev
```

Akses: http://localhost:4321

## Available Pages

- `/` - Homepage
- `/register` - Form pendaftaran anggota
- `/dashboard` - Dashboard member (setelah login)
- `/tracks` - Track minat
- `/projects` - Proyek open source
- `/members` - Daftar anggota
- `/about` - Tentang foundation

## Database Scripts

```bash
# Generate migration dari schema changes
pnpm db:generate

# Run migrations
bun run db:migrate

# Seed sample data
bun run db:seed

# Setup (migrate + seed)
bun run db:setup

# Open Drizzle Studio (GUI)
pnpm db:studio
```

## Architecture

### Tech Stack

- **Framework:** Astro 6.x (Static Site Generator)
- **UI Library:** React 19 (untuk interactive components)
- **Styling:** Tailwind CSS 4.x
- **Database:** Turso (LibSQL/SQLite)
- **ORM:** Drizzle ORM
- **Validation:** Zod
- **Auth:** Lucia (ready, belum diimplementasikan)
- **Runtime:** Bun (recommended) atau Node.js

### Database Schema

```
users (anggota)
├── id, nisn, nis, name, email
├── githubUsername, githubId
├── class, role, status
└── joinedAt, approvedAt, approvedBy

member_tracks (many-to-many)
├── id, userId, track
└── joinedAt

member_cards (kartu digital)
├── id, userId, cardNumber
├── qrCode (base64)
└── issuedAt

activities (log aktivitas)
├── id, userId, type
├── title, description, url
└── createdAt

sessions (auth)
├── id, userId
└── expiresAt
```

### Workflow Pendaftaran

```
1. User mengisi form pendaftaran
   ├── Input NISN/NIS
   ├── Verifikasi dengan SLiMS (mock untuk sementara)
   ├── Auto-fill nama dan kelas dari SLiMS
   ├── Input email dan GitHub username
   └── Pilih 1-3 track minat

2. Submit → Status: PENDING
   └── Data tersimpan di database

3. Maintainer review di dashboard admin
   └── Approve → Status: ACTIVE

4. Kartu anggota digital di-generate
   ├── Card number unik
   ├── QR code untuk check-in
   └── Bisa di-download atau print

5. Member bisa akses dashboard
   ├── Lihat kartu anggota
   ├── Track aktivitas
   └── Kontribusi ke proyek
```

## Development

### Bun (Recommended)

```bash
# Install dependencies
bun install

# Run dev server
bun run dev

# Build
bun run build

# Database operations
bun run db:setup
bun run db:seed
```

### Node.js + pnpm

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build
pnpm build

# Database operations (gunakan tsx untuk TypeScript)
pnpm db:seed:node
```

## Deployment

### GitHub Pages (Static)

```bash
# Build
pnpm build

# Deploy via GitHub Actions (manual trigger)
gh workflow run deploy.yml
```

### Environment Variables untuk Production

Set di GitHub Secrets:

```
PUBLIC_TURSO_URL=libsql://smauiilab-sandikodev.aws-us-east-1.turso.io
PUBLIC_TURSO_TOKEN=<production-token>
GITHUB_CLIENT_ID=<your-client-id>
GITHUB_CLIENT_SECRET=<your-client-secret>
```

## Next Steps

### Implementasi Selanjutnya

1. **SLiMS API Integration**
   - Plugin API untuk SLiMS
   - Endpoint untuk verifikasi NISN/NIS
   - Auto-sync data siswa

2. **GitHub OAuth**
   - Login dengan GitHub
   - Auto-link GitHub account
   - Fetch contributions dari GitHub API

3. **Admin Dashboard**
   - Approve/reject pendaftaran
   - Manage members
   - Generate reports

4. **Learning Management System (LMS)**
   - Git submodules untuk konten
   - Markdown-based materials
   - Progress tracking

5. **Member Features**
   - Profile page
   - Activity feed
   - Achievement badges
   - Leaderboard

## File Structure

```
smauii-dev-foundation/
├── src/
│   ├── components/          # React components
│   │   ├── RegisterForm.tsx
│   │   └── MemberCard.tsx
│   ├── db/                  # Database
│   │   ├── schema.ts        # Drizzle schema
│   │   └── index.ts         # DB client
│   ├── layouts/
│   │   └── Layout.astro     # Main layout
│   ├── lib/
│   │   └── validation.ts    # Zod schemas
│   ├── pages/               # Routes
│   │   ├── index.astro
│   │   ├── register.astro
│   │   ├── dashboard.astro
│   │   └── api/
│   │       └── register.ts  # API endpoint
│   └── styles/
│       └── global.css
├── scripts/
│   ├── migrate.ts           # Run migrations
│   └── seed.ts              # Seed data
├── drizzle/                 # Migrations (generated)
├── docs/
│   └── DATABASE.md          # Database docs
├── .env                     # Environment variables
├── drizzle.config.ts        # Drizzle config
└── astro.config.mjs         # Astro config
```

## Troubleshooting

### Database Connection Error

```bash
# Check .env file
cat .env | grep TURSO

# Test connection
bun run db:studio
```

### Migration Error

```bash
# Reset and re-run
bun run db:migrate
```

### Seed Error

```bash
# Clear and re-seed
# (implement db:reset script if needed)
bun run db:seed
```

## Contributing

Lihat [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan kontribusi.

## License

MIT - lihat [LICENSE](LICENSE)
