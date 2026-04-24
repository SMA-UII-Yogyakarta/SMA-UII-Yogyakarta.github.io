# UI System & Mobile-First Conventions

## Prinsip

1. **Mobile-first** — desain untuk 375px terlebih dahulu, lalu scale up
2. **Touch targets** — minimum 44×44px untuk semua elemen interaktif
3. **Safe area** — selalu gunakan `env(safe-area-inset-*)` untuk perangkat dengan notch
4. **No layout shift** — sidebar state diinisialisasi sebelum render via inline script

---

## Breakpoints

| Nama | Range | Sidebar | Nav |
|------|-------|---------|-----|
| Mobile | `< 640px` | Hidden | BottomNav |
| Tablet | `640–1023px` | Minimized (icon) | Sidebar + hamburger |
| Desktop | `≥ 1024px` | Expanded / Minimized | Sidebar |

---

## Sidebar State Machine

```
hidden    → mobile default, off-screen
minimized → tablet default / desktop collapsed, 4rem, icon only
expanded  → desktop default, 16rem, full labels
overlay   → tablet saat hamburger diklik, 16rem di atas konten
```

State disimpan di: `document.documentElement.dataset.sidebar`
Persisted ke: `localStorage('sidebar-collapsed')`

---

## Komponen

### DashboardLayout
- `noPadding` prop untuk halaman yang butuh full-bleed (misal card, map)
- Content area: `overflow-y-auto p-4 pb-16 sm:pb-4`
- `pb-16` untuk clearance BottomNav di mobile

### BottomNav
- Hanya tampil di mobile (`sm:hidden`)
- Maksimal 5 item (slice dari navItems)
- Active state: `text-blue-400` + indicator bar di atas

### Topbar
- Sticky, `z-40`, backdrop blur
- Mobile: judul + notif bell (sidebar toggle hidden)
- Tablet+: tambah hamburger toggle

---

## Warna & Tone

```
Background:  gray-950 (body), gray-900 (card/sidebar)
Border:      gray-800
Text:        gray-100 (primary), gray-400 (secondary), gray-500 (muted)
Accent:      blue-500/600 (primary action)
Danger:      red-500/600
Success:     green-500/600
Warning:     amber-400/500
```

---

## Mobile-First Checklist (TODO)

- [ ] Hamburger di Topbar untuk mobile (buka sidebar sebagai overlay)
- [ ] `pb-[calc(4rem+env(safe-area-inset-bottom))]` di content area
- [ ] `-webkit-overflow-scrolling: touch` di scroll containers
- [ ] Touch target audit — semua button minimal 44px
- [ ] BottomNav active indicator lebih jelas
