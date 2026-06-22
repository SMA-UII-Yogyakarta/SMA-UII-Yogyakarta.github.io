# Digital Lab Naik Kelas by Koneksi

> **Platform Kursus Online & Developer Community**  
> Bagian dari ekosistem PT Koneksi Jaringan Indonesia  
> **Status**: ✅ Production Ready (Mode B - JAMSTACK)

---

## 📋 Daftar Isi

1. [Visi & Filosofi](#visi--filosofi)
2. [Posisi Strategis](#posisi-strategis)
3. [Arsitektur Teknis](#arsitektur-teknis)
4. [Deployment Modes](#deployment-modes)
5. [Business Model](#business-model)
6. [Getting Started](#getting-started)
7. [Development Workflow](#development-workflow)
8. [Deployment Guide](#deployment-guide)
9. [Integration dengan AksesSekolah](#integration-dengan-aksesekolah)
10. [Roadmap](#roadmap)
11. [FAQ](#faq)

---

## 🎯 Visi & Filosofi

### **Visi**

Membangun **platform kursus online dan developer community** yang:
- **Dinamis**: Dapat diadaptasi oleh berbagai institusi (sekolah, perusahaan, komunitas)
- **Profitable**: Business model sustainable dengan margin 90%+
- **Scalable**: JAMSTACK architecture dengan global CDN
- **Community-driven**: Open source, kolaboratif, outcome-focused

### **Filosofi**

Digital Lab Naik Kelas menggabungkan **3 filosofi kuat**:

#### 1. **Filosofi Digital Lab** (dari SMA UII Yogyakarta)
- **Open Source First**: Semua kode terbuka untuk kontribusi global
- **Learning by Building**: Proyek nyata, bukan sekadar teori
- **Community-driven**: Peer learning, mentorship, kolaborasi
- **Komitmen > Bakat**: Konsistensi lebih penting dari jenius

#### 2. **Filosofi Naik Kelas** (dari Koneksi x Yayasan Klub Fisika)
- **Cohort-based Learning**: Belajar bersama dalam batch
- **Outcome-driven**: Fokus pada hasil nyata (portofolio, sertifikat)
- **Action-based Assessment**: Submit karya nyata, bukan ujian
- **Premium Experience**: UI/UX kelas dunia

#### 3. **Filosofi PT Koneksi** (Digital Agency)
- **Professional**: Standar industri, production-grade
- **Profitable**: Business model sustainable
- **Scalable**: Arsitektur cloud-native
- **Customer-centric**: Solusi realistis untuk masalah nyata

### **Identitas**

> **"Digital Lab Naik Kelas by Koneksi"** bukan sekadar platform kursus.  
> Ini adalah **ekosistem pembelajaran** yang menghubungkan:
> - **Students** → Skills, portofolio, sertifikat
> - **Mentors** → Income, impact, community
> - **Schools** → Digital transformation, student outcomes
> - **Industry** → Talent pipeline, upskilling

---

## 🏗️ Posisi Strategis

### **Ekosistem PT Koneksi Jaringan Indonesia**

```
PT Koneksi Jaringan Indonesia
│
├── 🏫 **AksesSekolah.id**
│   ├── School Management System
│   ├── B2B2C Subscription
│   └── Status: ✅ Production (Multi-tenant)
│
├── 📚 **Digital Lab Naik Kelas** (NEW)
│   ├── Online Course Platform + Community
│   ├── B2C (Individual) + B2B2C (Schools)
│   ├── Status: ✅ Production Ready (Mode B)
│   └── Integration: SSO + Cross-promotion dengan AksesSekolah
│
└── ⏸️ **NaikKelas.id** (Existing - Separate Entity)
    ├── Cohort-based LMS (SvelteKit)
    └── Status: ⚠️ BLOCKED (Technical issues)
```

### **Differentiation**

| Platform | Target | Model | Tech Stack | Status |
|----------|--------|-------|------------|--------|
| **AksesSekolah** | Schools (Admin, Teachers) | B2B2C Subscription | React + CF Workers | ✅ Production |
| **Digital Lab Naik Kelas** | Students + Schools | B2C + B2B2C | Astro + React Islands + CF Workers | ✅ Production Ready |
| **NaikKelas.id** | Individual Learners | B2C Subscription | SvelteKit + Node.js | ⚠️ BLOCKED |

### **Keuntungan Strategis Digital Lab Naik Kelas**

1. **Leverage AksesSekolah**:
   - Existing customer base (sekolah-sekolah)
   - Shared infrastructure (Cloudflare, Turso)
   - Cross-selling opportunity

2. **Speed to Market**:
   - Codebase sudah 80% production-ready
   - Tinggal customize branding + course features
   - Launch dalam 2-4 weeks

3. **Low Risk, High Reward**:
   - Tidak menggantikan platform existing
   - Experiment kecil dengan upside besar
   - 90%+ profit margin

---

## 🛠️ Arsitektur Teknis

### **Tech Stack**

#### **Frontend**
- **Framework**: Astro 6.x
- **UI Components**: React 19 (Islands Architecture)
- **Styling**: Tailwind CSS v4
- **State Management**: Vanilla JS + React Context
- **Rendering**: Hybrid (SSG + CSR untuk Mode B/C, SSR untuk Mode A)

#### **Backend**
- **Runtime**: Cloudflare Workers
- **Framework**: Hono (ultra-fast router)
- **Language**: TypeScript 5.8
- **Database**: Turso (LibSQL/SQLite edge)
- **ORM**: Drizzle ORM
- **Auth**: Hybrid (Session/Lucia untuk Mode A, JWT untuk Mode B/C)
- **Validation**: Zod

#### **Infrastructure**
- **API Hosting**: Cloudflare Workers (300+ edge locations)
- **Frontend Hosting**: Cloudflare Pages / GitHub Pages
- **Database**: Turso (edge-replicated SQLite)
- **File Storage**: Cloudflare R2 (optional)
- **Email**: Cloudflare Email Routing (optional)
- **Monitoring**: Cloudflare Analytics

### **Project Structure**

```
digital-lab-naik-kelas/
├── apps/
│   ├── api/                 # Backend API (Cloudflare Workers)
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints (Hono)
│   │   │   ├── db/          # Database schema (Drizzle)
│   │   │   ├── lib/         # Utilities
│   │   │   └── index.ts     # Entry point
│   │   ├── wrangler.jsonc   # Workers config
│   │   └── package.json
│   │
│   └── web/                 # Frontend (Astro)
│       ├── src/
│       │   ├── components/  # UI components (Astro + React)
│       │   │   ├── ui/      # Reusable components (13 components)
│       │   │   └── app/     # App-specific components
│       │   ├── layouts/     # Layout templates
│       │   ├── pages/       # Routes (Astro pages)
│       │   │   ├── app/     # Protected dashboard pages
│       │   │   └── public/  # Public pages
│       │   ├── lib/         # Utilities
│       │   │   ├── api-client.ts  # Hybrid API client
│       │   │   └── guards.ts      # Auth guards
│       │   └── styles/      # Global styles
│       ├── public/          # Static assets
│       ├── astro.config.mjs # Astro config (multi-mode)
│       └── package.json
│
├── packages/                # Shared packages
│   ├── db/                  # Database schema & migrations
│   ├── shared/              # Shared utilities
│   └── validation/          # Zod schemas
│
├── docs/                    # Documentation
│   ├── DEPLOYMENT_ARCHITECTURE.md
│   ├── DEPLOYMENT_MODE_B.md
│   ├── PHILOSOPHY.md
│   └── README.md (this file)
│
├── .github/workflows/       # CI/CD
├── wrangler.jsonc           # Root Wrangler config
└── package.json             # Root package.json
```

### **Hybrid Architecture**

Digital Lab Naik Kelas menggunakan **Hybrid Code Adaptive Layer** yang mendukung **3 deployment modes** dengan single codebase:

```typescript
// api-client.ts - Auto-detects deployment mode
const API_BASE = 
  import.meta.env.PUBLIC_API_URL ||  // Mode B/C: External API
  '/api';                            // Mode A: Integrated

export async function apiRequest(path, options) {
  // Works in ALL 3 modes automatically
}
```

---

## 🚀 Deployment Modes

### **Overview**

| Mode | Name | Architecture | Target | Cost |
|------|------|--------------|--------|------|
| **A** | Fullstack Selfhosted | Astro SSR + Integrated API | VPS/Docker | $0-20/mo |
| **B** | JAMSTACK Cloudflare | Astro SSG + CF Workers | CF Pages + Workers | $0/mo |
| **C** | JAMSTACK GitHub Pages | Astro SSG + External API | GH Pages + Any API | $0/mo |

### **Mode B: JAMSTACK Cloudflare (RECOMMENDED)** ⭐

**Arsitektur**:
```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  CF Pages    │ ───▶ │  CF Workers  │ ───▶ │  Turso       │
│  (Static)    │ HTTPS│  (Edge API)  │      │  (Edge DB)   │
└──────────────┘      └──────────────┘      └──────────────┘
     ↓                      ↓                      ↓
  Global CDN            300+ PoP              Edge Replicas
  <50ms latency         <10ms latency         <20ms latency
```

**Karakteristik**:
- ✅ **Separated API**: Frontend di CF Pages, API di CF Workers
- ✅ **Edge Computing**: API berjalan di 300+ lokasi global
- ✅ **JWT Auth**: Stateless authentication
- ✅ **Zero Maintenance**: Cloudflare urus semuanya
- ✅ **Free Tier**: Cukup untuk mulai (100k requests/hari)

**Best For**:
- Komunitas tanpa IT team
- Global audience (latency critical)
- Budget $0 (free tier)
- Rapid deployment (push to deploy)

**Deployment URL**:
- Frontend: `https://digital-lab-naik-kelas.pages.dev`
- API: `https://digital-lab-api.konxc.workers.dev`

### **Mode A: Fullstack Selfhosted**

**Arsitektur**: Monolith SSR
```
┌─────────────────────────────────────┐
│   Astro SSR (Monolith)              │
│   ├── Static Pages (SSG)            │
│   ├── SSR Pages (Dynamic)           │
│   ├── API Routes (/api/*)           │
│   └── Direct Database Access        │
└─────────────────────────────────────┘
         ↓ Deploy ke:
┌─────────────────────────────────────┐
│   VPS / Docker / On-premise         │
└─────────────────────────────────────┘
```

**Best For**:
- Sekolah dengan data center sendiri
- Compliance requirement (data harus lokal)
- Integration dengan SLiMS/SIAK

### **Mode C: JAMSTACK GitHub Pages**

**Arsitektur**: SSG + Flexible API
```
┌──────────────┐      ┌──────────────────┐      ┌──────────────┐
│  GitHub      │ ───▶ │  API Provider    │ ───▶ │  Database    │
│  Pages       │ HTTPS│  (Your Choice)   │      │  (Your Choice)│
└──────────────┘      └──────────────────┘      └──────────────┘
```

**Best For**:
- Open source projects
- GitHub-native workflow
- Need API flexibility

---

## 💰 Business Model

### **Revenue Streams**

#### 1. **Individual Subscriptions (B2C)**
- **Price**: Rp 99k/month atau Rp 999k/year
- **Features**:
  - Access to all courses
  - Progress tracking
  - Certificates
  - Community access
  - Priority support

#### 2. **School Licenses (B2B2C)**
- **Price**: Rp 750k/school/month (mid-tier)
- **Features**:
  - All Pro features
  - Multi-student management
  - Custom branding (white-label)
  - Analytics dashboard
  - Dedicated support
  - SSO integration

#### 3. **Corporate Training (B2B)**
- **Price**: Custom (Rp 5-50M/project)
- **Features**:
  - Custom curriculum
  - Private cohort
  - Assessment & certification
  - Progress reporting
  - Dedicated mentor

#### 4. **Certification Fees (Optional)**
- **Price**: Rp 50k-200k/certificate
- **Features**:
  - Verified certificate
  - Shareable credential
  - LinkedIn integration

### **Cost Structure**

| Item | Free Tier | Scale Tier |
|------|-----------|------------|
| Cloudflare Workers | $0 (100k req/day) | $20/mo (10M req) |
| Cloudflare Pages | $0 (unlimited) | $0 (unlimited) |
| Turso DB | $0 (9GB storage) | $29/mo (100GB) |
| Domain | $15/year | $15/year |
| Payment Gateway | 2-3% per tx | 2-3% per tx |
| **Total Fixed** | **~$0-15/mo** | **~$50-100/mo** |

### **Break-even Analysis**

#### **Scenario Conservative**:
- 50 individual subscribers @ Rp 99k = Rp 4.95M/mo
- 5 schools @ Rp 750k = Rp 3.75M/mo
- **Total Revenue**: Rp 8.7M/mo (~$550/mo)
- **Total Cost**: ~Rp 1.5M/mo (~$100/mo)
- **Profit**: Rp 7.2M/mo (~$450/mo)
- **Margin**: **90%+**

#### **Scenario Moderate**:
- 200 individual @ Rp 99k = Rp 19.8M/mo
- 20 schools @ Rp 750k = Rp 15M/mo
- **Total Revenue**: Rp 34.8M/mo (~$2,200/mo)
- **Profit**: Rp 33.3M/mo (~$2,100/mo)
- **Margin**: **95%+**

### **Pricing Strategy**

#### **Free Tier** (Student Acquisition):
- Access to 3-5 free courses
- Basic progress tracking
- Community forum access
- Watermarked certificates

#### **Pro Tier** (Rp 99k/month):
- All courses (50+ courses)
- Unlimited certificates
- 1-on-1 mentorship (1x/month)
- Priority support
- Job board access

#### **School Tier** (Rp 750k/school/month):
- All Pro features
- Up to 100 students
- Custom branding
- Analytics dashboard
- SSO integration
- Dedicated support

#### **Enterprise** (Custom):
- Unlimited students
- White-label platform
- Custom integrations
- SLA guarantee
- On-premise deployment option

---

## 🎓 Getting Started

### **For Students**

1. **Register**:
   ```
   Visit: https://lab.aksesekolah.id/register
   Fill: Name, Email, Password
   Verify: Check email for confirmation
   ```

2. **Browse Courses**:
   ```
   Visit: /courses
   Filter: By track (Web Dev, AI, Data Science, etc.)
   Enroll: Click "Join Course"
   ```

3. **Start Learning**:
   ```
   Access: /learning
   Watch: Video lessons
   Submit: Projects & assignments
   Track: Progress dashboard
   ```

4. **Get Certified**:
   ```
   Complete: All lessons + final project
   Submit: Portfolio project
   Earn: Shareable certificate
   ```

### **For Schools**

1. **Request Demo**:
   ```
   Visit: /schools
   Book: Demo session
   Discuss: Needs & customization
   ```

2. **Setup**:
   ```
   Sign: License agreement
   Configure: School branding
   Integrate: SSO (optional)
   Onboard: Teachers & students
   ```

3. **Launch**:
   ```
   Train: Teachers & admins
   Deploy: To students
   Monitor: Analytics dashboard
   Optimize: Based on data
   ```

### **For Mentors**

1. **Apply**:
   ```
   Visit: /become-mentor
   Submit: Portfolio & expertise
   Interview: 30-min session
   ```

2. **Create Course**:
   ```
   Access: Mentor dashboard
   Create: Course outline
   Upload: Content (video, PDF, quiz)
   Publish: Go live
   ```

3. **Earn**:
   ```
   Track: Student enrollments
   Engage: Q&A, feedback
   Get Paid: Revenue share (50-70%)
   ```

---

## 💻 Development Workflow

### **Prerequisites**

```bash
# Required
- Node.js >= 22.12.0
- Bun >= 1.1.0
- Git
- Turso account (free)
- Cloudflare account (free)
```

### **Local Development**

```bash
# 1. Clone repository
git clone https://github.com/konxc/digital-lab-naik-kelas.git
cd digital-lab-naik-kelas

# 2. Install dependencies
bun install

# 3. Setup environment
cp .env.example .env
# Edit .env dengan credentials Anda

# 4. Setup database
bun run db:push
bun run db:seed

# 5. Start development
bun run dev
```

**Access**:
- Frontend: http://localhost:4321
- API: http://localhost:8787

### **Available Scripts**

```bash
# Development
bun run dev              # Start all dev servers
bun run dev:api          # API only
bun run dev:web          # Frontend only

# Build
bun run build            # Build for production (auto-detect mode)
bun run build:ssr        # Mode A: SSR build
bun run build:ssg        # Mode B/C: SSG build
bun run build:hybrid     # Hybrid build

# Preview
bun run preview          # Preview production build
bun run preview:ssr
bun run preview:ssg

# Database
bun run db:generate      # Generate migrations
bun run db:push          # Push schema to DB
bun run db:migrate       # Run migrations
bun run db:studio        # Open Drizzle Studio
bun run db:seed          # Seed database

# Deployment
bun run deploy:api       # Deploy API to CF Workers
bun run deploy:web       # Deploy frontend to CF Pages
bun run deploy           # Deploy all

# Testing
bun test                 # Run unit tests
bun run test:e2e         # Run E2E tests
bun run lint             # Lint code
bun run format           # Format code
```

### **Environment Variables**

```bash
# .env.example

# =============================================================================
# DEPLOYMENT MODE (Choose ONE)
# =============================================================================
DEPLOY_MODE=ssg          # 'ssr' | 'ssg' | 'hybrid'
SSR_MODE=false           # 'true' for Mode A, 'false' for Mode B/C
PUBLIC_API_URL=          # Leave empty for Mode A, set for Mode B/C
                         # Example: https://api.konxc.workers.dev

# =============================================================================
# DATABASE (Turso)
# =============================================================================
TURSO_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your_token

# =============================================================================
# AUTH
# =============================================================================
JWT_SECRET=your_secret_change_this_in_production
JWT_EXPIRY=7d

# =============================================================================
# OPTIONAL
# =============================================================================
# Email (Cloudflare Email Sending)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your@gmail.com
# SMTP_PASS=your_app_password

# File Upload (Cloudflare R2)
# S3_BUCKET=your-bucket
# S3_REGION=auto
# S3_ACCESS_KEY=your_key
# S3_SECRET_KEY=your_secret

# Feature Flags
# ENABLE_SLIMS_INTEGRATION=false
# ENABLE_EMAIL_NOTIFICATIONS=false
# ENABLE_FILE_UPLOAD=false
```

---

## 🌐 Deployment Guide

### **Mode B: JAMSTACK Cloudflare (RECOMMENDED)**

#### **Step 1: Deploy API ke Cloudflare Workers**

```bash
cd apps/api

# Login (one-time)
bunx wrangler login

# Set secrets
bunx wrangler secret put JWT_SECRET
bunx wrangler secret put TURSO_URL
bunx wrangler secret put TURSO_AUTH_TOKEN

# Deploy
bunx wrangler deploy
```

**Output**:
```
Uploaded digital-lab-api (9.64 sec)
Deployed digital-lab-api triggers (7.17 sec)
  https://digital-lab-api.konxc.workers.dev
```

#### **Step 2: Build Frontend**

```bash
cd apps/web

# Build dengan API URL
PUBLIC_API_URL=https://digital-lab-api.konxc.workers.dev \
DEPLOY_MODE=ssg \
bun run build
```

**Output**:
```
166 page(s) built in 5.84s
Build Complete!
```

#### **Step 3: Deploy Frontend ke Cloudflare Pages**

```bash
# Create project (one-time via dashboard)
# Visit: https://dash.cloudflare.com/?to=/:account/pages/new
# Project name: digital-lab-naik-kelas

# Deploy
bunx wrangler pages deploy dist/ --project-name=digital-lab-naik-kelas
```

**Output**:
```
✨ Deployment complete!
https://digital-lab-naik-kelas.pages.dev
```

#### **Step 4: Setup Custom Domain (Optional)**

```bash
# Via Cloudflare Dashboard:
# Pages → digital-lab-naik-kelas → Custom domains
# Add: lab.aksesekolah.id
```

#### **Step 5: Verify Deployment**

```bash
# Test API
curl https://digital-lab-api.konxc.workers.dev/api/health

# Test Frontend
curl https://digital-lab-naik-kelas.pages.dev

# Test Login Flow
# 1. Visit /login
# 2. Login dengan test credentials
# 3. Verify redirect ke /app/overview
# 4. Check localStorage ada JWT token
```

### **Mode A: Fullstack Selfhosted**

```bash
# Build SSR
DEPLOY_MODE=ssr bun run build

# Deploy ke VPS/Docker
docker-compose up -d

# Or with PM2
pm2 start apps/web/dist/server/entry.mjs --name digital-lab
```

### **Mode C: JAMSTACK GitHub Pages**

```bash
# Build SSG
PUBLIC_API_URL=https://your-api.com \
DEPLOY_MODE=ssg \
bun run build

# Deploy via GitHub Actions
# .github/workflows/deploy-pages.yml will auto-deploy
```

---

## 🔗 Integration dengan AksesSekolah

### **Single Sign-On (SSO)**

**Architecture**:
```
AksesSekolah User Database
         ↓
    Shared JWT Secret
         ↓
Digital Lab Naik Kelas
```

**Implementation**:

1. **Shared JWT Secret**:
   ```bash
   # Set same JWT_SECRET di both platforms
   # AksesSekolah: apps/api/.env
   # Digital Lab: apps/api/.env
   JWT_SECRET=same_secret_for_both_platforms
   ```

2. **User Sync** (Optional):
   ```sql
   -- Shared user table
   CREATE TABLE users (
     id TEXT PRIMARY KEY,
     email TEXT UNIQUE,
     password_hash TEXT,
     role TEXT,
     created_at TIMESTAMP
   );
   ```

3. **Cross-Platform Navigation**:
   ```html
   <!-- Di AksesSekolah dashboard -->
   <a href="https://lab.aksesekolah.id" target="_blank">
     Akses Digital Lab
   </a>

   <!-- Di Digital Lab dashboard -->
   <a href="https://app.aksesekolah.id" target="_blank">
     Akses School Management
   </a>
   ```

### **Cross-Promotion**

#### **Bundle Pricing**:
```
AksesSekolah Only: Rp 1M/school/month
Digital Lab Only: Rp 750k/school/month
Bundle (Both): Rp 1.5M/school/month (Save 25%)
```

#### **Shared Analytics**:
```typescript
// Unified dashboard API
GET /api/analytics/unified
{
  "aksesekolah": {
    "active_students": 500,
    "teachers": 50,
    "classes": 20
  },
  "digital_lab": {
    "course_enrollments": 1200,
    "completed_courses": 300,
    "certificates_issued": 150
  },
  "combined": {
    "total_users": 600,
    "engagement_score": 85
  }
}
```

### **Data Sharing**

#### **Shared Entities**:
- `users` - User accounts (shared)
- `schools` - School information (shared)
- `enrollments` - Course enrollments (Digital Lab only)
- `grades` - Academic grades (AksesSekolah only)
- `certificates` - Course certificates (Digital Lab only)

#### **API Integration**:
```typescript
// AksesSekolah → Digital Lab
POST https://lab.aksesekolah.id/api/enrollments
{
  "user_id": "user_123",
  "course_id": "course_456",
  "school_id": "school_789"
}

// Digital Lab → AksesSekolah
POST https://app.aksesekolah.id/api/certificates
{
  "user_id": "user_123",
  "certificate_url": "https://lab.aksesekolah.id/cert/abc123",
  "course_name": "Web Development 101"
}
```

---

## 📅 Roadmap

### **Phase 1: Foundation** ✅ (Completed - June 2026)
- [x] Fork from SMA-UII-Yogyakarta to konxc
- [x] Rebranding (logo, colors, copy)
- [x] Mode B deployment (CF Pages + Workers)
- [x] Basic documentation
- [x] 13 reusable UI components
- [x] Hybrid API client
- [x] JWT authentication

### **Phase 2: Course Features** (July 2026)
- [ ] Course management (CRUD)
- [ ] Module/Lesson structure
- [ ] Progress tracking
- [ ] Certificate generation
- [ ] Quiz system
- [ ] Content types (Video, PDF, Markdown)

### **Phase 3: Payment Integration** (August 2026)
- [ ] Midtrans integration
- [ ] Course pricing
- [ ] Coupon system
- [ ] Affiliate tracking
- [ ] Revenue share for mentors

### **Phase 4: AksesSekolah Integration** (September 2026)
- [ ] SSO implementation
- [ ] Shared user database
- [ ] Cross-promotion UI
- [ ] Bundle pricing
- [ ] Unified analytics

### **Phase 5: Multi-Tenant Lite** (October 2026)
- [ ] Organization support
- [ ] Cohort/Batch management
- [ ] Instructor assignment
- [ ] White-label branding
- [ ] Custom domains per school

### **Phase 6: Go-to-Market** (November 2026)
- [ ] Landing page
- [ ] Pricing page
- [ ] Demo video
- [ ] Case study (SMA UII)
- [ ] Soft launch (5 pilot schools)
- [ ] Hard launch (public)

### **Phase 7: Scale** (Q1 2027)
- [ ] 50+ courses
- [ ] 100+ mentors
- [ ] 50+ schools
- [ ] Mobile app (React Native)
- [ ] AI-powered recommendations
- [ ] International expansion

---

## ❓ FAQ

### **General**

**Q: Apa bedanya Digital Lab Naik Kelas dengan NaikKelas.id?**  
A: Digital Lab Naik Kelas adalah platform baru yang terpisah dari NaikKelas.id (existing). Digital Lab menggunakan arsitektur JAMSTACK yang lebih modern dan fokus pada community-driven learning, sedangkan NaikKelas.id adalah cohort-based LMS dengan SvelteKit yang saat ini masih dalam pengembangan.

**Q: Apakah Digital Lab Naik Kelas menggantikan AksesSekolah?**  
A: Tidak. Digital Lab Naik Kelas adalah produk terpisah yang terintegrasi dengan AksesSekolah melalui SSO dan cross-promotion. AksesSekolah tetap fokus pada School Management System, sementara Digital Lab fokus pada online courses.

**Q: Berapa biaya deployment?**  
A: Hampir $0 untuk mulai (free tier Cloudflare + Turso). Saat scale, estimasi $50-100/mo untuk infrastruktur.

### **Technical**

**Q: Kenapa pilih JAMSTACK (Mode B)?**  
A: 
- Zero maintenance (tidak perlu urus server)
- Global CDN (latency <50ms)
- Auto-scaling (Cloudflare handle traffic spikes)
- Cost efficient (free tier cukup untuk mulai)
- Security (static files = minimal attack surface)

**Q: Bisa deploy on-premise?**  
A: Ya, gunakan Mode A (Fullstack Selfhosted). Deploy ke VPS/Docker dengan instruksi di Deployment Guide.

**Q: Bagaimana dengan database?**  
A: Menggunakan Turso (LibSQL/SQLite edge-replicated). Free 9GB storage, 1B reads/month. Bisa migrate ke PostgreSQL nanti jika perlu.

**Q: Apakah support GitHub OAuth?**  
A: GitHub OAuth hanya tersedia di Mode A (SSR). Mode B/C menggunakan username/password login dengan JWT. Alternatif: migrate ke Auth0/Clerk untuk OAuth di JAMSTACK mode.

### **Business**

**Q: Bagaimana revenue share untuk mentors?**  
A: 50-70% revenue share tergantung exclusive agreement. Mentor dapat payment per enrollment atau fixed fee per course.

**Q: Berapa break-even point?**  
A: Dengan 50 individual subscribers + 5 schools, break-even di month 1 dengan profit margin 90%+.

**Q: Apakah bisa white-label untuk sekolah?**  
A: Ya, School Tier termasuk custom branding, custom domain, dan white-label platform.

**Q: Bagaimana cara onboard sekolah?**  
A: 
1. Request demo via /schools
2. Demo session (30 min)
3. Sign agreement
4. Setup & branding (1-2 days)
5. Training admins & teachers
6. Launch to students

---

## 📚 Related Documentation

- [DEPLOYMENT_ARCHITECTURE.md](./docs/DEPLOYMENT_ARCHITECTURE.md) — 3 deployment modes deep dive
- [DEPLOYMENT_MODE_B.md](./docs/DEPLOYMENT_MODE_B.md) — Mode B step-by-step guide
- [PHILOSOPHY.md](./docs/PHILOSOPHY.md) — Filosofi Digital Lab
- [WORKFLOW.md](./docs/WORKFLOW.md) — Development workflow
- [BACKLOG.md](./docs/BACKLOG.md) — Product backlog

---

## 🤝 Contributing

Digital Lab Naik Kelas adalah **open source**. Kontribusi sangat welcome!

### **Cara Berkontribusi**:

1. **Fork repository**
2. **Create branch**: `git checkout -b feat/nama-fitur`
3. **Commit changes**: `git commit -m 'feat: add amazing feature'`
4. **Push**: `git push origin feat/nama-fitur`
5. **Create Pull Request**

### **Yang Dibutuhkan**:
- 📝 Documentation improvements
- 🐛 Bug fixes
- ✨ New features
- 🎨 UI/UX improvements
- 🧪 Tests
- 🌍 Translations (EN, JA)

### **Code of Conduct**:
- Be respectful
- No AI slop (quality over quantity)
- Test before submit
- Document your changes

---

## 📞 Support

- **GitHub Issues**: [Report bugs](https://github.com/konxc/digital-lab-naik-kelas/issues)
- **Discussions**: [Ask questions](https://github.com/konxc/digital-lab-naik-kelas/discussions)
- **Email**: support@konxc.space
- **Documentation**: [Full docs](https://lab.aksesekolah.id/docs)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

**Copyright © 2026 PT Koneksi Jaringan Indonesia**

---

## 🙏 Acknowledgments

Digital Lab Naik Kelas dibangun di atas pundak raksasa:

- **SMA UII Yogyakarta** — Original Digital Lab concept & implementation
- **Yayasan Klub Fisika (KF13)** — Naik Kelas philosophy & cohort-based learning
- **Cloudflare** — JAMSTACK infrastructure (Workers, Pages, R2)
- **Turso** — Edge database (LibSQL)
- **Astro** — Hybrid web framework
- **Hono** — Ultra-fast Workers router
- **Drizzle ORM** — Type-safe database
- **Lucia** — Authentication library

---

<div align="center">
  <sub>Built with ❤️ by PT Koneksi Jaringan Indonesia</sub>
  <br>
  <sub>Empowering Indonesian digital talent through education & community</sub>
</div>

---

## 🚀 Quick Start Commands

```bash
# Clone
git clone https://github.com/konxc/digital-lab-naik-kelas.git
cd digital-lab-naik-kelas

# Install
bun install

# Setup
cp .env.example .env
# Edit .env

# Database
bun run db:push
bun run db:seed

# Dev
bun run dev

# Build (Mode B)
PUBLIC_API_URL=https://your-api.workers.dev DEPLOY_MODE=ssg bun run build

# Deploy
bun run deploy:api
bun run deploy:web
```

---

**Last Updated**: June 22, 2026  
**Version**: 1.0.0 (Mode B Production Ready)  
**Maintained By**: PT Koneksi Jaringan Indonesia  
**Status**: ✅ Production Ready