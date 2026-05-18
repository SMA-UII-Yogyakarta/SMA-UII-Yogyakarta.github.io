# Lab Digital API — SLiMS Plugin

Plugin REST API untuk integrasi SLiMS dengan platform [Digital Lab SMA UII](https://lab.smauiiyk.sch.id).

## Endpoint

```
GET /plugins/lab-digital-api/?action=verify&nisn={nisn}
Header: X-Lab-API-Key: {key}
```

## Setup

1. Plugin sudah ter-mount via docker-compose SLiMS
2. Set environment variable di container SLiMS:
   ```
   LAB_API_KEY=your-secret-key-here
   LAB_ORIGIN=https://lab.smauiiyk.sch.id
   ```
3. Generate key: `openssl rand -hex 32`

## Test

```bash
curl -H "X-Lab-API-Key: your-key" \
  "http://localhost/plugins/lab-digital-api/?action=verify&nisn=1234567890"
```

## Catatan

- `member_id` di SLiMS digunakan sebagai NISN
- `member_code` digunakan sebagai NIS
- `inst_name` digunakan sebagai kelas/jurusan
