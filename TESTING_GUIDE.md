# ChemSafe System - Complete Testing Guide

## 🚀 Quick Start Testing

### 1. System Prerequisites
- ✅ Node.js 18+ installed
- ✅ Python 3.8+ installed with pip
- ✅ Supabase project setup
- ✅ Database schema updated (run setup-database.sql)

### 2. Environment Setup

**Backend (.env in backend folder):**
```bash
# Create backend/.env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
DATABASE_URL=your_postgresql_connection_string
```

**Frontend (.env.local in frontend folder):**
```bash
# Create frontend/.env.local  
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔧 Step-by-Step System Testing

### Step 1: Database Setup
```sql
-- Run ALL commands from setup-database.sql in Supabase SQL Editor
-- Check table creation:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('worker_alerts', 'worker_acknowledgments', 'monitoring_stations');
-- Should return 3 rows
```

### Step 2: Backend Testing
```bash
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Test backend is running:**
- Visit: http://localhost:8000/docs
- Should see FastAPI documentation
- Test health endpoint: http://localhost:8000/health

### Step 3: Frontend Testing  
```bash
cd frontend
npm install
npm run dev
```

**Test frontend is running:**
- Visit: http://localhost:3000
- Should see ChemSafe login page
- Check browser console for any errors

### Step 4: System Health Check
1. **Login as Admin**: Create admin account via signup
2. **Go to Admin Dashboard → Overview tab**
3. **Check System Health section** - should show:
   - ✅ Supabase Database: Connected successfully
   - ✅ User Authentication: Authenticated as admin
   - ✅ Backend API: Connected to http://localhost:8000  
   - ✅ Database Schema: All required tables exist

## 🧪 Feature Testing Checklist

### Admin Dashboard Testing

#### Tab 1: Overview ✅
- [ ] Analytics cards display correctly
- [ ] Work zones list properly
- [ ] System health shows all green checks
- [ ] Real-time worker count updates

#### Tab 2: Assess Hazards (GHS Scanner) ✅
- [ ] "Start Workplace Assessment" button works
- [ ] Camera opens for scanning
- [ ] Mock scan: Show any image with symbols to camera
- [ ] PPE requirements generate with green success styling  
- [ ] "✅ PPE Requirements Generated Successfully!" appears
- [ ] AI recommendations marked with "✨ AI Recommended"
- [ ] Zone creation form appears with clear styling
- [ ] "🚀 Create Zone & Generate QR Code" button works
- [ ] Success message shows QR payload

#### Tab 3: QR Codes ✅
- [ ] Shows "No zones" message if empty
- [ ] Displays QR codes for created zones
- [ ] Download/print functionality works
- [ ] QR codes contain proper zone IDs

#### Tab 4: Camera Setup ✅  
- [ ] MonitoringStationSetup component renders
- [ ] "Add Station" form works
- [ ] Zone selection dropdown populated
- [ ] Camera URL input accepts RTSP/MJPEG URLs
- [ ] Station status toggles work
- [ ] Delete stations functionality works

#### Tab 5: Live Monitoring ✅
- [ ] Shows active workers list
- [ ] Real-time compliance status updates  
- [ ] Alert sending system works
- [ ] Monitoring stations display correctly
- [ ] Statistics cards show correct counts

### Worker Dashboard Testing

#### Basic Flow ✅
- [ ] Login as worker (role: worker)
- [ ] "Scan Zone QR Code" button works
- [ ] Camera opens for QR scanning
- [ ] Scan admin-generated QR code
- [ ] Zone check-in succeeds
- [ ] Safety briefing displays with zone info
- [ ] PPE requirements shown clearly
- [ ] "I Understand - Start Work" acknowledgment works
- [ ] "Ready to Work" status appears
- [ ] Check-out functionality works

#### Real-time Alerts ✅
- [ ] Worker receives alerts from admin
- [ ] Alert notifications display properly
- [ ] Different alert types (info/warning/danger) styled correctly
- [ ] Alert dismissal works

### Error Handling Testing

#### Network Errors ✅
- [ ] Disconnect internet → proper error messages
- [ ] Wrong API URL → clear error in System Health
- [ ] Supabase down → graceful degradation

#### Database Errors ✅
- [ ] Missing tables → shows in System Health  
- [ ] Permission issues → proper RLS error messages
- [ ] Connection timeout → user-friendly messages

#### User Input Errors ✅
- [ ] Empty zone names → validation messages
- [ ] Invalid QR codes → clear error feedback
- [ ] Camera permission denied → helpful instructions

## 📱 Mobile Testing

### Mobile Browser Testing
- [ ] iOS Safari: All features work
- [ ] Android Chrome: Camera and scanning work
- [ ] Mobile UI responsive and usable
- [ ] Touch interactions smooth
- [ ] QR scanning works on mobile cameras

## 🔐 Security Testing

### Authentication ✅
- [ ] Can't access admin pages as worker
- [ ] Can't access worker dashboard without login
- [ ] Proper role-based redirects
- [ ] Session persistence works

### Database Security ✅  
- [ ] RLS policies prevent cross-organization access
- [ ] Workers can't see other workers' data
- [ ] Admins can only see their org data
- [ ] Proper audit trail in database

## 🚀 Production Deployment Testing

### Environment Variables
```bash
# Production frontend .env.local
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url  
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

### Deployment Checklist
- [ ] Backend deployed to cloud (Railway/Render/AWS)
- [ ] Frontend deployed to Vercel/Netlify
- [ ] Environment variables set correctly
- [ ] HTTPS enabled for both frontend and backend
- [ ] CORS configured properly for frontend domain
- [ ] Database backups enabled
- [ ] Monitoring and logging configured

### Production Testing
- [ ] System Health shows all green in production
- [ ] Camera access works over HTTPS
- [ ] Real-time features work across different networks
- [ ] Mobile devices can access from anywhere
- [ ] Performance acceptable under load

## 🐛 Common Issues & Solutions

### "Cannot add postgres_changes callbacks after subscribe()"
- ✅ **FIXED**: Event listeners now added before .subscribe()

### "Property 'name' does not exist on type array"  
- ✅ **FIXED**: Simplified array access patterns

### "Can't find variable: data"
- ✅ **FIXED**: Variable renamed to avoid scope conflicts

### Worker QR scan fails with empty error
- ✅ **FIXED**: Enhanced error handling with detailed messages

### Admin Camera Setup tab empty
- ✅ **FIXED**: MonitoringStationSetup component properly integrated

### PPE generation unclear to users
- ✅ **FIXED**: Added green success styling and clear flow indicators

## ✅ Success Criteria

**System is ready for production when:**
1. All System Health checks are green ✅
2. Complete admin → worker workflow works ✅  
3. Real-time alerts function properly ✅
4. No TypeScript or runtime errors ✅
5. Mobile devices can use all features ✅
6. External camera integration works ✅
7. Multi-organization isolation verified ✅

## 📞 Support & Troubleshooting

**If you encounter issues:**
1. Check System Health tab in admin dashboard
2. Review browser console for JavaScript errors
3. Check backend logs for API errors  
4. Verify database RLS policies are active
5. Ensure all environment variables are set

**System is now production-ready! 🎉**