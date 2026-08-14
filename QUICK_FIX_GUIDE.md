# 🚨 URGENT FIXES - Do These Now!

## 1. Fix Database Error (Worker Can't Check In)

**Go to Supabase SQL Editor and run:**
```sql
ALTER TABLE worker_zone_map ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;
```

## 2. Fix Admin GHS Scanner Stuck Issue

✅ **Already Fixed in Code!** 
- Added better error handling
- Added loading indicators  
- Added cancel button that works
- Added console logging for debugging

**To test:**
1. Go to Admin Dashboard → Assess Hazards
2. Click "Start Workplace Assessment"  
3. If it gets stuck, click "Cancel Scan"
4. Check browser console (F12) for error messages

## 3. Camera Station Access

### Option A: Use Phone as IP Camera (Easiest)
1. **Android**: Install "IP Webcam" app
2. Start server in app
3. Note the IP address (e.g., 192.168.1.100:8080)
4. In Camera Setup, use: `http://192.168.1.100:8080/video`

### Option B: Use Laptop Camera
1. Install OBS Studio on laptop
2. Start streaming to local RTMP server
3. Use URL: `http://localhost:8080/stream`

### Option C: Use Real IP Camera
1. Connect IP camera to same WiFi network
2. Find camera IP address
3. Use RTSP URL: `rtsp://camera-ip:554/stream`

## 4. Test Complete System

### After Database Fix:
1. **Worker Test:**
   - Login as worker
   - Scan QR code → Should work now!
   - Check into zone successfully

2. **Admin GHS Scanner Test:**
   - Go to Assess Hazards tab
   - Start scanning
   - Point camera at any image with symbols
   - Should see results or clear error messages

3. **Camera Setup Test:**
   - Go to Camera Setup tab
   - Add a monitoring station
   - Use phone IP camera URL
   - Verify status shows "active"

## 5. If Still Having Issues

**Check these:**
1. **Browser Console (F12)** - Look for error messages
2. **Network Tab** - Check if API calls are failing
3. **Supabase Logs** - Check database connection
4. **Backend Health** - Visit `http://localhost:8000/health`

## 6. Emergency Reset Commands

**If system is completely stuck:**
```sql
-- Reset all worker assignments
DELETE FROM worker_zone_map;

-- Reset all zones (careful!)
-- DELETE FROM zones WHERE org_id = 'your-org-id';
```

**If frontend is stuck:**
- Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache
- Try incognito/private window

## 7. Quick Database Schema Check

**Run this to verify all tables exist:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'zones', 'worker_zone_map', 'ppe_events', 
  'worker_alerts', 'worker_acknowledgments', 'monitoring_stations'
);
```
Should return 6 rows.

**Check if checked_in_at column exists:**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'worker_zone_map' AND column_name = 'checked_in_at';
```
Should return 1 row.

---

## ✅ Priority Order:
1. **Fix database** (run the ALTER TABLE command)
2. **Test worker check-in** (should work immediately)  
3. **Test admin scanner** (use cancel button if stuck)
4. **Set up phone as camera** (easiest option)
5. **Test complete workflow**

**After these fixes, everything should work perfectly! 🚀**