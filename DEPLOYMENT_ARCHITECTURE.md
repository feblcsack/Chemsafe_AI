# 🏗️ Deployment Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                          │
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │ GHS Scanner  │         │ PPE Monitor  │                │
│  │ (Client-side)│         │ (Server-side)│                │
│  │ ONNX Runtime │         │   WebSocket  │                │
│  └──────────────┘         └──────┬───────┘                │
└─────────────────────────────────┼────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
         ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
         │   VERCEL     │  │   RAILWAY    │  │  SUPABASE    │
         │  (Frontend)  │  │  (Backend)   │  │ (Database)   │
         │              │  │              │  │              │
         │  Next.js     │◄─┤  FastAPI     │◄─┤  PostgreSQL  │
         │  React       │  │  Python      │  │  RLS         │
         │  Tailwind    │  │  ONNX        │  │  Real-time   │
         └──────────────┘  └──────────────┘  └──────────────┘
              Free              $5/month           Free
           (Unlimited)         (500hrs)        (500MB DB)
```

---

## Component Breakdown

### 🎨 Frontend (Vercel)

**Location:** `frontend/`

**Tech Stack:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- ONNX Runtime Web (client-side ML)

**Responsibilities:**
- UI/UX rendering
- Client-side GHS detection (ONNX)
- Authentication flow (Supabase Auth)
- Real-time subscriptions
- Admin & worker dashboards

**Deployment:**
```
Vercel Edge Network (Global CDN)
→ Serverless Functions (API routes)
→ Static assets cached
```

**Why Vercel:**
- ✅ Free tier generous
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Preview deployments
- ✅ Zero config Next.js

---

### 🚂 Backend (Railway)

**Location:** `backend/`

**Tech Stack:**
- FastAPI (Python)
- ONNX Runtime (server-side PPE)
- OpenCV (camera processing)
- WebSocket (real-time streaming)
- Uvicorn (ASGI server)

**Responsibilities:**
- PPE detection (server-side)
- PubChem API proxy
- Zone/worker business logic
- Camera monitoring
- MJPEG proxy for RTSP cameras
- Analytics aggregation

**Deployment:**
```
Railway Container
→ Docker image (auto-built)
→ HTTPS endpoint
→ Health checks
```

**Why Railway:**
- ✅ $5/month free credit
- ✅ Python/FastAPI support
- ✅ WebSocket support
- ✅ Sleep mode (saves credit)
- ✅ Easy deployment

---

### 🗄️ Database (Supabase)

**Tech Stack:**
- PostgreSQL
- Row Level Security (RLS)
- Real-time subscriptions
- Authentication & Authorization

**Responsibilities:**
- User authentication
- Zone/worker data
- PPE events logging
- Real-time updates
- File storage (future)

**Why Supabase:**
- ✅ Free tier (500MB)
- ✅ Real-time built-in
- ✅ Auth included
- ✅ PostgreSQL (standard SQL)
- ✅ Generous free tier

---

## Data Flow Diagrams

### GHS Scanning (Client-Side)

```
┌──────────┐
│  User    │
│  Camera  │
└────┬─────┘
     │
     ▼
┌──────────────────────┐
│  Browser             │
│  ┌────────────────┐  │
│  │ GHSScanner.tsx │  │
│  └────┬───────────┘  │
│       │              │
│       ▼              │
│  ┌────────────────┐  │
│  │ ONNX Runtime   │  │
│  │ (Client-side)  │  │
│  └────┬───────────┘  │
│       │              │
│       ▼              │
│  ┌────────────────┐  │
│  │ Detections     │  │
│  │ Display        │  │
│  └────────────────┘  │
└──────────────────────┘
         │
         ▼
    ┌────────┐
    │Railway │  (Only for PubChem lookup)
    │Backend │
    └────────┘
```

**Key Points:**
- 100% client-side detection
- No image sent to server
- Privacy-preserving
- Works offline (after model load)

---

### PPE Monitoring (Server-Side)

```
┌──────────┐
│IP Camera │
│  RTSP    │
└────┬─────┘
     │
     ▼
┌──────────────────────┐
│  Railway Backend     │
│  ┌────────────────┐  │
│  │CameraMonitor   │  │
│  │  Loop          │  │
│  └────┬───────────┘  │
│       │              │
│       ▼              │
│  ┌────────────────┐  │
│  │ PPE Engine     │  │
│  │ ONNX Runtime   │  │
│  └────┬───────────┘  │
│       │              │
│       ▼              │
│  ┌────────────────┐  │
│  │ MJPEG Proxy    │  │
│  │ + Detection    │  │
│  │   Results      │  │
│  └────┬───────────┘  │
└───────┼──────────────┘
        │
        ▼
   ┌─────────┐
   │ Vercel  │  (Polls results + displays stream)
   │Frontend │
   └─────────┘
```

**Key Points:**
- Server-side inference (PPE model too large for browser)
- MJPEG proxy solves RTSP/CORS issues
- WebSocket alternative available
- Results polled every 3s

---

## Network Flow

```
     Internet
        │
   ┌────┴────┐
   │         │
   ▼         ▼
Vercel    Railway
(CDN)    (Server)
   │         │
   └────┬────┘
        │
        ▼
    Supabase
   (Database)
```

**Request Patterns:**

1. **Page Load:**
   ```
   User → Vercel CDN → Static HTML/CSS/JS
   ```

2. **API Call:**
   ```
   Browser → Vercel → Railway Backend → Supabase
   ```

3. **Real-time Update:**
   ```
   Supabase → WebSocket → Browser (direct)
   ```

4. **Camera Stream:**
   ```
   IP Camera → Railway (MJPEG proxy) → Browser <img>
   ```

---

## Scaling Strategy

### Current (Free Tier)

```
Vercel:    Unlimited requests
Railway:   ~500 hours/month ($5 credit)
Supabase:  500MB DB, 2GB bandwidth

