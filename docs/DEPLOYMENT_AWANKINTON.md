# Strategi Deployment: Digital Lab SMA UII di Awankinton

**Panduan bertahap deploy platform Digital Lab ke infrastruktur Awankinton (Koneksi Cloud) dan integrasi dengan SLiMS.**

---

## Kondisi Infrastruktur Saat Ini

### Arsitektur Proxy Awankinton

```
Internet :80/:443
    │
    ▼
nginx-proxy (nginx:stable-alpine, 172.23.0.9)
    │  ← SATU-SATUNYA container yang expose 0.0.0.0:80/443 ke internet
    │  ← SSL via Let's Encrypt (/etc/letsencrypt)
    │  ← Konfigurasi di /home/dev/web/infrastructure/nginx/conf.d/
    │
    ├── conf.d/smauii/library.conf → proxy_pass http://smauii-slims-app:80
    ├── conf.d/smauii/moodle.conf  → proxy_pass http://smauii-moodle-moodle-app
    └── conf.d/smauii/lab.conf     ← AKAN DITAMBAHKAN → proxy_pass http://smauii-lab-app:3000
```

> **Penting:** `traefik-proxy` hanya bind ke `127.0.0.1` (internal), bukan yang handle traffic internet. Semua routing publik melalui `nginx-proxy`.

### Container Relevan (nginx-net: 172.23.0.0/16)

| Container | IP | Fungsi |
|-----------|-----|--------|
| `nginx-proxy` | 172.23.0.9 | Reverse proxy utama, expose 80/443 |
| `smauii-slims-app` | 172.23.0.12 | SLiMS 9.6.1 (Apache) |
| `smauii-moodle-moodle-app` | 172.23.0.6 | Moodle (LMS existing) |
| `traefik-proxy` | 172.23.0.7 | Internal routing (127.0.0.1 only) |

### Network

```
nginx-net      → semua service smauii + nginx-proxy (komunikasi internal)
net-smauii     → network khusus smauii (sudah ada)
awankinton-net → network global Awankinton
```

### Plugin SLiMS yang Sudah Ada

```
/plugins/member_self_registration  → registrasi mandiri anggota
/plugins/slims-doctor              → health check & diagnostics (sandikodev)
```

---

## Arsitektur Target

```
Internet :80/:443
    │
    ▼
nginx-proxy (nginx:stable-alpine, 172.23.0.9)
    │  conf.d/smauii/library.conf → http://smauii-slims-app:80
    │  conf.d/smauii/moodle.conf  → http://smauii-moodle-moodle-app
    │  conf.d/smauii/lab.conf     → http://smauii-lab-app:3000  ← BARU
    │
    ├── smauii-slims-app (existing, nginx-net)
    │       └── /plugins/lab-digital-api/ ← plugin baru
    └── smauii-lab-app (baru, nginx-net + net-smauii)
            ├── Turso (remote DB)
            └── http://smauii-slims-app/plugins/lab-digital-api (internal)
```

**Kunci:** `smauii-lab-app` join `nginx-net` agar bisa di-proxy oleh `nginx-proxy`, dan join `net-smauii` agar bisa komunikasi internal ke `smauii-slims-app` tanpa expose port.

---

## Fase 1 — Plugin SLiMS: `lab-digital-api`

### Tujuan

Menggantikan mock data NISN dengan data real dari database SLiMS.

### Endpoint

```
GET /plugins/lab-digital-api/?action=verify&nisn={nisn}
Header: X-Lab-API-Key: {key}

Response 200:
{
  "found": true,
  "nisn": "1234567890",
  "nis": "12345",
  "name": "Nama Siswa",
  "class": "XII IPA 1",
  "email": "siswa@smauii.sch.id",
  "membership_expired": "2026-08-12",
  "is_expired": false
}

Response 404: { "found": false }
Response 401: { "error": "Unauthorized" }
```

### Struktur Plugin

```
plugins/lab-digital-api/
  index.php    ← entry point SLiMS
  README.md
```

### Implementasi `index.php`

Plugin menggunakan `\SLiMS\DB` yang sudah tersedia — tidak perlu koneksi baru.

