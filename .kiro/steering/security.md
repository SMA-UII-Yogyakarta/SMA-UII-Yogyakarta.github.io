# Security Patterns

## Environment Variables

### Aturan Ketat
- **JANGAN** gunakan prefix `PUBLIC_` untuk secrets atau database credentials
- `PUBLIC_` berarti nilai ter-expose ke browser — siapapun bisa lihat di DevTools
- Satu-satunya `PUBLIC_` yang diizinkan: `PUBLIC_SITE_URL` dan `PUBLIC_SITE_NAME`

```bash
# ✅ Benar — server-only
TURSO_URL=libsql://...
TURSO_TOKEN=...
OAUTH_GITHUB_CLIENT_SECRET=...

# ❌ Salah — ter-expose ke browser
PUBLIC_TURSO_URL=libsql://...
PUBLIC_TURSO_TOKEN=...
```

### Akses di kode
```ts
// Server-side (API routes, middleware, .astro frontmatter)
import.meta.env.TURSO_URL      // ✅
import.meta.env.TURSO_TOKEN    // ✅

// Client-side (script tag, React component)
import.meta.env.PUBLIC_SITE_URL  // ✅ hanya ini yang boleh
```

---

## XSS Prevention

### Server-side rendering (Astro templates)
Astro otomatis escape nilai yang di-render via `{expression}`:
```astro
<!-- ✅ Aman — Astro escape otomatis -->
<p>{user.name}</p>

<!-- ❌ Berbahaya — bypass escape -->
<p set:html={user.name}></p>
```

### Client-side innerHTML (script tags)
**Selalu** gunakan `esc()` sebelum interpolasi ke innerHTML:
```js
function esc(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'}[c])
  );
}

// ✅ Aman
el.innerHTML = `<p>${esc(user.name)}</p>`;

// ❌ Berbahaya — XSS jika user.name mengandung <script>
el.innerHTML = `<p>${user.name}</p>`;
```

### API routes — sanitize sebelum simpan ke DB
```ts
import { escapeHtml, sanitizeObject } from '@lib/api-utils';

// Single string
const safeName = escapeHtml(body.name);

// Seluruh object
const safeBody = sanitizeObject(body);
```

---

## Authentication & Session

### Session cookie (dikelola Lucia)
- `httpOnly: true` — tidak bisa diakses JavaScript browser
- `secure: true` di production — hanya HTTPS
- `sameSite: 'lax'` — proteksi CSRF dasar

### Jangan pernah validasi session manual di API routes
```ts
// ❌ Salah — double DB query, middleware sudah handle ini
const { session, user } = await lucia.validateSession(sessionId);

// ✅ Benar — pakai dari locals
const { user } = locals;
if (!user) return createErrorResponse('Unauthorized', 401);
```

### Password hashing
Selalu gunakan `@node-rs/argon2` — jangan MD5, SHA1, atau bcrypt:
```ts
import { hash, verify } from '@node-rs/argon2';

// Hash saat set password
const passwordHash = await hash(password);

// Verify saat login
const valid = await verify(user.passwordHash, password);
```

---

## Security Headers

Sudah dikonfigurasi di `src/middleware.ts` untuk semua response:

| Header | Nilai | Tujuan |
|--------|-------|--------|
| `X-Content-Type-Options` | `nosniff` | Cegah MIME sniffing |
| `X-Frame-Options` | `DENY` | Cegah clickjacking |
| `X-XSS-Protection` | `1; mode=block` | XSS filter browser lama |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Batasi referrer info |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Batasi browser APIs |
| `Content-Security-Policy` | `default-src 'self'; ...` | Batasi sumber resource |

**Jangan hapus atau override** header ini di middleware.

---

## Input Validation

Semua input dari request body harus divalidasi dengan Zod sebelum diproses:

```ts
import { z } from 'zod';
import { mySchema } from '@lib/validation'; // selalu dari validation.ts

const parsed = mySchema.safeParse(body);
if (!parsed.success) {
  return createErrorResponse('Validasi gagal', 422, {
    code: 'VALIDATION_ERROR',
    details: Object.fromEntries(
      parsed.error.issues.map(i => [i.path[0], i.message])
    ),
  });
}
```

**Jangan** define schema Zod inline di route files — selalu di `src/lib/validation.ts`.

---

## Authorization Checks

Urutan check yang benar di setiap API route:

```ts
export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Cek autentikasi dulu
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);

  // 2. Cek role/permission
  if (user.role !== 'maintainer') return createErrorResponse('Forbidden', 403);

  // 3. Cek ownership (untuk resource milik user)
  const resource = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!resource) return createErrorResponse('Not found', 404);
  if (resource.userId !== user.id && user.role !== 'maintainer') {
    return createErrorResponse('Forbidden', 403);
  }

  // 4. Baru proses request
};
```

**Selalu** cek auth sebelum query DB apapun.

---

## GitHub OAuth Security

- User harus sudah ada di database — tidak ada auto-registration via GitHub
- Match by `githubUsername` dulu, lalu `githubId`
- State parameter divalidasi untuk cegah CSRF pada OAuth flow
- `github_oauth_state` cookie di-clear setelah callback

---

## Database Security

- Semua query pakai Drizzle ORM — tidak ada raw SQL string interpolation
- Drizzle otomatis parameterize query — aman dari SQL injection
- Timestamps disimpan sebagai Unix ms integer — tidak ada string parsing
- IDs menggunakan nanoid — tidak predictable/sequential

---

## Checklist Sebelum Deploy

- [ ] Semua env vars production sudah diset (tidak ada nilai dev/dummy)
- [ ] `TURSO_URL` mengarah ke database production (bukan `smauiilab-prev`)
- [ ] `PUBLIC_SITE_URL` diset ke domain production
- [ ] GitHub OAuth App callback URL sudah diupdate ke domain production
- [ ] Tidak ada `console.log` yang print sensitive data
- [ ] Tidak ada hardcoded credentials di source code
