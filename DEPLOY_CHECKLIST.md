# ✅ Quick Deploy Checklist

## 🎯 Goal
Deploy **Frontend ke Vercel** + **Backend ke Railway** dalam satu monorepo

---

## 📋 Pre-Deployment

- [ ] Push all code ke GitHub
- [ ] Commit `.railwayignore`, `railway.json`, `Procfile`
- [ ] Commit `vercel.json`, `frontend/.vercelignore`
- [ ] **JANGAN commit** `.env` files (already in `.gitignore`)

---

## 🚂 Railway (Backend) - 5 minutes

### 1. Create Account & Project
- [ ] Signup di [railway.app](https://railway.app)
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose `testerchem` repository

### 2. Configure Root Directory
- [ ] Settings → Root Directory: `backend`
- [ ] Build Command: `pip install -r requirements.txt`
- [ ] Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 3. Add Environment Variables
Go to Variables tab, add:

```bash
SUPABASE_URL=your_url_here
SUPABASE_SERVICE_KEY=your_key_here
JPEG_ENCODE_QUALITY=70
COMPLIANCE_CHECK_INTERVAL_S=1.5
ORT_INTRA_OP_THREADS=2
PYTHONUNBUFFERED=1
```

- [ ] All variables added
- [ ] Copy Railway URL (e.g., `https://xxx.up.railway.app`)

### 4. Test Backend
```bash
curl https://your-railway-url.up.railway.app/health
```
- [ ] Returns `{"status":"ok"}`

---

## 🎨 Vercel (Frontend) - 5 minutes

### 1. Create Account & Project
- [ ] Signup di [vercel.com](https://vercel.com)
- [ ] Click "New Project"
- [ ] Import Git Repository → `testerchem`

### 2. Configure Root Directory
- [ ] Framework Preset: **Next.js**
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm run build` (auto-detected)

### 3. Add Environment Variables
Go to Settings → Environment Variables, add:

```bash
NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

- [ ] All variables added
- [ ] Set for **Production**, **Preview**, **Development**

### 4. Deploy
- [ ] Click "Deploy"
- [ ] Wait 2-3 minutes
- [ ] Copy Vercel URL (e.g., `https://testerchem.vercel.app`)

### 5. Test Frontend
- [ ] Open Vercel URL in browser
- [ ] Homepage loads ✅
- [ ] GHS Scanner works (client-side) ✅

---

## 🔄 Update CORS (Backend)

### Go back to Railway
- [ ] Variables → Add/Update:
```bash
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGIN_REGEX=https://.*\.vercel\.app
```
- [ ] Railway auto-redeploys (~1 min)

---

## 🧪 Integration Test

### Test Backend → Frontend Connection
- [ ] Open `https://your-app.vercel.app`
- [ ] Login (uses Supabase) ✅
- [ ] Go to Admin Dashboard
- [ ] Try "Assess Hazards" → Should call Railway backend
- [ ] Check browser Console → No CORS errors ✅

### Test Full Flow
- [ ] Worker can scan QR code
- [ ] Admin can see live monitoring
- [ ] Camera monitoring can be started
- [ ] Detection works (when camera enabled)

---

## 📊 Monitor Usage

### Railway
- [ ] Dashboard → Usage → Check credit usage
- [ ] Should be ~$0.01-0.02/hour when idle
- [ ] Stop camera monitoring when not needed

### Vercel
- [ ] Dashboard → Usage → Check bandwidth
- [ ] Should be minimal (client-side heavy)

---

## 🚨 Troubleshooting

### If CORS errors:
1. Check `FRONTEND_URL` in Railway matches Vercel URL exactly
2. Redeploy Railway
3. Clear browser cache
4. Check browser console for exact error

### If Railway sleeps (cold start):
- **This is normal on free tier**
- App wakes in 1-2 seconds
- First request will be slower

### If build fails:
1. Check build logs in dashboard
2. Verify env vars set correctly
3. Try building locally first

---

## ✅ Done!

Your app is now live:

```
Frontend: https://your-app.vercel.app
Backend:  https://your-backend.up.railway.app
Database: Supabase (already configured)
```

**Cost:** $0/month (within free tier limits)

---

## 🎯 Next Steps

1. Test all features end-to-end
2. Share URLs with team
3. Monitor Railway credit usage
4. Stop camera monitoring when not demoing
5. Set up custom domain (optional)

---

**Time to deploy:** ~15 minutes total  
**Difficulty:** Easy  
**Cost:** Free (Railway $5 credit/month)  

🎉 Congratulations! Your app is deployed!
