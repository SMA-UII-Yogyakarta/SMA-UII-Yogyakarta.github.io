# Penyempurnaan: Integrasi SLiMS ↔ Digital Lab

Dokumen ini mencatat semua yang perlu disempurnakan setelah integrasi awal berhasil.
Diurutkan berdasarkan prioritas.

---

## Temuan dari Audit Kode

### 1. Inkonsistensi Terminologi NIS vs NISN (KRITIS)

**Masalah:**
- SLiMS SMA UII menggunakan `member_id` = **NIS** (4 digit, contoh: `1763`)
- Platform Digital Lab punya field `nisn` dan `nis` di DB, tapi keduanya diisi NIS yang sama
- Form registrasi masih berlabel "NISN" di beberapa tempat
- `login.ts` masih menyebut "NISN/NIS/Email" padahal NISN tidak ada

**Dampak:** Membingungkan user dan maintainer.

**Solusi:**
- Ganti semua label "NISN" → "NIS" di UI
- Pertimbangkan: apakah field `nisn` di DB perlu dihapus atau dipertahankan untuk masa depan?
- Jika SLiMS suatu saat menyimpan NISN, field sudah siap

---

### 2. Kelas Siswa Tidak Ada di SLiMS (PENTING)

**Masalah:**
- `inst_name` di SLiMS = "SMA UII Yogyakarta" untuk semua siswa — bukan kelas
- Tidak ada field kelas (XII IPA 1, dll) di database SLiMS
- Saat ini field `class` dikembalikan kosong dari API, user harus isi manual

**Solusi yang mungkin:**
- A) Biarkan user isi kelas manual saat registrasi (sudah dilakukan)
- B) Tambahkan field kelas ke SLiMS via custom field atau tabel baru
- C) Sinkronisasi dari sistem akademik sekolah jika ada

**Rekomendasi:** Opsi A untuk sekarang. Tambahkan validasi kelas di form registrasi
agar tidak bisa dikosongkan.

---

### 3. Expired Membership Memblokir Registrasi (PENTING)

**Masalah:**
- Banyak siswa di SLiMS punya `expire_date` di masa lalu (2024)
- `verify.ts` mengembalikan `isExpired: true`
- `RegisterForm.tsx` menolak registrasi jika `isExpired: true`

**Dampak:** Siswa aktif tidak bisa daftar karena keanggotaan perpustakaan expired.

**Solusi:**
- Jangan blokir registrasi berdasarkan `is_expired`
- Tampilkan warning saja: "Keanggotaan perpustakaan kamu sudah expired. Silakan perpanjang."
- Tetap izinkan registrasi — keanggotaan perpustakaan ≠ keanggotaan Digital Lab

---

### 4. Rate Limiting di Plugin SLiMS (KEAMANAN)

**Masalah:**
- Plugin `api.php` tidak punya rate limiting
- Bisa di-brute force untuk enumerate NIS valid

**Solusi:**
- Tambahkan rate limiting di nginx-proxy level untuk path `/plugins/lab-digital-api/`
- Atau implementasi simple rate limiting via APCu di PHP

```nginx
# Di lab.conf atau library.conf — tambahkan limit untuk API plugin
limit_req_zone $binary_remote_addr zone=slims_api:10m rate=10r/m;

location /plugins/lab-digital-api/ {
    limit_req zone=slims_api burst=5 nodelay;
    proxy_pass http://smauii-slims-app:80;
    ...
}
```

---

### 5. Tidak Ada Endpoint `search` di Plugin SLiMS

**Kebutuhan masa depan:**
- Maintainer perlu bisa search anggota SLiMS dari dashboard Digital Lab
- Untuk keperluan: approve member, verifikasi manual, dll

**Endpoint yang perlu ditambahkan:**
```
GET /api.php?action=search&q={query}&limit=20
Response: { members: [{ nis, name, email, member_type, is_expired }] }
```

---

### 6. Sinkronisasi Data Satu Arah

**Kondisi saat ini:**
- Data hanya dibaca dari SLiMS saat registrasi
- Jika nama/email berubah di SLiMS, tidak otomatis update di Digital Lab

**Solusi jangka panjang:**
- Webhook atau cron job untuk sync data member aktif
- Atau: tambahkan endpoint `sync` yang dipanggil saat user login

---

### 7. Mock Data Masih Punya Field `class` yang Tidak Konsisten

**Masalah:**
- Mock data di `verify.ts` masih punya field `class: 'XII IPA 1'`
- Tapi response production tidak punya field `class`
- Bisa menyebabkan bug saat development

**Solusi:** Hapus field `class` dari mock data, konsisten dengan production.

---

## Checklist Penyempurnaan

### Segera (sebelum launch ke user)
- [ ] Fix: Blokir registrasi karena `is_expired` → ubah jadi warning saja
- [ ] Fix: Label "NISN" → "NIS" di semua UI (form, error message, login page)
- [ ] Fix: Hapus field `class` dari mock data
- [ ] Fix: Validasi field `class` wajib diisi di form registrasi

### Jangka Pendek (minggu ini)
- [ ] Tambah rate limiting di nginx untuk `/plugins/lab-digital-api/`
- [ ] Tambah endpoint `search` di plugin SLiMS
- [ ] Update `login.ts` error message: "NISN/NIS/Email" → "NIS/Email"

### Jangka Menengah
- [ ] Evaluasi: apakah field `nisn` di DB perlu dipertahankan atau dihapus
- [ ] Implementasi sync data dari SLiMS saat user login
- [ ] Tambahkan field kelas ke SLiMS atau sistem akademik

### Jangka Panjang
- [ ] Integrasi dengan sistem akademik sekolah untuk data kelas real-time
- [ ] Webhook SLiMS → Digital Lab saat ada perubahan data anggota
