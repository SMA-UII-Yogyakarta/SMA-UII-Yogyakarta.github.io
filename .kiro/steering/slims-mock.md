# SLIMS Integration & Mock Data

## Status Saat Ini

**Mock data** — API SLiMS belum tersedia. File: `src/pages/api/slims/verify.ts`

Endpoint ini dipakai saat registrasi untuk verifikasi NISN siswa. Saat ini hanya 8 NISN yang bisa mendaftar.

---

## Cara Expand Mock Data

Saat ada siswa baru yang perlu registrasi tapi NISN-nya tidak ada di mock, tambahkan ke array `MOCK_SLIMS_DATA`:

```ts
// src/pages/api/slims/verify.ts
const MOCK_SLIMS_DATA: MockMember[] = [
  // ... data yang sudah ada ...

  // Tambahkan di sini:
  {
    nisn: '1234',           // NISN siswa (string)
    name: 'NAMA LENGKAP',   // Huruf kapital semua (sesuai data sekolah)
    email: '1234@students.smauiiyk.sch.id',  // Format: nisn@students.smauiiyk.sch.id
    class: 'X IPA 1',       // Format kelas yang valid (lihat classOptions di validation.ts)
    expiredAt: '2027-08-12', // Tanggal expired keanggotaan SLiMS
    isPending: false,        // false = aktif, true = pending di SLiMS
  },
];
```

### Format kelas yang valid
```
X IPA 1, X IPA 2, X IPA 3, X IPA 4
X IPS 1, X IPS 2, X IPS 3
XI IPA 1, XI IPA 2, XI IPA 3, XI IPA 4
XI IPS 1, XI IPS 2, XI IPS 3
XII IPA 1, XII IPA 2, XII IPA 3, XII IPA 4
XII IPS 1, XII IPS 2, XII IPS 3
```

---

## Data Mock yang Sudah Ada

| NISN | Nama | Kelas | Expired |
|------|------|-------|---------|
| 1724 | ALPIS GELIRIS TARI | XII IPA 1 | 2026-08-12 |
| 1751 | ARIF MUHAMMAD MUNIF | XII IPA 2 | 2026-08-12 |
| 1725 | ATFAL MAULANA YULIANTO | XI IPA 1 | 2026-08-12 |
| 1739 | DEVITASARI | XII IPS 1 | 2026-08-12 |
| 1738 | DIANA ARI MINARSIH | XII IPA 3 | 2026-08-12 |
| 1763 | AHMAD ZIDAN | X IPA 1 | 2024-03-27 (expired) |
| 1800 | ACHMAD KHASAN NURWAHIDIN | XII IPA 1 | 2024-03-27 (expired) |
| 1812 | ABDUL RAHIM ABUBAKAR | X IPS 1 | 2024-03-27 (expired) |

---

## Logika Verifikasi

```
NISN ditemukan di mock?
  → Tidak → 404 MEMBER_NOT_FOUND
  → Ya → cek expiredAt
    → Expired → response dengan isExpired: true (registrasi tetap bisa lanjut)
    → Belum expired → response dengan isExpired: false
```

Response sukses:
```json
{
  "data": {
    "nisn": "1724",
    "nis": "1724",
    "name": "ALPIS GELIRIS TARI",
    "email": "1724@students.smauiiyk.sch.id",
    "class": "XII IPA 1",
    "isExpired": false,
    "expiredAt": "2026-08-12",
    "isPending": false
  }
}
```

---

## Implementasi API SLiMS (Masa Depan)

Ketika API SLiMS sudah tersedia, ganti mock dengan real API call:

```ts
export const POST: APIRoute = async ({ request }) => {
  const { nisn } = await request.json();

  // Ganti mock dengan real API call
  const response = await fetch(`${import.meta.env.SLIMS_API_URL}/members/${nisn}`, {
    headers: {
      'Authorization': `Bearer ${import.meta.env.SLIMS_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return createErrorResponse('NISN tidak ditemukan di SLiMS', 404, { code: 'MEMBER_NOT_FOUND' });
  }

  const member = await response.json();
  return createSuccessResponse({
    nisn: member.nisn,
    nis: member.nis,
    name: member.name,
    email: member.email,
    class: member.class,
    isExpired: new Date(member.expiredAt) < new Date(),
    expiredAt: member.expiredAt,
    isPending: member.isPending,
  });
};
```

Env vars yang dibutuhkan (sudah ada di `.env.example`):
```
SLIMS_API_URL=https://slims.smauiiyk.sch.id/api
SLIMS_API_KEY=your-slims-api-key
```

---

## Catatan

- NISN di mock adalah string pendek (4 digit) — berbeda dengan NISN nasional (10 digit)
- Ini karena data SLiMS sekolah menggunakan NIS lokal, bukan NISN nasional
- Field `nis` di response diisi sama dengan `nisn` karena mock tidak punya data NIS terpisah