Good for: Development, demos, small deployments
```

### Scale Up (Paid Tier)

```
Vercel:    $20/month (Pro) - Team features
Railway:   $5/month + usage - More CPU/RAM
Supabase:  $25/month (Pro) - 8GB DB, 250GB bandwidth

Good for: Production, multiple organizations
```

### High Scale (Future)

```
Vercel:    Enterprise - Custom pricing
Railway:   Multiple instances, load balancer
Supabase:  Pro/Team - Dedicated resources

Add:
- Redis cache (Railway)
- CDN for models (Cloudflare)
- Separate inference workers
- Horizontal scaling
```

---

## Security Architecture

### HTTPS Everywhere

```
Browser ──HTTPS──> Vercel ──HTTPS──> Railway
                     └──HTTPS──> Supabase
```

All connections encrypted end-to-end ✅

### Authentication Flow

```
1. User → Vercel (Login page)
2. Vercel → Supabase (Auth API)
3. Supabase → JWT token
4. Frontend stores token
5. All API calls include token
6. Backend validates with Supabase
```

### CORS Protection

```python
# Backend (Railway)
allow_origins = [
    "https://your-app.vercel.app",
    "https://*.vercel.app"  # Preview deployments
]
```

### RLS (Row Level Security)

```sql
-- Supabase
CREATE POLICY "Users see own org data"
ON zones FOR SELECT
USING (org_id = auth.uid()::text);
```

---

## Deployment Pipeline

### Continuous Deployment

```
Developer
    │
    ▼
git push origin main
    │
    ├───────────────────┐
    ▼                   ▼
GitHub              GitHub
    │                   │
    ▼                   ▼
Railway Auto-       Vercel Auto-
Deploy (Backend)    Deploy (Frontend)
    │                   │
    ▼                   ▼
Production          Production
```

**Automatic on every push!**

### Environment Management

```
Local Development:
- frontend/.env.local
- backend/.env

Production:
- Vercel env vars (dashboard)
- Railway env vars (dashboard)
```

---

## Monitoring & Observability

### Railway Backend

```
Dashboard → Metrics:
- CPU usage
- RAM usage
- Network I/O
- Request count
- Error rate
- Logs (real-time)
```

### Vercel Frontend

```
Dashboard → Analytics:
- Page views
- Core Web Vitals
- Bandwidth usage
- Build times
- Function invocations
```

### Supabase Database

```
Dashboard → Database:
- Active connections
- Query performance
- Storage usage
- Real-time connections
```

---

## Cost Breakdown (Monthly)

### Free Tier

```
Vercel:     $0   (100 GB bandwidth, unlimited builds)
Railway:    $0   ($5 credit, ~500 hours with sleep)
Supabase:   $0   (500MB DB, 2GB bandwidth)
─────────────
TOTAL:      $0/month
```

**Usage Tips:**
- Stop camera monitoring when not needed
- Railway sleeps after 5 min idle
- Supabase free tier usually sufficient

### If You Exceed Free Tier

```
Railway:    $5-20/month (pay-as-you-go)
Vercel:     Still free (hobby tier generous)
Supabase:   Still free (unless massive traffic)
─────────────
TOTAL:      $5-20/month
```

---

## Disaster Recovery

### Backup Strategy

**Code:**
- GitHub (source of truth)
- Can redeploy anytime

**Database:**
- Supabase auto-backup (7 days)
- Export SQL dumps manually

**Models:**
- Stored in repo
- Deployed with code

### Rollback Procedure

**Railway:**
```
Dashboard → Deployments → Select previous
→ "Rollback to this version"
```

**Vercel:**
```
Dashboard → Deployments → Select previous
→ "Promote to Production"
```

**Time to rollback:** < 2 minutes

---

## Performance Optimization

### Frontend (Vercel)

- Static generation where possible
- Client-side ONNX (offload processing)
- Image optimization (Next.js)
- Code splitting (automatic)
- CDN caching (global)

### Backend (Railway)

- Vectorized numpy operations
- JPEG quality adaptive
- Frame rate limiting
- Sleep mode when idle
- Health checks prevent timeouts

### Database (Supabase)

- Indexed queries
- Connection pooling
- RLS policies optimized
- Real-time subscriptions efficient

---

## Compliance & Privacy

### Data Handling

**Client-Side (GHS):**
- Images never leave browser ✅
- ONNX runs locally ✅
- Privacy-preserving ✅

**Server-Side (PPE):**
- Frames processed, not stored
- Only detection results saved
- GDPR compliant (no face recognition)

### Data Residency

- Vercel: Global CDN (configurable region)
- Railway: US-based (configurable)
- Supabase: Choose region on signup

---

## Success Metrics

### Deployment Successful If:

- ✅ Frontend loads at Vercel URL
- ✅ Backend responds at Railway URL
- ✅ No CORS errors
- ✅ Authentication works
- ✅ GHS scanner works (client-side)
- ✅ Admin can create zones (backend)
- ✅ Camera monitoring works (when enabled)

### Performance Targets:

- ✅ Page load < 2s (Vercel CDN)
- ✅ API response < 500ms (Railway)
- ✅ GHS detection < 1s (client ONNX)
- ✅ PPE detection < 1.5s (server ONNX)

---

**Architecture Status:** Production-ready ✅  
**Scalability:** Good for MVP → 1000s users  
**Cost:** $0/month (free tier)  
**Security:** HTTPS + RLS + JWT  

🚀 Ready for deployment!