```php
<?php
/**
 * Lab Digital API — REST endpoint untuk platform Digital Lab SMA UII
 * Kompatibel dengan SLiMS 9.x
 */

defined('INDEX_AUTH') or die('Direct access not allowed!');

// API Key validation
$api_key = $_SERVER['HTTP_X_LAB_API_KEY'] ?? '';
$valid_key = defined('LAB_API_KEY') ? LAB_API_KEY : getenv('LAB_API_KEY');

if (empty($valid_key) || $api_key !== $valid_key) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . (getenv('LAB_ORIGIN') ?: 'https://lab.smauiiyk.sch.id'));

$action = $_GET['action'] ?? '';
$dbs = \SLiMS\DB::getInstance('mysqli');

if ($action === 'verify') {
    $nisn = trim($_GET['nisn'] ?? '');
    if (empty($nisn)) {
        http_response_code(400);
        echo json_encode(['error' => 'NISN required']);
        exit;
    }

    // SLiMS menyimpan NISN di custom_field atau member_id tergantung konfigurasi
    // Coba member_id dulu (umumnya dipakai sebagai NISN di SMA)
    $stmt = $dbs->prepare("
        SELECT member_id, member_name, member_email, member_code,
               expired_date, inst_name, gd_id
        FROM member
        WHERE member_id = ? OR member_code = ?
        LIMIT 1
    ");
    $stmt->execute([$nisn, $nisn]);
    $member = $stmt->fetch(\PDO::FETCH_ASSOC);

    if (!$member) {
        http_response_code(404);
        echo json_encode(['found' => false]);
        exit;
    }

    $expired = $member['expired_date'] ? new DateTime($member['expired_date']) : null;
    $now = new DateTime();

    echo json_encode([
        'found'               => true,
        'nisn'                => $member['member_id'],
        'nis'                 => $member['member_code'],
        'name'                => $member['member_name'],
        'email'               => $member['member_email'] ?? '',
        'class'               => $member['inst_name'] ?? '',
        'membership_expired'  => $member['expired_date'],
        'is_expired'          => $expired ? $expired < $now : false,
    ]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Unknown action']);
```

### Deploy Plugin

```bash
# Di server Awankinton
mkdir -p /home/dev/web/instances/smauii/services/slims/plugins/lab-digital-api
# Copy index.php ke direktori tersebut

# Plugin sudah ter-mount via docker-compose SLiMS yang ada
# Verifikasi mount di docker-compose SLiMS:
# - /home/dev/web/instances/smauii/services/slims/plugins/lab-digital-api:/var/www/html/slims/plugins/lab-digital-api
```

### Test Plugin

```bash
# Dari dalam net-smauii (atau server host)
curl -H "X-Lab-API-Key: your-key" \
  "http://smauii-slims-app/plugins/lab-digital-api/?action=verify&nisn=1234567890"
```

---

## Fase 2 — Dockerfile

```dockerfile
# Dockerfile
FROM oven/bun:1.3-alpine AS builder
WORKDIR /app

# Install git untuk submodule
RUN apk add --no-cache git

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
# Init submodule konten
RUN git submodule update --init --recursive
RUN bun run build

FROM oven/bun:1.3-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
ENV HOST=0.0.0.0 PORT=3000
CMD ["node", "dist/server/entry.mjs"]
```

---

## Fase 3b — Konfigurasi nginx-proxy

Buat file `/home/dev/web/infrastructure/nginx/conf.d/smauii/lab.conf`:

```nginx
# HTTP → redirect ke HTTPS
server {
    listen 80;
    server_name lab.smauiiyk.sch.id;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl;
    server_name lab.smauiiyk.sch.id;

    ssl_certificate     /etc/letsencrypt/live/lab.smauiiyk.sch.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lab.smauiiyk.sch.id/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://smauii-lab-app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Setelah file dibuat, reload nginx-proxy:
```bash
docker exec nginx-proxy nginx -t && docker exec nginx-proxy nginx -s reload
```

## Fase 3 — Docker Compose

```yaml
# /home/dev/web/instances/smauii/lab/docker-compose.yml
name: smauii-lab

