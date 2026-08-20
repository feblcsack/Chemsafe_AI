# Railway Deployment - FIXED ✅

## Masalah yang Diperbaiki

### 1. **Health Check Failure** ❌ → ✅
**Masalah:** Railway healthcheck timeout karena backend tidak merespons di port yang benar.

**Penyebab:** 
- Start command tidak menggunakan `PORT` environment variable dari Railway
- Railway assign port secara dinamis, tapi uvicorn hardcoded ke port 8000

**Solusi:**
```json
{
  "deploy": {
    "startCommand": "cd backend && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
  }
}
```

### 2. **Healthcheck Configuration** 
Ditambahkan konfigurasi eksplisit:
```json
{
  "healthcheckPath": "/health",
  "healthcheckTimeout": 300,
  "restartPolicyType": "ON_FAILURE",
  "restartPolicyMaxRetries": 3
}
```

### 3. **Startup Logging**
Ditambahkan logging untuk debugging deployment:
- Environment info
- Port yang digunakan  
- Frontend URL
- Health check endpoint

## Environment Variables yang Diperlukan di Railway

Pastikan environment variables berikut sudah di-set di Railway dashboard:

### Required:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
FRONTEND_URL=https://your-frontend.vercel.app
```

### Optional:
```bash
CORS_ORIGIN_REGEX=https://.*\.vercel\.app
PUBCHEM_API_KEY=your_pubchem_key  # Optional, untuk rate limit lebih tinggi
```

## Cara Deploy ke Railway

### 1. **Connect Repository**
```bash
# Di Railway dashboard:
1. New Project
2. Deploy from GitHub repo
3. Select: feblcsack/Chemsafe_AI
4. Railway akan auto-detect railway.json
```

### 2. **Set Environment Variables**
```bash
# Di Railway dashboard > Variables tab:
- Add SUPABASE_URL
- Add SUPABASE_SERVICE_KEY  
- Add FRONTEND_URL
```

### 3. **Deploy**
```bash
# Railway akan otomatis deploy setiap kali ada push ke main branch
# Atau trigger manual dari dashboard
```

### 4. **Verify Deployment**
```bash
# Check logs:
# Harus melihat:
✅ "🚀 ChemSafe Backend Starting..."
✅ "📍 Environment: production"  
✅ "🌐 Port: <railway_port>"
✅ "✅ Health check: /health"

# Test endpoints:
curl https://your-backend.railway.app/
curl https://your-backend.railway.app/health
curl https://your-backend.railway.app/docs
```

## Expected Build Time
- **Build:** ~2-3 minutes (dependencies install)
- **Health Check:** Should pass within 30-60 seconds
- **Total:** ~3-4 minutes for full deployment

## Troubleshooting

### Health Check Still Failing?
1. Check Railway logs untuk startup errors
2. Verify environment variables di-set dengan benar
3. Check Supabase credentials valid
4. Ensure PORT variable tersedia (Railway provides otomatis)

### Import Errors?
```bash
# Check requirements.txt lengkap
# Semua dependencies harus ada:
- fastapi==0.115.0
- uvicorn[standard]==0.30.6
- httpx==0.27.2
- pydantic==2.9.2
- supabase==2.9.0
- python-multipart==0.0.12
- pillow==10.4.0
- numpy==1.26.4
- onnxruntime==1.19.2
- websockets==13.1
- opencv-python==4.10.0.84
```

### CORS Errors?
```bash
# Pastikan FRONTEND_URL di Railway match dengan Vercel deployment URL
# Format: https://your-app.vercel.app (tanpa trailing slash)
```

## Next Steps

1. ✅ Deploy backend ke Railway
2. ✅ Get Railway URL: `https://your-backend.railway.app`
3. ⚠️ Update `NEXT_PUBLIC_API_URL` di Vercel dengan Railway URL
4. ⚠️ Redeploy frontend di Vercel
5. ✅ Test full flow end-to-end

## Railway Service URL
Setelah deploy sukses, Railway akan provide public URL:
```
https://chemsafe-production.up.railway.app
```

Gunakan URL ini sebagai `NEXT_PUBLIC_API_URL` di frontend Vercel.

## Status Check Commands

```bash
# Check backend health
curl https://your-backend.railway.app/health

# Check API docs
open https://your-backend.railway.app/docs

# Test PubChem endpoint
curl https://your-backend.railway.app/pubchem/lookup \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"ghs_classes": ["GHS_Symbol_FLAME"]}'
```

## Monitoring

Railway provides built-in monitoring:
- ✅ Resource usage (CPU, Memory)
- ✅ Request logs
- ✅ Deployment history
- ✅ Health check status

Access via Railway dashboard > Your Project > Deployments tab

---

## Perubahan di Kode

### `railway.json`
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### `backend/main.py`
Added:
- `/` root endpoint
- Enhanced `/health` endpoint
- Startup event logging
- Environment info logging

---

**Deployment seharusnya sekarang berhasil! 🚀**

Jika masih ada error, check Railway logs dan share error messagenya.
