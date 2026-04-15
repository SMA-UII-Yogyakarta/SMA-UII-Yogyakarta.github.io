# GitHub Pages vs SSR: Mana yang Tepat untuk Aplikasi Ini?

> Dokumen bahan belajar untuk komunitas Digital Lab SMA UII Yogyakarta  
> Ditulis: 2026-04-15

---

## Jawaban Singkat

**Untuk aplikasi ini (LMS dengan auth, database, session):**  
GitHub Pages **bisa**, tapi dengan tradeoff yang signifikan.  
SSR (Cloudflare Pages/VPS) **lebih tepat** untuk fitur yang sudah ada.

Tapi justru itulah yang menarik untuk dipelajari — memahami *mengapa* dan *bagaimana* tradeoffnya adalah pelajaran arsitektur yang sangat berharga.

---

## Apa itu GitHub Pages?

GitHub Pages adalah layanan hosting **static files** gratis dari GitHub. Ia hanya bisa menyajikan:
- HTML
- CSS
- JavaScript (yang dijalankan di browser)
- Gambar, font, dan aset statis lainnya

Yang **tidak bisa** dilakukan GitHub Pages:
- Menjalankan kode di server (Node.js, Python, PHP, dll)
- Menyimpan session/cookie di server
- Mengakses database secara langsung dari server
- Menjalankan logika bisnis yang sensitif di server

---

## Apa itu SSR (Server-Side Rendering)?

SSR berarti ada **server yang berjalan** dan memproses setiap request sebelum mengirim response ke browser. Contoh: Node.js, Cloudflare Workers, Vercel, Railway.

Keunggulan SSR:
- Bisa menyimpan secret (token, password) di server — tidak ter-expose ke browser
- Bisa validasi session sebelum halaman di-render
- Bisa akses database langsung
- Lebih aman untuk data sensitif

---

## Perbandingan untuk Aplikasi Ini

| Fitur | GitHub Pages (Static) | SSR (Cloudflare/VPS) |
|---|---|---|
| Hosting | Gratis, unlimited | Gratis (CF Pages) / berbayar (VPS) |
| Auth session | ❌ Tidak bisa server-side | ✅ Penuh |
| Database access | ⚠️ Hanya via API publik | ✅ Langsung + aman |
| Secret/token | ❌ Ter-expose ke browser | ✅ Aman di server |
| Deploy | Push ke GitHub → otomatis | Push → build → deploy |
| Custom domain | ✅ Gratis | ✅ Gratis (CF) |
| Performa | ✅ CDN global, sangat cepat | ✅ Edge (CF) / tergantung VPS |
| Kompleksitas kode | ⬆️ Lebih tinggi | ➡️ Normal |

---

## Mengapa Aplikasi Ini "Kurang Cocok" untuk GitHub Pages

### 1. Token Database Ter-expose

Aplikasi ini menggunakan Turso (database cloud). Untuk mengakses Turso dari browser (static site), token harus ada di JavaScript yang bisa dilihat siapapun:

```js
// Ini BERBAHAYA di static site — siapapun bisa buka DevTools dan lihat token ini
const client = createClient({
  url: 'libsql://db.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSJ9...' // ← siapapun bisa copy ini
});
```

Di SSR, token ini ada di server dan tidak pernah dikirim ke browser.

### 2. Session Auth Tidak Bisa Server-Side

Lucia Auth (yang dipakai aplikasi ini) bekerja dengan cara:
1. User login → server buat session di database → kirim cookie ke browser
2. Setiap request → server baca cookie → validasi session di database → izinkan/tolak

Di static site, tidak ada "server" yang bisa melakukan langkah ini. Semua validasi harus dilakukan di browser, yang artinya bisa dimanipulasi.

### 3. API Routes Tidak Berjalan

Semua file di `src/pages/api/` (login, register, admin, dll) adalah server-side code. Di GitHub Pages, file-file ini tidak akan dieksekusi — mereka hanya akan menjadi file teks yang tidak berguna.

---

## Tapi GitHub Pages BISA Dipakai — Dengan Cara Ini

Ini adalah pola arsitektur yang umum dipakai di industri:

```
┌─────────────────────────────────────────────────────┐
│                   Browser (User)                     │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────┐  ┌───────────────────────────┐
│   GitHub Pages       │  │   API Server              │
│   (Static Frontend)  │  │   (Cloudflare Workers /   │
│                      │  │    Railway / Render)       │
│   - HTML/CSS/JS      │  │                           │
│   - React/Vue/Svelte │  │   - Auth (login/logout)   │
│   - Fetch ke API     │  │   - Database queries      │
│                      │  │   - Business logic        │
└──────────────────────┘  └───────────────────────────┘
                                      │
                                      ▼
                          ┌───────────────────────────┐
                          │   Database (Turso)        │
                          │   Token AMAN di server    │
                          └───────────────────────────┘
```

