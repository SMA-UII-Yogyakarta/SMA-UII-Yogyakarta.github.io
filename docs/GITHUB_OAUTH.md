# GitHub OAuth Setup

Admin login menggunakan GitHub OAuth. **Hanya user `sandikodev` yang bisa login.**

## Setup GitHub OAuth App

1. Buka https://github.com/settings/developers
2. Klik **"New OAuth App"** atau **"Register a new application"**
3. Isi form:

```
Application name: SMA UII Lab Digital
Homepage URL: https://lab.smauiiyk.sch.id
Application description: Platform komunitas developer SMA UII Yogyakarta untuk pendaftaran anggota, tracking kontribusi, dan akses ke learning materials
Authorization callback URL: https://lab.smauiiyk.sch.id/api/auth/github/callback
```

4. Klik **"Register application"**
5. Copy **Client ID** dan generate **Client Secret**

## Environment Variables

Tambahkan ke `.env`:

```bash
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
PUBLIC_SITE_URL=https://lab.smauiiyk.sch.id
```

Untuk development local:

```bash
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
PUBLIC_SITE_URL=http://localhost:4321
```

**Note:** Untuk local development, buat OAuth App terpisah dengan callback URL `http://localhost:4321/api/auth/github/callback`

## Deploy ke GitHub

Set secrets di GitHub repository:

```bash
gh secret set GITHUB_CLIENT_ID --body "your_client_id"
gh secret set GITHUB_CLIENT_SECRET --body "your_client_secret"
```

Atau via GitHub UI:
1. Repository → Settings → Secrets and variables → Actions
2. New repository secret
3. Tambahkan `GITHUB_CLIENT_ID` dan `GITHUB_CLIENT_SECRET`

## Security

### Hardcoded Restriction

Login **hanya** untuk user GitHub `sandikodev`. Ini di-hardcode di `/src/pages/api/auth/github/callback.ts`:

```typescript
// SECURITY: Only allow sandikodev to login
if (githubUser.login !== 'sandikodev') {
  return new Response('Unauthorized: Only admin can login via GitHub', { 
    status: 403 
  });
}
```

### No Password Login

- ❌ Tidak ada password login
- ❌ Tidak ada email/password registration untuk admin
- ✅ Hanya GitHub OAuth
- ✅ Hanya user `sandikodev`

## Usage

### Login Flow

1. User mengakses `/login`
2. Klik "Login with GitHub"
3. Redirect ke GitHub OAuth
4. GitHub meminta authorization
5. Callback ke `/api/auth/github/callback`
6. Validasi user = `sandikodev`
7. Create session
8. Redirect ke `/admin`

### Logout

```html
<form action="/api/auth/logout" method="POST">
  <button type="submit">Logout</button>
</form>
```

## Testing

### Local Development

1. Setup OAuth App untuk localhost
2. Set env variables
3. Run dev server: `pnpm dev`
4. Akses http://localhost:4321/login
5. Login dengan GitHub account `sandikodev`
6. Redirect ke http://localhost:4321/admin

### Production

1. Setup OAuth App untuk production domain
2. Set GitHub secrets
3. Deploy
4. Akses https://lab.smauiiyk.sch.id/login
5. Login dengan GitHub account `sandikodev`

## Troubleshooting

### Error: "Unauthorized: Only admin can login via GitHub"

- Pastikan login dengan account GitHub `sandikodev`
- User lain tidak bisa login (by design)

### Error: "User not found in database"

- Pastikan database sudah di-seed
- User `sandikodev` harus ada di database dengan `githubUsername = 'sandikodev'`
- Run: `bun run db:seed`

### Error: "Invalid state"

- Clear cookies dan coba lagi
- State expired (10 menit)

### Error: "OAuth2RequestError"

- Check CLIENT_ID dan CLIENT_SECRET
- Pastikan callback URL sesuai

## Database Schema

User `sandikodev` di database:

```sql
INSERT INTO users (
  id, nisn, nis, name, email,
  githubUsername, githubId,
  class, role, status,
  joinedAt, approvedAt, approvedBy
) VALUES (
  'xxx', '0000000001', 'ADMIN001', 'Sandikodev', 'sandikodev@example.com',
  'sandikodev', NULL,  -- githubId will be filled on first login
  'Alumni', 'maintainer', 'active',
  NOW(), NOW(), 'xxx'
);
```

Saat first login, `githubId` akan di-update otomatis.

## Admin Routes

Setelah login, admin bisa akses:

- `/admin` - Dashboard utama
- `/admin/members` - Manage members (TODO)
- `/admin/projects` - Manage projects (TODO)

Semua route `/admin/*` harus di-protect dengan auth check.
