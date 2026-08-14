# ChemSafe Quick Setup Guide 🚀

## 1. Database Setup (5 menit)

### Step 1: Supabase Setup
1. Buka [Supabase.com](https://supabase.com) → Create new project
2. Wait project selesai (2-3 menit)
3. Copy **Project URL** dan **anon public key** dari Settings → API

### Step 2: Run Database Script
1. Buka Supabase dashboard → SQL Editor
2. Copy paste semua isi file `setup-database.sql`
3. Click **RUN** → Wait sampai selesai
4. ✅ Database ready!

## 2. Environment Setup (2 menit)

### Frontend `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend `.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
FRONTEND_URL=http://localhost:3000
PPE_MIN_FRAME_INTERVAL_S=0.5
ORT_INTRA_OP_THREADS=2
```

## 3. Install & Run (3 menit)

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && pip install -r requirements.txt

# Run backend
cd backend && python main.py

# Run frontend (new terminal)
cd frontend && npm run dev
```

## 4. Test System (5 menit)

### Admin Test:
1. Buka http://localhost:3000
2. Sign up sebagai **Admin**
3. Masuk admin dashboard → 5 tabs available
4. Test "Assess Hazards" → scan something
5. Create zone → QR code generated

### Worker Test:
1. Sign up sebagai **Worker** 
2. Masuk worker dashboard
3. Test scan QR code dari admin
4. Check safety briefing flow

## 5. External Camera Setup (Optional)

### Supported Camera Types:
- **IP Camera RTSP:** `rtsp://192.168.1.100:554/stream`
- **MJPEG Camera:** `http://192.168.1.100/mjpeg`  
- **USB Webcam:** Via streaming software
- **Security System:** API endpoints

### Setup Steps:
1. Admin Dashboard → "Camera Setup" tab
2. Add monitoring station
3. Input camera URL
4. Assign to zone
5. Test connection

## 6. Production Deployment

### Quick Deploy Options:

**Frontend (Vercel):**
```bash
cd frontend
npx vercel --prod
# Set environment variables di Vercel dashboard
```

**Backend (Railway):**
```bash
cd backend
railway login
railway init
railway deploy
# Set environment variables di Railway dashboard
```

**Alternative (Manual):**
- Frontend: Netlify, AWS CloudFront
- Backend: Render, Google Cloud Run, AWS ECS

## 7. Camera Integration Examples

### IP Camera Setup:
```javascript
// Admin Dashboard → Camera Setup
Station Name: "Storage Room Cam 1"
Zone: "Chemical Storage Area"
Camera URL: "rtsp://192.168.1.100:554/stream1"
Stream Key: "your_auth_key" (if needed)
```

### USB Webcam via OBS/FFmpeg:
```bash
# Stream USB camera via OBS to local HTTP
# Then use: http://localhost:8080/stream
```

### Security System Integration:
```javascript
// Hikvision example
Camera URL: "rtsp://admin:password@192.168.1.100:554/Streaming/Channels/101"

// Axis example  
Camera URL: "http://192.168.1.100/mjpg/video.mjpg"
```

## 8. System Architecture

```
📱 Worker Devices     🎥 External Cameras     💻 Admin Dashboard
      ↓                        ↓                        ↓
   QR Scan            →    PPE Detection    →    Live Monitoring
   Safety Brief            Real-time AI          Alert System
   Acknowledge             Compliance             Analytics
                           Violation Det.         Zone Management
```

## 9. Troubleshooting

### Common Issues:

**Database Error:**
- Check Supabase project is active
- Verify all SQL commands ran successfully
- Check RLS policies are enabled

**Camera Not Working:**
- Test camera URL directly di browser/VLC
- Check network connectivity backend → camera
- Verify camera supports RTSP/MJPEG
- Check firewall settings

**WebSocket Issues:**
- Check backend is running dan accessible
- Verify CORS settings di backend
- Test WebSocket connection manually

**Role Assignment:**
- Clear browser storage
- Re-signup dengan correct role
- Check profiles table di Supabase

## 10. Next Steps

### Production Checklist:
- [ ] Deploy to production servers
- [ ] Setup HTTPS untuk camera access
- [ ] Configure external cameras
- [ ] Train admin users
- [ ] Setup monitoring alerts
- [ ] Configure backups

### Enterprise Features:
- [ ] SSO integration (SAML/OIDC)
- [ ] Multi-organization setup
- [ ] Advanced analytics dashboard
- [ ] SMS/Email alert integration
- [ ] Custom branding

---

🎉 **System Ready!** Professional workplace safety monitoring dengan external camera integration!

**Support:** Check README.md untuk detailed documentation
**Issues:** GitHub issues untuk bug reports
**Features:** Contact untuk custom development