# GitHub OAuth Setup

GitHub OAuth digunakan sebagai salah satu metode login untuk semua member yang sudah terdaftar di database.

> **Catatan penting:** GitHub OAuth **tidak** membuat akun baru secara otomatis. User harus sudah terdaftar di database (via registrasi normal) dan memiliki `githubUsername` yang sesuai. Ini bukan login khusus admin — semua member bisa login via GitHub.

## Setup GitHub OAuth App

1. Buka https://github.com/settings/developers
2. Klik **"New OAuth App"**
3. Isi form:

```
Application name: SMA UII Lab Digital
Homepage URL: https://lab.smauiiyk.sch.id
Authorization callback URL: https://lab.smauiiyk.sch.id/api/auth/github/callback
```

4. Klik **"Register application"**
5. Copy **Client ID** dan generate **Client Secret**

## Environment Variables

Tambahkan ke `.env`:

```bash
OAUTH_GITHUB_CLIENT_ID=your_client_id_here
OAUTH_GITHUB_CLIENT_SECRET=your_client_secret_here
PUBLIC_SITE_URL=https://lab.smauiiyk.sch.id
```

Untuk development local, buat OAuth App terpisah dengan callback URL `http://localhost:4321/api/auth/github/callback`:

```bash
OAUTH_GITHUB_CLIENT_ID=your_dev_client_id
OAUTH_GITHUB_CLIENT_SECRET=your_dev_client_secret
PUBLIC_SITE_URL=http://localhost:4321
```

## Deploy ke GitHub

Set secrets di GitHub repository:

```bash
gh secret set OAUTH_GITHUB_CLIENT_ID --body "your_client_id"
gh secret set OAUTH_GITHUB_CLIENT_SECRET --body "your_client_secret"
```

## Cara Kerja Login GitHub

### Flow

1. User klik "Login with GitHub" di `/login`
2. Redirect ke GitHub OAuth
3. Callback ke `/api/auth/github/callback`
4. Cari user di DB berdasarkan `githubUsername` → jika tidak ketemu, coba `githubId`
5. Jika user tidak ditemukan → error 403 (belum terdaftar)
6. Jika ditemukan:
   - Update `githubId` dan `githubUsername` jika berubah
   - Cek status: `pending` → redirect `/check-status`, `inactive` → redirect `/login?error=inactive`
   - Buat session → redirect ke dashboard

### Implementasi

File: `src/pages/api/auth/github/callback.ts`

```typescript
// Cari user berdasarkan githubUsername dulu, lalu githubId
let existingUser = await db.query.users.findFirst({
  where: eq(users.githubUsername, githubUser.login),
});
if (!existingUser) {
  existingUser = await db.query.users.findFirst({
    where: eq(users.githubId, githubUser.id.toString()),
  });
}

// Jika tidak ditemukan → tolak
if (!existingUser) {
  return createErrorResponse('GitHub username not registered. Please contact administrator.', 403);
}
```

### Syarat Bisa Login via GitHub

1. User sudah terdaftar di database (via registrasi normal)
2. Field `githubUsername` di database sesuai dengan username GitHub yang dipakai login
3. Status user bukan `inactive`

### First-time GitHub Login

Saat pertama kali login via GitHub, sistem akan:
- Mengisi field `githubId` dengan ID numerik dari GitHub
- Mengupdate `githubUsername` jika berubah
- Mengupdate `email` dengan primary email GitHub (jika berbeda)

## Troubleshooting

### Error: "GitHub username not registered"

- User belum terdaftar di database, atau
- `githubUsername` di database tidak sesuai dengan username GitHub yang dipakai
- Solusi: maintainer perlu update field `githubUsername` di database, atau user registrasi dulu

### Error: "Invalid state"

- Clear cookies dan coba lagi
- State parameter expired atau tidak valid

### Error: "OAuth2RequestError"

- Cek `OAUTH_GITHUB_CLIENT_ID` dan `OAUTH_GITHUB_CLIENT_SECRET`
- Pastikan callback URL di GitHub OAuth App sesuai dengan `PUBLIC_SITE_URL`

## Database Schema

Field yang relevan di tabel `users`:

```typescript
githubUsername: text('github_username'),  // nullable, diisi saat registrasi
githubId: text('github_id'),              // nullable, diisi saat first GitHub login
```

Maintainer bisa set `githubUsername` via `/app/settings` atau via admin panel.
