# 🚀 Deploy ke Vercel + Railway - Quick Start

## TL;DR

**Frontend:** Vercel (free)  
**Backend:** Railway (free $5 credit/month)  
**Database:** Supabase (already setup)  
**Time:** ~15 minutes  
**Cost:** $0/month ✅

---

## ✅ Prerequisites

- [x] Code pushed ke GitHub
- [x] Supabase already configured
- [x] Railway account (signup: [railway.app](https://railway.app))
- [x] Vercel account (signup: [vercel.com](https://vercel.com))

---

## 📦 Files Created for Deployment

✅ **`.railwayignore`** - Railway ignores frontend  
✅ **`railway.json`** - Railway config  
✅ **`Procfile`** - Railway start command  
✅ **`vercel.json`** - Vercel config  
✅ **`frontend/.vercelignore`** - Vercel ignores backend  
✅ **`backend/main.py`** - Updated CORS for Vercel  

---

## 🚂 Step 1: Deploy Backend ke Railway (5 min)

### Via Dashboard:
1. Go to [railway.app/new](https://railway.app/new)
2. "Deploy from GitHub repo" → Select `testerchem`
3. Settings → Root Directory: **`backend`**
4. Variables → Add:
   ```bash
   SUPABASE_URL=your_url
   SUPABASE_SERVICE_KEY=your_key
   JPEG_ENCODE_QUALITY=70
   COMPLIANCE_CHECK_INTERVAL_S=1.5
   ORT_INTRA_OP_THREADS=2
   ```
5. Deploy! → Copy URL (e.g., `https://xxx.up.railway.app`)

### Test:
```bash
curl https://your-railway-url.up.railway.app/health
# Should return: {"status":"ok"}
```

---

## 🎨 Step 2: Deploy Frontend ke Vercel (5 min)

### Via Dashboard:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import repo → Select `testerchem`
3. Root Directory: **`frontend`**
4. Framework: **Next.js** (auto-detected)
5. Environment Variables → Add:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
6. Deploy! → Copy URL (e.g., `https://your-app.vercel.app`)

---

## 🔄 Step 3: Update CORS (2 min)

### Back to Railway:
1. Variables → Add/Update:
   ```bash
   FRONTEND_URL=https://your-app.vercel.app
   CORS_ORIGIN_REGEX=https://.*\.vercel\.app
   ```
2. Save → Railway auto-redeploys

---

## 🧪 Test Deployment

### ✅ Backend Health:
```bash
curl https://your-railway-url.up.railway.app/health
```

### ✅ Frontend Loads:
Open `https://your-app.vercel.app` → Homepage should load

### ✅ No CORS Errors:
1. Open frontend
2. Try login
3. Check browser console → No CORS errors

### ✅ Integration Works:
1. Login as admin
2. Go to "Assess Hazards"
3. Should call Railway backend successfully

---

## 💰 Railway Free Tier - Is It Enough?

**Yes!** Railway gives **$5 credit/month**

| Usage Pattern | Monthly Cost | Hours Available |
|---------------|--------------|-----------------|
| **Development** | $0 | ~500 hours |
| **Demo/Testing** | $0 | ~500 hours |
| **Light Production** | $0 | ~500 hours |
| **Camera 24/7** | ~$15 | Need paid plan |

**Key Features:**
- ✅ App sleeps after 5 min idle (saves credit)
- ✅ Wakes in 1-2 seconds on request
- ✅ Perfect for development + demos
- ✅ Stop camera monitoring when not needed

**Tips to Stay Free:**
- Turn off monitoring when not demoing
- Free tier good for ~500 hours/month
- Typical idle: $0.01/hour
- Typical active: $0.02/hour
- **Camera monitoring: $0.10/hour** (HIGH!)

---

## 📊 What Gets Deployed Where

```
┌─────────────────────────────────────────┐
│          SINGLE MONOREPO                │
│                                         │
│  testerchem/                            │
│  ├── frontend/  ──→  VERCEL            │
│  │   ├── src/                          │
│  │   ├── public/                       │
│  │   └── package.json                  │
│  │                                     │
│  ├── backend/   ──→  RAILWAY           │
│  │   ├── routers/                      │
│  │   ├── main.py                       │
│  │   └── requirements.txt              │
│  │                                     │
│  └── .git/                             │
└─────────────────────────────────────────┘
```

**How it works:**
- Vercel only builds `frontend/` (via Root Directory setting)
- Railway only builds `backend/` (via Root Directory setting)
- Single `git push` deploys both! 🎉

---

## 🔄 Auto-Deploy Workflow

```bash
# Make changes
git add .
git commit -m "feat: new feature"
git push origin main

# Both platforms auto-deploy!
# Railway: Backend updates
# Vercel: Frontend updates
```

**Preview Deployments:**
- Vercel creates preview URL for every PR
- Railway stays on main branch
- Perfect for testing before merge

---

## 🚨 Common Issues

### ❌ CORS Error
**Symptoms:** Console shows CORS blocked

**Fix:**
1. Check `FRONTEND_URL` in Railway matches Vercel exactly
2. Redeploy Railway
3. Clear browser cache

### ❌ Railway App Sleeps
**Symptoms:** First request takes 1-2s

**This is normal!**
- App sleeps after 5 min idle (saves $)
- Wakes automatically on request
- Subsequent requests fast

### ❌ Build Fails
**Check:**
1. Build logs in dashboard
2. Env vars set correctly
3. Try building locally first

---

## 📚 Documentation Files

1. **`DEPLOY_README.md`** ← You are here (quick start)
2. **`DEPLOY_CHECKLIST.md`** - Step-by-step checklist
3. **`DEPLOYMENT_GUIDE.md`** - Full detailed guide
4. **`DEPLOYMENT_ARCHITECTURE.md`** - System architecture

---

## 🎯 Success Checklist

- [ ] Railway backend responds at `/health`
- [ ] Vercel frontend loads homepage
- [ ] No CORS errors in console
- [ ] Can login (Supabase)
- [ ] GHS scanner works
- [ ] Admin can create zones
- [ ] Camera monitoring works (when enabled)

---

## 💡 Pro Tips

### Save Railway Credit:
```bash
# Higher interval = less CPU
COMPLIANCE_CHECK_INTERVAL_S=2.0  # vs 1.5

# Lower quality = faster encoding
JPEG_ENCODE_QUALITY=65  # vs 70
```

### Monitor Usage:
- Railway: Dashboard → Usage
- Vercel: Dashboard → Analytics
- Set alerts at 80% credit

### Optimize Performance:
- Use Railway sleep mode (automatic)
- Vercel CDN is global (fast everywhere)
- Client-side ONNX reduces backend load

---

## 🆘 Need Help?

**Railway:**
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

**Vercel:**
- Docs: https://vercel.com/docs
- GitHub: https://github.com/vercel/vercel/discussions
- Status: https://www.vercel-status.com

**Your Docs:**
- See `DEPLOYMENT_GUIDE.md` for full details
- See `TROUBLESHOOTING.md` for issues

---

## ✅ Deployment Complete!

Your app is now live at:

```
🎨 Frontend: https://your-app.vercel.app
🚂 Backend:  https://your-backend.up.railway.app
🗄️ Database: Supabase (already configured)
```

**Cost:** $0/month (free tier)  
**Status:** Production-ready ✅  
**Time:** ~15 minutes ⚡  

---

## 🎉 What's Next?

1. ✅ Test all features
2. ✅ Share URLs with team
3. ✅ Monitor Railway usage
4. ✅ Stop camera when not demoing
5. ✅ Set up custom domain (optional)
6. ✅ Ready for Intel AI competition! 🏆

**Congratulations! Your app is deployed!** 🚀
