# Lab Digital API — SLiMS Plugin

Plugin REST API untuk integrasi SLiMS dengan platform [Digital Lab SMA UII](https://lab.smauiiyk.sch.id).

## Endpoints

### 1. Verify Member
```
GET /plugins/lab-digital-api/api.php?action=verify&nis={nis}
Header: X-Lab-API-Key: {key}
```

Response:
```json
{
  "found": true,
  "nis": "1763",
  "name": "John Doe",
  "email": "john@example.com",
  "gender": "L",
  "member_type": "Siswa",
  "is_expired": false
}
```

### 2. Search Members
```
GET /plugins/lab-digital-api/api.php?action=search&q={query}&limit=20
Header: X-Lab-API-Key: {key}
```

Search by NIS, name, or email. Min 2 characters.

Response:
```json
{
  "total": 2,
  "query": "john",
  "members": [
    {
      "nis": "1763",
      "name": "John Doe",
      "email": "john@example.com",
      "member_type": "Siswa",
      "is_expired": false
    }
  ]
}
```

### 3. Top Visitors
```
GET /plugins/lab-digital-api/api.php?action=top-visitors&limit=30&days=30
Header: X-Lab-API-Key: {key}
```

Response:
```json
{
  "total": 30,
  "days": 30,
  "visitors": [
    {
      "rank": 1,
      "member_id": "1763",
      "name": "John Doe",
      "member_type": "Siswa",
      "visit_count": 45,
      "last_visit": "2026-05-19 10:30:00"
    }
  ]
}
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
# Verify
curl -H "X-Lab-API-Key: your-key" \
  "http://localhost/plugins/lab-digital-api/api.php?action=verify&nis=1763"

# Search
curl -H "X-Lab-API-Key: your-key" \
  "http://localhost/plugins/lab-digital-api/api.php?action=search&q=john&limit=10"

# Top visitors
curl -H "X-Lab-API-Key: your-key" \
  "http://localhost/plugins/lab-digital-api/api.php?action=top-visitors&limit=10&days=7"
```

## Catatan

- `member_id` di SLiMS digunakan sebagai NIS (4 digit)
- `member_code` digunakan sebagai NISN (10 digit) — tidak tersedia di SLiMS SMA UII
- `inst_name` digunakan sebagai kelas/jurusan
