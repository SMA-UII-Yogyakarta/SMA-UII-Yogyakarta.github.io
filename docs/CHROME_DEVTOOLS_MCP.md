# Chrome DevTools MCP - Setup Guide

Dokumen ini menjelaskan cara menghubungkan Chrome DevTools MCP ke server1 menggunakan Chrome dari laptop lokal Anda.

## Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Arch Linux Laptop (Anda)                                              │
│                                                                       │
│  Chrome running di port 19222                                          │
│  SSH tunnel ke server1 (port 13742)                                   │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │
                                │ Remote tunnel SSH
                                │ (laptop → server1)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Server1 (host1)                                                     │
│                                                                       │
│  Port 9222 ──tunnel───→ laptop:19222                                    │
│  Chrome DevTools MCP connect ke localhost:9222                              │
│  opencode accessing Chrome laptop untuk automation & debugging                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Laptop**: Google Chrome atau Chromium ter-install
2. **SSH access**: Bisa remote ke laptop melalui SSH tunnel
3. **Server1**: Bisa akses SSH ke server1 melalui port yang sudah di-setup

---

## Langkah 1: Menjalankan Chrome di Laptop

Di laptop Anda (Arch Linux), jalankan commands berikut:

### 1.1 Buat user data directory baru

```bash
rm -rf ~/.chrome-dev-test
mkdir -p ~/.chrome-dev-test
```

### 1.2 Jalankan Chrome dengan remote debugging

```bash
google-chrome-stable --remote-debugging-port=19222 \
  --user-data-dir=~/.chrome-dev-test \
  --headless \
  --disable-gpu \
  --no-sandbox \
  --disable-dev-shm-usage
```

**Catatan**: 
- Port `19222` digunakan karena port `9222` sudah digunakan SSH
- `--headless` untuk mode tanpa GUI
- `--no-sandbox` diperlukan di lingkungan container/VM

### 1.3 Verifikasi Chrome berjalan

```bash
curl -s http://127.0.0.1:19222/json/version
```

Output yang diharapkan:
```json
{
   "Browser": "Chrome/146.0.x.x",
   "Protocol-Version": "1.3",
   ...
}
```

---

## Langkah 2:SSH Tunnel ke Server1

Anda perlu membuat SSH tunnel dari laptop ke server1. Gunakan remote tunnel server:

### 2.1 Cek apakah tunnel sudah aktif

Di terminal laptop Anda:
```bash
# Cek apakah tunnel server1 sudah berjalan
remote tunnel server1 status
```

### 2.2 Jika belum aktif, mulai tunnel

```bash
# Mulai tunnel server1
remote tunnel server1 start
```

Output yang diharapkan:
```
✓ Tunnel server1 aktif (port 13742)
```

---

## Langkah 3: Port Forwarding dari Server1 ke Laptop

Di server1 (melalui SSH dari laptop atau langsung di server1), buat port forwarding:

### 3.1 Dari laptop ke server1 (SSH)

Dari terminal laptop Anda, connect ke server1 dan buat tunnel:

```bash
ssh -o StrictHostKeyChecking=no -L 9222:127.0.0.1:19222 -N -f dev@localhost -p 13742
```

Penjelasan:
- `-L 9222:127.0.0.1:19222` - Forward port 9222 di server1 ke port 19222 di laptop
- `-N` - Tidak menjalankan command remote
- `-f` - Background
- `-p 13742` - Port SSH server1 (tunnel)

### 3.2 Verifikasi koneksi

Di server1:

```bash
curl -s http://127.0.0.1:9222/json/version
```

Output yang diharapkan menunjukkan Chrome dari laptop:
```json
{
   "Browser": "Chrome/146.0.x.x",
   "Protocol-Version": "1.3",
   "User-Agent": "Mozilla/5.0 ...",
   "webSocketDebuggerUrl": "ws://127.0.0.1:19222/devtools/browser/..."
}
```

---

## Langkah 4: Konfigurasi MCP di Server1