services:
  app:
    image: smauii-lab:latest
    container_name: smauii-lab-app
    restart: unless-stopped
    env_file: .env
    networks:
      - nginx-net    # agar bisa di-proxy oleh nginx-proxy
      - net-smauii   # agar bisa komunikasi internal ke smauii-slims-app

networks:
  nginx-net:
    external: true
  net-smauii:
    external: true
```

> Tidak ada label Traefik — routing ditangani oleh `nginx-proxy` via file konfigurasi di `conf.d/smauii/lab.conf`.

### `.env` (dari `.env.example`)

```env
TURSO_URL=libsql://smauiilab-prev-sandikodev.aws-ap-northeast-1.turso.io
TURSO_AUTH_TOKEN=...
LUCIA_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
SLIMS_API_URL=http://smauii-slims-app/plugins/lab-digital-api
SLIMS_API_KEY=...
PUBLIC_SITE_URL=https://lab.smauiiyk.sch.id
NODE_ENV=production
```

---

## Fase 4 — Update Integrasi SLiMS di Platform

Ganti mock data di `src/pages/api/slims/verify.ts`:

```typescript
export const POST: APIRoute = async ({ request }) => {
  const { nisn } = await request.json();

  const res = await fetch(
    `${import.meta.env.SLIMS_API_URL}/?action=verify&nisn=${nisn}`,
    { headers: { 'X-Lab-API-Key': import.meta.env.SLIMS_API_KEY } }
  );

  if (!res.ok) return new Response(
    JSON.stringify({ error: 'SLiMS tidak tersedia' }), { status: 503 }
  );

  const data = await res.json();
  if (!data.found) return new Response(
    JSON.stringify({ error: 'NISN tidak ditemukan' }), { status: 404 }
  );

  return new Response(JSON.stringify({
    nisn: data.nisn,
    nis: data.nis,
    name: data.name,
    email: data.email,
    class: data.class,
    isExpired: data.is_expired,
    expiredAt: data.membership_expired,
    isPending: false,
  }));
};
```

---

## Fase 5 — CI/CD GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Awankinton

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true
          token: ${{ secrets.GH_TOKEN }}

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/dev/web/instances/smauii/lab
            git pull origin main
            git submodule update --init --recursive
            docker build -t smauii-lab:latest /home/dev/project/smauii-dev-foundation
            docker compose up -d
            docker image prune -f
```

---

## Checklist

### Fase 1 — Plugin SLiMS
- [ ] Buat `plugins/lab-digital-api/index.php`
- [ ] Tambahkan mount di docker-compose SLiMS
- [ ] Generate API key: `openssl rand -hex 32`
- [ ] Simpan API key di `.env` server dan di secrets GitHub
- [ ] Test: `curl -H "X-Lab-API-Key: ..." http://smauii-slims-app/plugins/lab-digital-api/?action=verify&nisn=xxx`
- [ ] Verifikasi field NISN di tabel `member` SLiMS (apakah `member_id` atau custom field)

### Fase 2-3 — Docker
- [ ] Buat `Dockerfile` di root repo
- [ ] Buat direktori `/home/dev/web/instances/smauii/lab/`
- [ ] Buat `docker-compose.yml` dan `.env`
- [ ] Build: `docker build -t smauii-lab:latest .`
- [ ] Run: `docker compose up -d`
- [ ] Verifikasi Traefik routing

### Fase 4 — Integrasi
- [ ] Update `src/pages/api/slims/verify.ts`
- [ ] Test registrasi dengan NISN nyata
- [ ] Hapus mock data

### Fase 5 — CI/CD
- [ ] Setup GitHub secrets
- [ ] Test auto-deploy dari push ke main

---

## Catatan

**NISN di SLiMS:** Perlu dicek apakah NISN disimpan di `member_id`, `member_code`, atau custom field. Jalankan query ini di phpMyAdmin SLiMS untuk verifikasi:
```sql
DESCRIBE member;
SELECT member_id, member_code, member_name FROM member LIMIT 5;
```

**Submodule di Docker build:** Butuh SSH key atau GitHub token untuk clone `smauii-dev-content` saat build. Alternatif: gunakan HTTPS dengan token di Dockerfile.

**Turso tetap remote:** Tidak perlu database lokal di Awankinton — Turso sudah production-ready dan latency ke server Indonesia acceptable.
