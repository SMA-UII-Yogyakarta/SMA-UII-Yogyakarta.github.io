# Notification System

## Overview

Notifikasi in-app untuk member. Schema ada di tabel `notifications`, helper di `src/lib/notifications.ts`.

---

## Helper Functions

```ts
import { createNotification, notifyAllActiveMembers } from '@lib/notifications';
```

### `createNotification(userId, message)`
Kirim notifikasi ke satu user spesifik.

```ts
// Contoh: notifikasi ke member yang baru diapprove
await createNotification(userId, 'Selamat! Akun kamu telah disetujui. Kartu anggota sudah tersedia.');
```

### `notifyAllActiveMembers(message)`
Broadcast notifikasi ke semua member dengan status `active`.

```ts
// Contoh: notifikasi saat ada pengumuman baru
await notifyAllActiveMembers(`📢 Pengumuman baru: ${title}`);
```

---

## Kapan Harus Trigger Notifikasi

| Event | Helper | Siapa yang dinotifikasi |
|-------|--------|------------------------|
| Member diapprove | `createNotification` | Member yang diapprove |
| Pengumuman baru dibuat | `notifyAllActiveMembers` | Semua active members |
| *(future)* Password diset oleh maintainer | `createNotification` | Member yang bersangkutan |
| *(future)* Project dikomentari | `createNotification` | Pemilik project |

---

## File yang Sudah Punya Trigger

- `src/pages/api/admin/approve.ts` — trigger saat approve member ✅
- `src/pages/api/announcements/index.ts` — trigger saat POST announcement baru ✅

---

## Aturan Penting

1. **Jangan trigger notifikasi di dalam transaction** — notifikasi bukan operasi kritis, jangan bikin transaction gagal karena notifikasi error
2. **Notifikasi adalah fire-and-forget** — tidak perlu await jika tidak kritis, tapi await jika ingin pastikan terkirim
3. **Pesan dalam Bahasa Indonesia** — konsisten dengan UI
4. **Gunakan emoji** untuk visual cue: ✅ approve, 📢 pengumuman, 🔑 password, dll

```ts
// ✅ Benar — notifikasi di luar transaction
await db.transaction(async (tx) => {
  await tx.update(users).set({ status: 'active' }).where(eq(users.id, userId));
  await tx.insert(memberCards).values({ ... });
});
// Notifikasi setelah transaction sukses
await createNotification(userId, 'Akun kamu telah disetujui!');

// ❌ Salah — notifikasi di dalam transaction
await db.transaction(async (tx) => {
  await tx.update(users).set({ status: 'active' }).where(eq(users.id, userId));
  await createNotification(userId, '...'); // bisa bikin transaction gagal
});
```

---

## API Endpoints Notifikasi

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/notifications` | List notifikasi user yang login |
| POST | `/api/notifications/read` | Mark notifikasi sebagai sudah dibaca |

Response GET:
```json
{
  "data": {
    "notifications": [
      { "id": "...", "message": "...", "isRead": 0, "createdAt": 1234567890 }
    ],
    "unreadCount": 3
  }
}
```

---

## UI

Notifikasi ditampilkan di Topbar (bell icon). Logic ada di `src/lib/dashboard-init.ts` dan `src/components/Topbar.astro`.

- Badge merah muncul jika ada notifikasi yang belum dibaca
- Klik bell → dropdown list notifikasi
- Klik notifikasi → mark as read

---

## Menambah Trigger Baru

Jika ada event baru yang perlu notifikasi:

1. Import helper di file API route yang relevan:
   ```ts
   import { createNotification, notifyAllActiveMembers } from '@lib/notifications';
   ```

2. Panggil setelah operasi utama berhasil (di luar transaction):
   ```ts
   // Setelah operasi DB sukses
   await createNotification(targetUserId, 'Pesan notifikasi');
   ```

3. Update tabel di steering ini (bagian "Kapan Harus Trigger Notifikasi")
