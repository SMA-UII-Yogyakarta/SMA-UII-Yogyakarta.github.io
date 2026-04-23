# Email Notifications

Email notifications menggunakan **Resend** untuk mengirim email otomatis ke member.

## Setup

1. **Daftar Resend**: https://resend.com
2. **Buat API Key**: https://resend.com/api-keys
3. **Tambahkan ke `.env`**:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

## Fitur Email

### 1. Approval Email
Dikirim otomatis saat maintainer approve member baru.

**Trigger**: `POST /api/admin/approve` dengan `action: "approve"`

**Template**: Welcome message + link login

### 2. Announcement Email
Dikirim broadcast ke semua active members saat ada pengumuman baru.

**Trigger**: `POST /api/announcements`

**Recipients**: Semua user dengan `status: "active"` dan email tidak null

## Resend Free Tier

- **3,000 emails/bulan**
- **100 emails/hari**
- 1 domain verified

Estimasi usage Lab Digital:
- Approval: ~10-20/bulan
- Announcements: ~5 broadcast × 100 members = 500/bulan
- **Total: ~600/bulan** (20% dari limit)

## Domain Verification (Production)

Untuk production, verify domain `lab.smauiiyk.sch.id`:

1. Masuk Resend Dashboard → Domains
2. Add domain: `lab.smauiiyk.sch.id`
3. Tambahkan DNS records (SPF, DKIM, DMARC)
4. Update `from` di `src/lib/email.ts`:
   ```ts
   from: 'SMAUII Lab <noreply@lab.smauiiyk.sch.id>'
   ```

Sebelum verify domain, pakai default:
```ts
from: 'onboarding@resend.dev'
```

## Error Handling

Email sending menggunakan `Promise.allSettled()` dan `.catch()` untuk:
- Tidak block approval/announcement jika email gagal
- Log error ke console untuk debugging
- Notifikasi in-app tetap terkirim meski email gagal
