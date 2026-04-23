# SLIMS API Security

## Problem

SLIMS plugin API exposed langsung via HTTPS:
```
https://library.smauiiyk.sch.id/plugins/lab-digital-api/api.php?action=verify&nis=1724
```

**Security Risks:**
- PHP file path exposed (`/plugins/lab-digital-api/api.php`)
- Query parameters visible di URL
- Direct access ke backend system
- Sulit untuk rate limiting / monitoring

## Solution

### 1. Proxy API (Implemented)

Lab Digital bertindak sebagai proxy/gateway:

```
Client → Lab API → SLIMS API
```

**Endpoints:**

#### Public (No Auth) - For Registration
```
POST /api/slims/verify
Body: { nisn: "1724" }
```
Digunakan saat user belum login (registration flow).

#### Internal (Auth Required) - For Admin
```
GET /api/internal/slims/verify?nis=1724
```
Digunakan untuk admin operations, butuh authentication.

### 2. Security Benefits

✅ **Hide Implementation**
- Client tidak tahu backend pakai PHP/SLiMS
- Bisa ganti backend tanpa ubah client

✅ **Centralized Auth**
- API key disimpan di server, tidak exposed ke client
- Bisa tambah rate limiting di proxy layer

✅ **Normalized Response**
- Transform response dari SLiMS ke format konsisten
- Hide internal field names

✅ **Error Handling**
- Catch timeout/errors di proxy
- Return user-friendly error messages

✅ **Audit Trail**
- Log semua request ke SLIMS
- Monitor usage patterns

### 3. Implementation

**File:** `src/pages/api/internal/slims/verify.ts`

```typescript
export const GET: APIRoute = async ({ url, locals }) => {
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);
  
  const nis = url.searchParams.get('nis');
  const response = await fetch(
    `${SLIMS_API_URL}/api.php?action=verify&nis=${nis}`,
    { headers: { 'X-Lab-API-Key': SLIMS_API_KEY } }
  );
  
  // Transform & return
};
```

### 4. Network Architecture

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────┐
│  Lab API Server │
│  (Proxy Layer)  │
└──────┬──────────┘
       │ Internal
       ▼
┌─────────────────┐
│  Library System │
│     (SLiMS)     │
└─────────────────┘
```

**Benefits:**
- Client tidak tahu backend implementation
- Centralized security & monitoring
- Flexible untuk ganti backend

### 5. Future Improvements

#### Option A: Direct Internal Connection
Optimize network routing untuk faster response.

**Benefits:**
- Lower latency
- More secure (internal only)
- No public exposure needed

#### Option B: Dedicated API Gateway
```
Client → API Gateway → Multiple Services
```

**Benefits:**
- Centralized rate limiting
- Request/response transformation
- Service mesh pattern

#### Option C: Modern API Stack
Migrate ke modern tech stack dengan better performance.

**Benefits:**
- Better performance
- Easier maintenance
- Modern tooling

### 6. Rate Limiting (TODO)

Add to proxy endpoint:

```typescript
import { rateLimit } from '@lib/rate-limit';

export const GET: APIRoute = async ({ request, locals }) => {
  const limited = await rateLimit(request, {
    max: 10,        // 10 requests
    window: 60000,  // per minute
  });
  
  if (limited) {
    return createErrorResponse('Too many requests', 429);
  }
  
  // ... rest of code
};
```

### 7. Monitoring

Log semua SLIMS API calls untuk audit:

```typescript
console.log('[SLIMS] verify', {
  nis,
  userId: user.id,
  timestamp: Date.now(),
  success: response.ok,
});
```

Integrate dengan monitoring system untuk tracking usage patterns.

---

## Checklist

- [x] Create internal proxy endpoint
- [x] Add authentication check
- [x] Normalize response format
- [x] Error handling & timeout
- [ ] Connect containers to shared network (optional)
- [ ] Add rate limiting
- [ ] Add monitoring/logging
- [ ] Migrate to modern API (long-term)
