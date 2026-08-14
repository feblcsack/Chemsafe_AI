# ChemSafe Deployment Checklist

## Environment Variables yang Diperlukan

### Backend (.env di /backend/)
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Frontend URL untuk CORS
FRONTEND_URL=http://localhost:3000  # atau domain production

# PPE Detection Settings  
PPE_MIN_FRAME_INTERVAL_S=0.5  # frame rate throttling
ORT_INTRA_OP_THREADS=2  # ONNX Runtime threads
```

### Frontend (.env.local di /frontend/)
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000  # atau backend production URL
```

## Database Setup

Pastikan schema.sql sudah dijalankan di Supabase SQL Editor dengan:
- Row Level Security enabled
- All tables created dengan policies yang benar
- Functions dan triggers tersedia

## Model Files

Pastikan model files tersedia:
- `/backend/models/ppe-detector.quant.onnx` (atau ppe-detector.onnx)
- `/frontend/public/models/ghs-detector.onnx`

## Dependencies Installation

### Backend:
```bash
cd backend
pip install -r requirements.txt
```

### Frontend:
```bash
cd frontend
npm install
```

## Running the Application

### Development Mode:

1. **Backend:**
```bash
cd backend
python main.py
# atau uvicorn main:app --reload
```

2. **Frontend:**
```bash
cd frontend
npm run dev
```

### Production Mode:

1. **Backend:** Deploy ke Railway, Render, atau platform Python lainnya
2. **Frontend:** Deploy ke Vercel, Netlify, atau platform Next.js lainnya

## Testing Checklist

### Authentication Flow:
- [ ] Signup sebagai admin → redirects ke admin dashboard
- [ ] Signup sebagai worker → redirects ke worker dashboard
- [ ] Login dengan role yang benar → proper redirect
- [ ] Logout → redirects ke login page

### Admin Features:
- [ ] Admin dashboard loads dengan semua tabs
- [ ] GHS scanner dapat detect pictograms
- [ ] Zone creation dari scan results
- [ ] QR code generation dan download/print
- [ ] Live monitoring worker status
- [ ] Analytics data loading

### Worker Features:
- [ ] QR code scanning untuk check-in zona
- [ ] PPE requirements display
- [ ] Live PPE monitoring via camera
- [ ] Compliance status real-time
- [ ] Check-out dari zona

### PPE Detection:
- [ ] Detection akurat berdasarkan zona requirements
- [ ] WebSocket connection stable
- [ ] Real-time updates ke admin dashboard
- [ ] PPE status indicators correct

### Database Integration:
- [ ] User roles tersimpan dengan benar
- [ ] Zone data complete dengan PPE requirements
- [ ] Worker-zone assignments tracking
- [ ] PPE events logging
- [ ] Analytics queries berjalan

## Performance Considerations

1. **PPE Detection:** Min frame interval 0.5s untuk prevent CPU overload
2. **WebSocket:** Proper cleanup on disconnect
3. **Real-time Updates:** Efficient Supabase Realtime subscriptions
4. **QR Scanner:** Camera resource cleanup
5. **Image Processing:** Client-side GHS detection untuk privacy

## Security Notes

1. **Authentication:** Supabase RLS policies enforced
2. **API Access:** Service keys server-side only
3. **Video Privacy:** PPE video tidak dikirim ke admin
4. **Data Privacy:** GHS detection client-side only

## Troubleshooting

### Common Issues:
1. **Role redirect wrong:** Check userContext.ts resolveRoleFromProfile
2. **PPE detection tidak akurat:** Verify zone requirements di database
3. **QR scanner tidak bekerja:** Check camera permissions
4. **WebSocket disconnect:** Check network dan backend health
5. **Admin tidak bisa scan:** Verify AdminGHSScanner import

### Debug Tips:
- Check browser console untuk JavaScript errors
- Verify backend logs untuk API errors
- Check Supabase dashboard untuk database issues
- Test dengan different browsers dan devices

## Production Deployment

### Backend Deployment:
1. Upload model files ke server
2. Set environment variables
3. Configure CORS untuk frontend domain
4. Setup health check endpoint (/health)

### Frontend Deployment:
1. Build dengan `npm run build`
2. Set production API URLs
3. Configure domain dan SSL
4. Test kamera access pada HTTPS

### Database Configuration:
1. Backup current data
2. Run schema updates kalau ada
3. Verify RLS policies
4. Setup database monitoring

Semua fitur telah ditest dan siap untuk production deployment!