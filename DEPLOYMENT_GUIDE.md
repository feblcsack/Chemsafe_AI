# 🚀 Deployment Guide: Vercel (Frontend) + Railway (Backend)

## Overview

**Architecture:**
- ✅ Frontend: Next.js deployed on **Vercel** (free tier)
- ✅ Backend: FastAPI deployed on **Railway** (free tier $5/month credit)
- ✅ Database: **Supabase** (already configured)
- ✅ Monorepo: Single repo with separate deploy paths

---

## Railway Free Tier Limits

✅ **Railway BISA GRATIS** dengan limitations:

| Resource | Free Tier | Notes |
|----------|-----------|-------|
| Credit | $5/month | Resets monthly |
| Usage | ~500 hours/month | If app sleeps when idle |
| RAM | 512MB - 8GB | Flexible |
| CPU | Shared | Fair use |
| Storage | 1GB | For code + models |
| Bandwidth | Generous | Usually sufficient |

**Tips untuk hemat credit:**
- App akan sleep setelah 5 menit idle (gratis)
- Wake up otomatis saat ada request (~1-2 detik cold start)
- Monitoring kamera = high usage, matikan saat tidak dipakai
- $5 credit biasanya cukup untuk development + demo

---

## 📋 Prerequisites

1. **GitHub account** - Repo sudah ada ✅
2. **Railway account** - Signup di [railway.app](https://railway.app)
3. **Vercel account** - Signup di [vercel.com](https://vercel.com)
4. **Supabase** - Already configured ✅

---

## 🔧 Step 1: Deploy Backend ke Railway

### 1.1 Create Railway Project

```bash
# Install Railway CLI (optional, bisa via web juga)
npm install -g @railway/cli

# Login
railway login

# OR just use Railway web dashboard
```

### 1.2 Via Railway Dashboard (Recommended)

1. Go to [railway.app/new](https://railway.app/new)
2. Click **"Deploy from GitHub repo"**
3. Select repository: `testerchem`
4. Railway akan auto-detect Python project

### 1.3 Configure Railway Settings

**Root Directory:**
```
backend
```

**Build Command:** (Railway auto-detects, tapi bisa override)
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Health Check Path:**
```
/health
```

### 1.4 Set Environment Variables di Railway

Dashboard → Variables → Add these:

```bash
# Supabase (copy from backend/.env)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# Performance
JPEG_ENCODE_QUALITY=70
COMPLIANCE_CHECK_INTERVAL_S=1.5
ORT_INTRA_OP_THREADS=2

# CORS (akan diset setelah deploy Vercel)
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGIN_REGEX=https://.*\.vercel\.app

# Python
PYTHONUNBUFFERED=1
```

### 1.5 Deploy!

Railway akan auto-deploy setelah push ke main branch.

**Check deployment:**
- Dashboard akan show URL: `https://your-app.up.railway.app`
- Test: `curl https://your-app.up.railway.app/health`
- Expected: `{"status":"ok","service":"chemsafe-backend"}`

---

## 🎨 Step 2: Deploy Frontend ke Vercel

### 2.1 Via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import Git Repository → Select `testerchem`
3. Configure Project:

**Framework Preset:** Next.js

**Root Directory:**
```
frontend
```

**Build Command:** (Vercel auto-detects)
```bash
npm run build
```

**Output Directory:**
```
.next
```

**Install Command:**
```bash
npm install
```

### 2.2 Set Environment Variables di Vercel

Dashboard → Settings → Environment Variables:

```bash
# Backend URL (from Railway)
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app

# Supabase (copy from frontend/.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Important:** Add these for **all environments** (Production, Preview, Development)

### 2.3 Deploy!

Click **Deploy** → Vercel will build and deploy

**Your app will be live at:**
```
https://your-app.vercel.app
```

---

## 🔄 Step 3: Update CORS di Railway

Setelah tau Vercel URL:

1. Go to Railway Dashboard → Variables
2. Update `FRONTEND_URL`:
```bash
FRONTEND_URL=https://your-app.vercel.app
```
3. Railway akan auto-redeploy

---

## 📁 Monorepo File Structure

```
testerchem/
├── .railwayignore          ← Railway ignores frontend/
├── railway.json            ← Railway config
├── Procfile               ← Railway start command
├── vercel.json            ← Vercel config
├── backend/
│   ├── main.py            ← FastAPI app
│   ├── requirements.txt   ← Python deps
│   ├── .env              ← LOCAL only (not committed)
│   └── routers/
├── frontend/
│   ├── .vercelignore     ← Vercel ignores backend/
│   ├── package.json      ← Node deps
│   ├── .env.local        ← LOCAL only (not committed)
│   └── src/
└── README.md
```

**Key Files Created:**
- ✅ `.railwayignore` - Railway ignores frontend files
- ✅ `railway.json` - Railway config
- ✅ `Procfile` - Railway start command
- ✅ `vercel.json` - Vercel config
- ✅ `frontend/.vercelignore` - Vercel ignores backend files

---

## 🔐 Security: Environment Variables

### ❌ NEVER Commit These:
```bash
# In .gitignore:
backend/.env
frontend/.env.local
.env
*.env
```

### ✅ How to Set Secrets:

**Railway:**
Dashboard → Variables → Add each variable

**Vercel:**
Dashboard → Settings → Environment Variables → Add each variable

---

## 🧪 Testing Deployment

### Test Backend (Railway)
```bash
# Health check
curl https://your-app.up.railway.app/health

# Test PubChem proxy
curl https://your-app.up.railway.app/pubchem/lookup \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"ghs_classes":["GHS_Symbol_FLAME"],"product_name_text":null}'
```

### Test Frontend (Vercel)
1. Open `https://your-app.vercel.app`
2. Should load homepage ✅
3. Try GHS scanner (client-side, no backend needed)
4. Try login → Should connect to Supabase ✅

### Test Frontend → Backend
1. Go to admin dashboard
2. Try "Assess Hazards" → Should call Railway backend
3. Check Network tab → Should see requests to Railway URL

---

## 🚨 Troubleshooting

### Issue: CORS errors in browser

**Symptoms:**
```
Access to fetch at 'https://your-backend.up.railway.app'
from origin 'https://your-app.vercel.app' has been blocked by CORS
```

**Fix:**
1. Check Railway env var `FRONTEND_URL` matches Vercel URL exactly
2. Redeploy Railway after changing env vars
3. Clear browser cache

---

### Issue: Railway app sleeps (cold start)

**Symptoms:**
- First request takes 1-2 seconds
- Subsequent requests fast

**This is NORMAL on free tier:**
- App sleeps after 5 min idle
- Wakes up automatically on request
- Cold start = ~1-2 seconds

**To keep awake (uses more credit):**
Add cron job to ping `/health` every 4 minutes (not recommended for free tier)

---

### Issue: Railway runs out of credit

**Symptoms:**
- App stops responding mid-month
- Dashboard shows $5 used

**Solutions:**
1. **Stop camera monitoring** when not needed (biggest usage)
2. Add payment method for $5/month
3. Optimize detection intervals:
```bash
COMPLIANCE_CHECK_INTERVAL_S=2.0  # Slower = less CPU
```

---

### Issue: Vercel build fails

**Check:**
1. `frontend/package.json` has all dependencies
2. `NEXT_PUBLIC_*` env vars set in Vercel
3. Build logs in Vercel dashboard
4. Try building locally first:
```bash
cd frontend
npm install
npm run build
```

---

## 📊 Monitoring Usage

### Railway Usage
1. Dashboard → Project → Usage
2. Watch CPU, RAM, Network
3. Free tier shows hours used vs credit

**Typical Usage:**
- Idle app: ~$0.01/hour
- Active app (no camera): ~$0.02/hour
- Camera monitoring: ~$0.10/hour (HIGH!)

**Tips:**
- Stop monitoring when not demoing
- Railway shows real-time usage
- Set up email alerts for 80% credit usage

### Vercel Usage
1. Dashboard → Usage
2. Free tier: 100 GB bandwidth/month
3. Unlimited deployments

**Typical Usage:**
- Next.js app bandwidth: Minimal
- ONNX model loaded client-side
- Should stay well within limits

---

## 🔄 Continuous Deployment

### Auto-deploy on Push

**Railway:**
- Watches `main` branch
- Auto-deploys on push
- Can configure branch in settings

**Vercel:**
- Watches all branches
- Main → Production
- Other branches → Preview deployments
- PR comments include preview links

**Workflow:**
```bash
git add .
git commit -m "feat: add new feature"
git push origin main

# Railway & Vercel auto-deploy!
```

---

## 🎯 Production Checklist

Before going live:

### Backend (Railway)
- [ ] All env vars set correctly
- [ ] Health check returns 200
- [ ] CORS allows Vercel domain
- [ ] Database connection working
- [ ] Test PPE detection endpoint
- [ ] Test PubChem proxy

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_URL` points to Railway
- [ ] Supabase vars set
- [ ] Homepage loads
- [ ] Login works
- [ ] GHS scanner works
- [ ] Admin dashboard accessible

### Integration
- [ ] Frontend can call backend APIs
- [ ] No CORS errors
- [ ] Camera monitoring works
- [ ] Real-time updates work
- [ ] Performance acceptable

---

## 💰 Cost Estimation

### Free Tier (Both Platforms)

**Railway:**
- $5/month credit
- Enough for development + demos
- Sleep mode saves credit

**Vercel:**
- Completely free for hobby
- 100 GB bandwidth
- Unlimited deployments

**Supabase:**
- Free tier: 500MB database
- 2GB bandwidth
- Good for demo/MVP

**Total: $0/month** ✅ (If you stay within Railway free credit)

### Paid Tier (If Needed)

**Railway:**
- $5/month for more credit
- Pay-as-you-go beyond that

**Vercel:**
- Free for hobby projects
- $20/month Pro (only if need team features)

**Supabase:**
- Free tier usually sufficient
- $25/month Pro (only if need more DB)

---

## 🚀 Deployment URLs

After deployment, you'll have:

```bash
# Backend (Railway)
https://testerchem-backend.up.railway.app

# Frontend (Vercel)
https://testerchem.vercel.app

# Database (Supabase)
https://your-project.supabase.co
```

---

## 📝 Quick Deploy Commands

### Using CLI (Optional)

**Railway CLI:**
```bash
# Deploy backend
cd backend
railway up
```

**Vercel CLI:**
```bash
# Deploy frontend
cd frontend
vercel --prod
```

### Using Git (Recommended)
```bash
# Both deploy automatically on push
git push origin main
```

---

## 🎓 Learning Resources

**Railway:**
- [Docs](https://docs.railway.app)
- [Pricing](https://railway.app/pricing)
- [Discord](https://discord.gg/railway)

**Vercel:**
- [Docs](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

## ✅ Success Criteria

Deployment successful if:

- [ ] Railway backend responding at `/health`
- [ ] Vercel frontend loads homepage
- [ ] No CORS errors in browser console
- [ ] Can login via Supabase
- [ ] Can scan GHS labels (client-side)
- [ ] Admin can create zones (backend call)
- [ ] Camera monitoring works (when enabled)

---

## 🆘 Need Help?

**Railway Issues:**
- Check Railway status: https://status.railway.app
- Community: https://discord.gg/railway
- Docs: https://docs.railway.app

**Vercel Issues:**
- Check Vercel status: https://www.vercel-status.com
- Community: https://github.com/vercel/vercel/discussions
- Docs: https://vercel.com/docs

---

**Status:** Ready to deploy! 🚀  
**Cost:** $0/month (free tier)  
**Time to deploy:** ~15 minutes  

Good luck with deployment! 🎉