Di server1, file konfigurasi `~/.config/opencode/opencode.json` sudah di-setup:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "chrome-devtools": {
      "type": "local",
      "command": ["npx", "-y", "chrome-devtools-mcp@latest", "--browser-url", "http://127.0.0.1:9222", "--headless"]
    },
    "Neon": {
      "enabled": true,
      "headers": {...},
      "type": "remote",
      "url": "https://mcp.neon.tech/mcp"
    }
  },
  ...
}
```

---

## Langkah 5: Restart opencode

Setelah semua setup, restart opencode di server1:

```bash
# Kill opencode yang sedang running
pkill -f opencode

# Atau jika ingin fresh start
opencode --clear
```

---

## Cara Penggunaan MCP

Setelah setup berhasil, berikut adalah commands yang bisa digunakan:

### Navigasi

```python
# Buka URL tertentu
chrome_devtools_navigate_page(url="http://localhost:4321/register")
```

### Screenshot

```python
# Ambil screenshot
chrome_devtools_take_screenshot(filePath="/tmp/screenshot.png")

# Screenshot element tertentu
chrome_devtools_take_screenshot(uid="element_uid", filePath="/tmp/element.png")
```

### Klik dan Interaksi

```python
# Klik element
chrome_devtools_click(uid="button_uid")

# Isi form
chrome_devtools_fill(uid="input_uid", value="nisn_value")

# Hover
chrome_devtools_hover(uid="element_uid")
```

### Ambil Data

```python
# Ambil snapshot halaman
chrome_devtools_take_snapshot()

# Lihat console messages
chrome_devtools_list_console_messages()

# Lihat network requests
chrome_devtools_list_network_requests()
```

### Performance

```python
# Start performance trace
chrome_devtools_performance_start_trace()

# Stop dan analyze
chrome_devtools_performance_stop_trace()

# Analyze insight
chrome_devtools_performance_analyze_insight(insightSetId="...", insightName="...")
```

### Debugging

```python
# Evaluate JavaScript
chrome_devtools_evaluate_script(function="() => document.title")

# Get console message
chrome_devtools_get_console_message(msgid=1)

# Lighthouse audit
chrome_devtools_lighthouse_audit()
```

---

## Troubleshooting

### Chrome tidak bisa start

```bash
# Kill Chrome lama
pkill -f chrome

# Hapus lock file
rm -rf ~/.chrome-dev-test/SingletonLock

# Coba lagi
google-chrome-stable --remote-debugging-port=19222 ...
```

### Port sudah digunakan

```bash
# Cek port yang digunakan
lsof -i :19222

# Gunakan port berbeda
google-chrome-stable --remote-debugging-port=29222 ...
```

### Tunnel tidak connect

```bash
# Cek tunnel di laptop
curl -s http://127.0.0.1:19222/json/version

# Cek port forwarding
ss -tlnp | grep 9222
```

### MCP error "Not connected"

```bash
# Restart MCP server
pkill -f chrome-devtools-mcp

# Start ulang dengan fresh connection
npx -y chrome-devtools-mcp@latest --browser-url=http://127.0.0.1:9222 --headless &
```

---

## Quick Reference

### Di Laptop (Arch Linux)

| Command | Description |
|---------|------------|
| `google-chrome-stable --remote-debugging-port=19222 --user-data-dir=~/.chrome-dev-test --headless --disable-gpu --no-sandbox` | Start Chrome |
| `curl -s http://127.0.0.1:19222/json/version` | Verifikasi Chrome |

### Di Server1

| Command | Description |
|---------|------------|
| `curl -s http://127.0.0.1:9222/json/version` | Verifikasi koneksi ke laptop |
| `ssh -L 9222:127.0.0.1:19222 -N -f dev@localhost -p 13742` | Buat port forwarding |

### Config File

- **Location**: `~/.config/opencode/opencode.json`
- **MCP section**: `mcp.chrome-devtools`

---

## Catatan Keamanan

⚠️ **Peringatan Penting**:

1. ** Jangan share port debugging** - Siapa saja bisa akses browser jika tahu port-nya
2. **Gunakan SSH tunnel** - Jangan expose Chrome port ke internet
3. **Profile terpisah** - Gunakan user data directory khusus untuk debugging
4. **Jangan browsing敏感** saat Chrome dalam mode debug accessible

---

## Referensi

- [Chrome DevTools MCP GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [Chrome Remote Debugging](https://developer.chrome.com/docs/devtools/remote-debugging)
- [OpenCode MCP Config](https://opencode.ai/docs/mcp-servers)