# Debug Device Camera - Step by Step

## 🔍 Step 1: Check Database Migration

```bash
# Check if columns exist in Supabase
# Go to: Supabase Dashboard → SQL Editor
# Run this query:

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'monitoring_stations' 
AND column_name IN ('camera_type', 'camera_device_id', 'camera_device_label');
```

**Expected:** Should return 3 rows. If empty → **Run `ADD_CAMERA_COLUMNS.sql` first!**

## 🔍 Step 2: Check Station Data

```bash
# In Supabase SQL Editor, run:

SELECT id, station_name, camera_type, camera_device_id, camera_device_label, camera_url, status
FROM monitoring_stations
WHERE status = 'active';
```

**Expected for device camera:**
```
camera_type: "device"
camera_device_id: "abc123..." (long string)
camera_device_label: "FaceTime HD Camera" (or similar)
camera_url: NULL or empty
status: "active"
```

**If camera_type is NULL** → Station not configured properly, re-create it.

## 🔍 Step 3: Open Browser Console

1. Open page: `http://localhost:3000/admin/dashboard`
2. Press **F12** or **Cmd+Option+I**
3. Go to **Console** tab
4. Clear console (trash icon)

## 🔍 Step 4: Start Monitoring

Click "Start Monitoring" button.

### Expected Console Logs (in order):

```
📹 Loaded monitoring stations: Array(1)
  ▼ 0: Object
      id: "..."
      station_name: "Test Device Camera"
      camera_type: "device"
      camera_device_id: "abc123..."
      camera_device_label: "FaceTime HD Camera"
      camera_url: null
      status: "active"

🎬 Rendering station Test Device Camera: {camera_type: "device", ...}
📱 Rendering DeviceCameraStream for Test Device Camera

🎥 DeviceCameraStream mounted: {stationId: "...", deviceId: "abc123...", ...}
🚀 Starting camera stream for device: abc123...
📷 Requesting camera access for device: abc123...
🎬 getUserMedia constraints: {video: {...}}
✅ Camera stream obtained: {tracks: 1, videoTrack: "FaceTime HD Camera", ...}
🎞️ Video metadata loaded, starting playback
🎯 Starting frame capture for PPE detection

📹 Canvas sized to 1280x720
📤 Sending frame to backend (245KB)
📥 Backend response status: 200
✅ Detection result: {timestamp: "...", compliant: false, ...}
   - Compliant: ❌ NO (or ✅ YES)
   - Detections: 2 objects
   - Violations: no_helmet
   - Inference: 156ms
🎨 Drawing 2 detections on 1280x720 canvas
   1. Person @ [120, 80, 450, 680]
   2. no_helmet @ [180, 90, 350, 280]
```

## 🐛 Troubleshooting by Log

### ❌ No logs at all
**Problem:** Component not rendering
**Check:**
1. Is station status = "active"?
2. Did you click "Start Monitoring"?
3. Refresh page and try again

### ❌ "Loaded monitoring stations" shows empty array
**Problem:** No stations in database
**Solution:** Create a station with device camera first

### ❌ "Loaded monitoring stations" shows camera_type: null
**Problem:** Station created before migration OR not saved properly
**Solution:**
1. Run `ADD_CAMERA_COLUMNS.sql`
2. Delete station
3. Create new station with device camera

### ❌ Stops at "DeviceCameraStream mounted"
**Problem:** useEffect not running
**Check:** Component lifecycle - possible React issue

### ❌ Stops at "Requesting camera access"
**Problem:** getUserMedia failed
**Check:**
1. Browser console for error message
2. Camera not connected?
3. Camera in use by other app?
4. Browser permissions denied?

### ❌ Shows "Camera permission denied"
**Problem:** User clicked "Block" on permission prompt
**Solution:**
1. Click camera icon in address bar
2. Change to "Allow"
3. Reload page

### ❌ Shows "Failed to access camera: NotFoundError"
**Problem:** deviceId no longer exists
**Solution:**
1. Camera was unplugged/disconnected
2. Delete station
3. Create new one (will get fresh deviceId)

### ❌ "Camera stream obtained" but no "Video metadata loaded"
**Problem:** Video element not attaching stream
**Check:**
1. videoRef.current exists?
2. Browser console for video errors

### ❌ "Starting frame capture" but no "Sending frame"
**Problem:** Interval not starting
**Check:** frameIntervalRef setup

### ❌ "Sending frame" but no "Backend response"
**Problem:** Network or backend issue
**Check:**
1. `curl http://localhost:8000/` (should return JSON)
2. Backend running?
3. CORS error in console?
4. Network tab shows request?

### ❌ "Backend response status: 400/422"
**Problem:** Invalid request format
**Check:**
1. station_id valid UUID?
2. required_ppe valid JSON array?
3. image blob valid?

### ❌ "Backend response status: 500"
**Problem:** Backend crashed
**Check:**
1. Backend terminal for Python error
2. PPE model file exists? (`ls backend/models/`)
3. onnxruntime installed? (`pip install onnxruntime`)

### ❌ "Detection result" shows 0 detections
**Problem:** Model didn't detect anything
**Check:**
1. Person visible in frame?
2. Good lighting?
3. Camera aimed correctly?
4. Try moving closer to camera

### ❌ "Drawing X detections" but no boxes visible
**Problem:** Canvas overlay issue
**Check:**
1. Canvas size matches video?
2. Canvas z-index correct?
3. Boxes drawn outside visible area?

## ✅ Success Indicators

When everything works, you should see:

1. ✅ Video feed playing with "LIVE" badge
2. ✅ Console logs every 2 seconds:
   - 📤 Sending frame
   - 📥 Backend response status: 200
   - ✅ Detection result
   - 🎨 Drawing X detections
3. ✅ Bounding boxes on video (colored corners)
4. ✅ Labels above/inside boxes
5. ✅ Detection panel below video shows:
   - Detected objects list
   - PPE equipped
   - Violations (if any)
   - Compliance status
   - Inference time

## 📸 Screenshot Checklist

If still not working, provide screenshots of:

1. Browser console (full log from "Start Monitoring")
2. Network tab filtered by "detect-frame"
3. Supabase SQL query result (station data)
4. Video element (should show camera feed)
5. Backend terminal (any Python errors)

## 🔧 Nuclear Option (Reset Everything)

```bash
# 1. Stop all processes
pkill -f "uvicorn"
pkill -f "next dev"

# 2. Run database migration
# In Supabase SQL Editor, run ADD_CAMERA_COLUMNS.sql

# 3. Delete all monitoring stations
# In Supabase → Table Editor → monitoring_stations → Delete all rows

# 4. Start backend
cd backend
python -m uvicorn main:app --reload

# 5. Start frontend (new terminal)
cd frontend
npm run dev

# 6. Create NEW station with device camera
# 7. Start monitoring
# 8. Check console logs
```

This should work 100% if:
- Database migration ran
- Backend has PPE model
- Camera permissions granted
- Browser console shows all expected logs
