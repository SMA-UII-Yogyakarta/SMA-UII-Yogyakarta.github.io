# 🔧 Troubleshooting Guide - Projects Page

## Masalah: HTML Text Muncul Daripada UI

Jika Anda melihat HTML text seperti:
```html
<div class="bg-gray-900 border border-gray-800...">
```
Alih-alih UI yang ter-render dengan benar.

---

## 🧪 Cara Test

### Option 1: Full Test Script
1. Buka http://localhost:4321/app/projects
2. Buka DevTools Console (tekan F12)
3. Paste ini:
```javascript
const script = document.createElement('script');
script.src = '/test-projects.js';
document.head.appendChild(script);
```
4. Script akan menjalankan semua test otomatis

### Option 2: Quick Test
Copy-paste ini ke console:
```javascript
// Check grid
const grid = document.getElementById('projects-grid');
console.log('Grid:', grid ? '✅' : '❌');
console.log('Content:', grid?.innerHTML.substring(0, 100));

// Test API
fetch('/api/projects?page=1&limit=12')
  .then(r => r.json())
  .then(d => console.log('API:', d.data?.projects?.length, 'projects'))
  .catch(e => console.error('API Error:', e.message));
```

---

## 📋 Checklist Diagnosis

### ✅ 1. Grid Element Exists
```javascript
document.getElementById('projects-grid')
// Harus return <div id="projects-grid"> bukan null
```

### ✅ 2. API Returns Data
```javascript
fetch('/api/projects').then(r => r.json()).then(console.log)
// Harus return { data: { projects: [...], total: N } }
```

### ✅ 3. JavaScript Loaded
```javascript
typeof renderCard
// Harus return 'function' bukan 'undefined'
```

### ✅ 4. Tailwind CSS Loaded
- Buka DevTools → Network tab
- Filter: CSS
- Reload page
- Harus ada file CSS yang ter-load dengan status 200

### ✅ 5. No Console Errors
- Buka DevTools → Console tab
- Reload page
- Tidak ada error merah (hanya warning kuning OK)

---

## 🛠️ Solusi Berdasarkan Gejala

### Gejala 1: Grid Kosong Terus
**Penyebab:** JavaScript tidak jalan atau API gagal

**Fix:**
```javascript
// Test manual load
load();  // Jalankan function load() manual di console
```

### Gejala 2: HTML Text Muncul
**Penyebab:** innerHTML meng-insert string sebelum CSS load

**Fix:**
- Hard refresh: `Ctrl+Shift+R` (Windows) atau `Cmd+Shift+R` (Mac)
- Clear browser cache
- Check Network tab - pastikan CSS ter-load

### Gejala 3: Error "renderCard is not defined"
**Penyebab:** Script belum load saat Anda test

**Fix:**
- Tunggu 1-2 detik setelah page load
- Atau scroll page sedikit untuk trigger script load

### Gejala 4: API Returns 0 Projects
**Penyebab:** Database kosong

**Fix:**
```bash
# Seed database
cd /home/dev/project/smauii-dev-foundation
bun run db:seed:enhanced
```

---

## 🔍 Debug Mode

Untuk enable debug logging, tambahkan ini di console:
```javascript
window.DEBUG = true;
location.reload();
```

---

## 📞 Masih Bermasalah?

Jika semua test sudah dilakukan tapi masih bermasalah:

1. Screenshot Console tab (F12 → Console)
2. Screenshot Network tab (F12 → Network)
3. Jalankan test script dan screenshot hasilnya
4. Share error message lengkap

---

## 📚 Referensi

- [Astro Client-Side Scripts](https://docs.astro.build/en/guides/client-side-scripts/)
- [Tailwind CSS Installation](https://tailwindcss.com/docs/installation)
- [Fetch API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
