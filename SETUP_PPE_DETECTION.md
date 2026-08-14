# 🚀 Quick Setup - IP Camera PPE Detection

## Step-by-Step Setup (10 minutes)

### 1️⃣ Install Backend Dependencies (2 minutes)

```bash
cd backend

# Activate your virtual environment
source venv/bin/activate
# OR if using .venv:
# source .venv/bin/activate

# Install opencv-python
pip install opencv-python==4.10.0.84

# Verify installation
python -c "import cv2; print('OpenCV version:', cv2.__version__)"
# Should output: OpenCV version: 4.10.0.84
```

---

### 2️⃣ Update Database (1 minute)

Run in **Supabase SQL Editor**:

```sql
-- Add camera_station_id to ppe_events table
ALTER TABLE ppe_events ADD COLUMN IF NOT EXISTS camera_station_id uuid REFERENCES monitoring_stations(id);

-- Verify column added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ppe_events' AND column_name = 'camera_station_id';
```

✅ Expected: Returns 1 row showing `camera_station_id | uuid`

---

### 3️⃣ Restart Backend (1 minute)

```bash
cd backend

# Stop if running (Ctrl+C)

# Start backend
python main.py

# Should see in output:
# INFO: Application startup complete.
# INFO: Uvicorn running on http://127.0.0.1:8000
```

✅ Backend now has camera monitoring endpoints!

---

### 4️⃣ Test Backend Endpoints (1 minute)

Open browser and test:

```
http://localhost:8000/camera/monitoring-status
```

✅ Expected response:
```json
{
  "active_monitors": 0,
  "monitors": {}
}
```

---

### 5️⃣ Setup Camera Station (2 minutes)

**In Admin Dashboard → Camera Setup tab**:

1. Click "Add Station"
2. Fill in:
   - **Station Name**: "Main Lab Camera"
   - **Zone**: Select zone (must have workers to monitor)
   - **Camera URL**: `http://[your-phone-ip]:8080/video`
3. Click "Add Station"

✅ Camera card appears with live video feed

---

### 6️⃣ Start PPE Monitoring (1 minute)

**In Admin Dashboard → Live Monitoring tab**:

1. Look for "PPE Detection Status" card at top
2. Click **"▶️ Start Monitoring"**
3. Wait for success message

✅ Status changes to: "✅ Cameras actively monitoring for PPE compliance"

---

### 7️⃣ Test Detection (2 minutes)

**Setup**:
- Zone has required PPE set (e.g., helmet, gloves)
- Worker checked into that zone
- Camera pointed at worker

**Test**:
1. Worker wears all PPE → Wait 10 seconds
2. Check worker card: Should show ✅ "Compliant"
3. Worker removes helmet → Wait 10 seconds
4. Check worker card: Should show ❌ "Violation"

✅ PPE detection working!

---

## 🎯 Quick Test Checklist

- [ ] OpenCV installed (`pip install opencv-python`)
- [ ] Database column added (`camera_station_id`)
- [ ] Backend restarted
- [ ] `/camera/monitoring-status` returns JSON
- [ ] Camera station added with live feed
- [ ] Start Monitoring button works
- [ ] Status shows "actively monitoring"
- [ ] Worker compliance status updates
- [ ] Backend logs show detection results

---

## 🐛 Quick Fixes

### Backend won't start
```bash
# Check for errors
python main.py

# Common fix: Reinstall dependencies
pip install -r requirements.txt
```

### Camera URL not working
```bash
# Test URL in browser first
open http://[camera-ip]:8080/video

# Should show video feed
# If not: Check camera app is running
```

### No PPE events logged
```sql
-- Check if monitoring is active
-- Run query in Supabase:
SELECT * FROM monitoring_stations WHERE status = 'active';

-- Check if zone has required_ppe
SELECT id, name, required_ppe FROM zones;

-- Check if worker is in zone
SELECT * FROM worker_zone_map;
```

### Backend logs show errors
```bash
# Check backend console for:
[ERROR] Failed to open camera: http://...
# Fix: Camera URL wrong or camera not accessible

[ERROR] Failed to fetch zone requirements
# Fix: Check Supabase connection (SUPABASE_URL, SUPABASE_SERVICE_KEY in .env)
```

---

## 📝 Environment Variables (Optional)

Add to `backend/.env` to customize:

```bash
# How often to pull frames from camera (seconds)
CAMERA_FRAME_INTERVAL_S=2.0

# How often to log compliance events (seconds)  
COMPLIANCE_CHECK_INTERVAL_S=5.0

# CPU threads for inference (lower = less CPU)
ORT_INTRA_OP_THREADS=2
```

---

## ✅ Verification Commands

### Check OpenCV installed:
```bash
python -c "import cv2; print('OK')"
```

### Check backend running:
```bash
curl http://localhost:8000/health
# Should return: {"status":"ok","service":"chemsafe-backend"}
```

### Check camera accessible:
```bash
curl -I http://[camera-ip]:8080/video
# Should return: HTTP/1.1 200 OK
```

### Check monitoring status:
```bash
curl http://localhost:8000/camera/monitoring-status
# Should return JSON with active_monitors count
```

---

## 🚀 You're Done!

Everything is set up. Now:

1. **Start monitoring** from admin dashboard
2. **Workers check into zones** 
3. **PPE detection runs automatically**
4. **Violations logged in real-time**

Read `PPE_CAMERA_IMPLEMENTATION.md` for full details!