**Contoh nyata yang pakai pola ini:**
- Aplikasi React/Vue yang deploy ke GitHub Pages
- API di Cloudflare Workers (gratis, edge global)
- Auth pakai JWT yang disimpan di `localStorage` atau `httpOnly cookie` dari Workers

---

## Tradeoff Jika Tetap Pakai GitHub Pages

Jika komunitas ingin tetap pakai GitHub Pages sebagai bahan belajar, ini yang harus diubah:

### Yang Harus Dikorbankan atau Diubah

**1. Auth model berubah total**

Dari: Session-based (Lucia + cookie httpOnly)  
Ke: JWT-based (token disimpan di `localStorage` atau `sessionStorage`)

```
Risiko: localStorage bisa diakses JavaScript → rentan XSS
Mitigasi: sanitasi semua input, CSP yang ketat
```

**2. API harus dipisah ke server lain**

Semua `src/pages/api/*` harus dipindah ke:
- Cloudflare Workers (gratis, rekomendasi)
- Supabase Edge Functions (gratis tier)
- Railway/Render (berbayar setelah free tier)

**3. Database token tidak boleh di frontend**

Frontend hanya boleh memanggil API server, tidak boleh langsung ke Turso.

**4. CORS harus dikonfigurasi**

API server harus izinkan request dari domain GitHub Pages:
```js
// Di Cloudflare Workers
response.headers.set('Access-Control-Allow-Origin', 'https://lab.smauiiyk.sch.id');
```

### Yang Tetap Bisa Dipertahankan

- Semua UI (halaman publik, register form, dashboard)
- Logika validasi di frontend (Zod)
- Tampilan dan UX
- Konten statis (about, tracks, projects publik)

---

## Rekomendasi untuk Sample Project Komunitas

Karena tujuannya adalah **bahan belajar**, ada dua pendekatan yang bisa dipilih:

### Opsi A: "Cara Benar" — Cloudflare Pages (SSR)

Tunjukkan bahwa ada platform SSR gratis yang bisa dipakai selain GitHub Pages. Cloudflare Pages:
- Gratis selamanya untuk proyek kecil
- Support SSR via Workers
- Deploy dari GitHub (sama seperti GitHub Pages)
- Tidak perlu ubah kode sama sekali dari kondisi saat ini

**Pelajaran yang didapat:** Cara deploy aplikasi full-stack modern secara gratis.

### Opsi B: "Cara Kreatif" — GitHub Pages + Workers

Tunjukkan bagaimana memisahkan frontend dan backend, dan bagaimana keduanya berkomunikasi. Ini adalah pola arsitektur yang sangat umum di industri (disebut "Jamstack").

**Pelajaran yang didapat:**
- Perbedaan frontend dan backend
- Cara kerja REST API dan CORS
- JWT vs Session auth
- Tradeoff keamanan di static site

### Opsi C: Keduanya — Branch Terpisah

Buat dua branch:
- `main` → SSR di Cloudflare Pages (production)
- `static` → Static SPA di GitHub Pages (demo/belajar)

Ini paling edukatif karena bisa dibandingkan langsung.

---

## Kesimpulan

| Pertanyaan | Jawaban |
|---|---|
| Apakah GitHub Pages cocok untuk aplikasi ini? | Bisa, tapi butuh refactor arsitektur yang signifikan |
| Apakah SSR lebih baik untuk fitur yang ada? | Ya, jauh lebih aman dan lebih sederhana kodenya |
| Apakah GitHub Pages bagus untuk bahan belajar? | Sangat bagus — justru tradeoffnya yang jadi pelajaran |
| Rekomendasi untuk production? | Cloudflare Pages (SSR, gratis, mudah) |
| Rekomendasi untuk bahan belajar? | Opsi C: dua branch, bisa dibandingkan |

---

## Konsep Kunci yang Bisa Dipelajari dari Proyek Ini

1. **Static vs Dynamic** — perbedaan file statis dan aplikasi yang butuh server
2. **SSR vs CSR vs SSG** — tiga model rendering web modern
3. **Auth: Session vs JWT** — dua pendekatan autentikasi dan tradeoffnya
4. **Secret management** — mengapa token tidak boleh ada di frontend
5. **CORS** — mengapa browser memblokir request lintas domain dan cara mengatasinya
6. **Jamstack architecture** — pola frontend statis + API terpisah
7. **Edge computing** — Cloudflare Workers sebagai alternatif server tradisional

---

*Dokumen ini bagian dari seri bahan belajar Digital Lab SMA UII Yogyakarta.*  
*Kontribusi dan pertanyaan: buka Issue di GitHub.*
