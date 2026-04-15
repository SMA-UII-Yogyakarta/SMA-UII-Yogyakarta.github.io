# Security Policy

## Melaporkan Kerentanan Keamanan

Jika Anda menemukan kerentanan keamanan dalam proyek ini, mohon **JANGAN** membuat issue publik.

Sebagai gantinya, laporkan secara privat melalui:

1. **GitHub Security Advisories** (direkomendasikan):
   - Buka tab "Security" di repository
   - Klik "Report a vulnerability"
   - Isi detail kerentanan

2. **Email maintainer**:
   - Hubungi @sandikodev via GitHub

## Apa yang Harus Dilaporkan?

- Kerentanan XSS (Cross-Site Scripting)
- Kebocoran data sensitif
- Masalah autentikasi atau otorisasi
- Dependency yang rentan
- Konfigurasi yang tidak aman

## Apa yang Akan Kami Lakukan?

1. Konfirmasi penerimaan laporan dalam 48 jam
2. Investigasi dan validasi kerentanan
3. Kembangkan dan test patch
4. Release patch dan credit reporter (jika diinginkan)

## Scope

Proyek ini adalah static site yang di-deploy ke GitHub Pages. Kerentanan yang relevan:
- Client-side vulnerabilities (XSS, dll)
- Dependency vulnerabilities
- Build process security

**Out of scope:**
- GitHub Pages infrastructure
- Browser vulnerabilities
- Social engineering

## Versi yang Didukung

Kami hanya mendukung versi terbaru yang di-deploy di production (main branch).

---

Terima kasih telah membantu menjaga keamanan proyek ini!
