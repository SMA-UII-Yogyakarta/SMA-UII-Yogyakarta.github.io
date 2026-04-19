# Specs: P3 Polish & Enhancement

## Konteks

Semua item P1 dan P2 sudah selesai. Platform sudah live di production.
P3 adalah fase polish — meningkatkan kualitas pengalaman pengguna tanpa
mengubah fungsionalitas inti.

Beberapa item P3 sudah di-commit (toast, search/filter, progress bars, drawer)
tapi belum diverifikasi di staging dan belum di-deploy ke production.

---

## Status

| Item | Kode | Staging | Production |
|------|------|---------|-----------|
| 3.1 Toast notification | ✅ | ❌ | ❌ |
| 3.3 Search & filter tracks | ✅ | ❌ | ❌ |
| 3.4 Module progress bars | ✅ | ❌ | ❌ |
| 2.4 Mobile lesson drawer | ✅ | ❌ | ❌ |
| 3.2 Carousel "Terakhir Dipelajari" | ✅ | ❌ | ❌ |

> Semua item sudah ada di kode dan sudah diverifikasi/diperbaiki (2026-04-19):
> - Toast: durasi 2500ms, fade in/out smooth, z-index 9999, script dikonsolidasi ke satu block
> - Mobile drawer: animasi slide + fade dengan requestAnimationFrame
> - Search empty state: "Tidak ada track yang cocok" saat hasil kosong
> - Tailwind v4: semua `flex-shrink-0` → `shrink-0` (0 warnings)
> - `bun run check`: 0 errors, 0 warnings, 0 hints
> Siap untuk staging audit dan deploy production.

---

## Item 3.1 — Toast Notification "Tandai Selesai"

### Acceptance Criteria
- [ ] Toast muncul di pojok kanan bawah saat tombol "Tandai Selesai" diklik
- [ ] Pesan sukses: "✓ Materi ditandai selesai!"
- [ ] Pesan undo: "Materi ditandai belum selesai" (warna berbeda)
- [ ] Durasi: 2.5 detik, lalu fade out otomatis
- [ ] Tidak muncul jika lesson sudah dalam state yang sama
- [ ] Tidak overflow di mobile (375px)
- [ ] z-index di atas semua elemen termasuk bottom nav

### File
`src/pages/app/learn/[track]/[...lesson].astro`

### Tasks
- [ ] Verifikasi implementasi yang sudah ada berfungsi di dev
- [ ] Test di mobile 375px — pastikan tidak overflow
- [ ] Test state idempotency — klik berulang tidak spam toast

---

## Item 3.3 — Search & Filter Tracks

### Acceptance Criteria
- [ ] Search input real-time berdasarkan nama track dan deskripsi
- [ ] Filter chip: Semua | Pemula | Menengah | Lanjutan
- [ ] Kombinasi search + filter bekerja bersamaan
- [ ] Empty state: "Tidak ada track yang cocok" jika tidak ada hasil
- [ ] State tidak persist saat refresh (OK)

### File
`src/pages/app/learn/index.astro`

### Tasks
- [ ] Verifikasi implementasi yang sudah ada berfungsi di dev
- [ ] Test kombinasi search + filter
- [ ] Test empty state
- [ ] Test di mobile — filter chips tidak overflow

---

## Item 3.4 — Module Progress Bars

### Acceptance Criteria
- [ ] Setiap accordion modul di halaman track punya mini progress bar
- [ ] Format: "X/Y selesai" di samping nama modul
- [ ] Warna: hijau (100%), biru (sebagian), abu (0%)
- [ ] Data dari `userProgress` yang sudah ada — tidak ada request tambahan
- [ ] Update setelah user tandai lesson selesai dan kembali ke halaman track

### File
`src/pages/app/learn/[track].astro`

### Tasks
- [ ] Verifikasi implementasi yang sudah ada berfungsi di dev
- [ ] Test dengan user yang punya progress berbeda-beda
- [ ] Test modul dengan 0 progress dan 100% progress

---

## Item 2.4 — Mobile Lesson Drawer

### Acceptance Criteria
- [ ] Tombol "Daftar Materi" hanya tampil di mobile (< 768px)
- [ ] Klik tombol → drawer slide up dari bawah dengan animasi
- [ ] Drawer berisi daftar semua lesson dalam modul aktif
- [ ] Lesson selesai ditandai ✓, lesson aktif di-highlight
- [ ] Klik lesson → navigasi + drawer tutup
- [ ] Klik backdrop → drawer tutup
- [ ] Tidak mengganggu layout saat tertutup

### File
`src/pages/app/learn/[track]/[...lesson].astro`

### Tasks
- [ ] Verifikasi implementasi yang sudah ada berfungsi di dev
- [ ] Test animasi open/close
- [ ] Test navigasi dari drawer
- [ ] Test di berbagai ukuran mobile (375px, 414px, 768px)

---

## Item 3.2 — Carousel "Terakhir Dipelajari"

### Acceptance Criteria
- [ ] Hanya tampil jika user punya progress (`readingSessions.length > 0`)
- [ ] Menampilkan max 3 lesson terakhir, sorted by `lastRead` desc
- [ ] Setiap card: icon track, nama lesson, nama track, tombol "Lanjutkan"
- [ ] Tidak overflow di mobile — horizontal scroll atau grid 1 kolom
- [ ] Klik "Lanjutkan" → navigasi ke lesson yang benar

### File
`src/pages/app/learn/index.astro`

### Data yang Tersedia
```typescript
// Sudah ada dari server load:
const readingSessions = await db.query.readingSessions.findMany({
  where: eq(readingSessions.userId, user.id),
  orderBy: desc(readingSessions.lastRead),
  limit: 3
});
```

### Tasks
- [ ] Implementasi section carousel di atas track cards
- [ ] Handle empty state (user baru tanpa progress)
- [ ] Test di mobile — tidak overflow
- [ ] Test navigasi ke lesson yang benar

---

## Out of Scope

- Animasi transisi antar halaman
- Offline support
- Push notification
- Gamifikasi (badge, poin)

---

## Urutan Pengerjaan

1. Verifikasi semua item yang sudah ada (3.1, 3.3, 3.4, 2.4) di dev lokal
2. Fix jika ada yang tidak berfungsi
3. Preview build dan test di `bun run preview`
4. Implementasi 3.2 (carousel) — satu-satunya yang belum ada kodenya
5. Deploy ke staging untuk audit
6. Setelah audit OK → deploy production (manual trigger)
