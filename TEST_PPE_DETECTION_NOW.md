# 🧪 Test PPE Detection - Step by Step

## 🎯 What You'll See

After setup, camera will show:
- ✅ **Green badge**: "PPE Compliant" when all equipment detected
- ❌ **Red badge**: "PPE Violation" when missing equipment  
- 📊 **Object detection list**: "Helmet (92%)", "no_gloves", etc.
- 👤 **Person count**: How many people in frame
- ⚠️ **Violation details**: Specific missing PPE items

---

## 📋 Prerequisites (5 minutes)

### 1. Install OpenCV
```bash
cd backend
source venv/bin/activate  # or .venv
pip install opencv-python==4.10.0.84
```

### 2. Update Database
```sql
-- Run in Supabase SQL Editor
ALTER TABLE ppe_events ADD COLUMN IF NOT EXISTS camera_station_id uuid REFERENCES monitoring_stations(id);
```

### 3. Restart Backend
```bash
cd backend
python main.py

# Look for:
# INFO: Application startup complete.
# INFO: Uvicorn running on http://127.0.0.1:8000
```

---

## 🚀 Test Workflow (10 minutes)

### Step 1: Setup Camera Station (2 min)

**Admin Dashboard → Camera Setup tab**:

1. Click "Add Station"
2. Fill in:
   - **Station Name**: "Test PPE Camera"
   - **Zone**: Select zone with required PPE
   - **Camera URL**: `http://[phone-ip]:8080/video`
3. Click "Add Station"
4. Verify live feed shows in camera card

✅ **Checkpoint**: Live video visible in camera preview

---

### Step 2: Check Zone Requirements (1 min)

**Admin Dashboard → Assess Hazards tab**:

1. Find your zone in list
2. Click to view details
3. Check **Required PPE** section
4. Should have items like: helmet, gloves, safety_goggles

**If empty**:
- Edit zone
- Add required PPE: helmet, gloves, vest
- Save

✅ **Checkpoint**: Zone has required_ppe set

---

### Step 3: Worker Check-in (1 min)

**Worker Dashboard** (open in incognito/different browser):

1. Login as worker
2. Scan zone QR code (or manually select zone)
3. Acknowledge safety requirements
4. Worker now "Ready to Work"

✅ **Checkpoint**: Admin Live Monitoring shows "1 worker" in stats

---

### Step 4: Start PPE Monitoring (1 min)

**Admin Dashboard → Live Monitoring tab**:

1. Find "PPE Detection Status" card at top
2. Should show:
   - Status: "⏸️ Monitoring paused"
   - Camera stations: 1
3. Click **"▶️ Start Monitoring"**
4. Wait for success message

**Backend console should show**:
```
[INFO] Starting camera monitor for station abc-123
[INFO] Connected to camera: http://192.168.1.100:8080/video
[INFO] Zone xyz requires PPE: ['helmet', 'gloves', 'vest']
[INFO] Station abc-123: PPE=❌ Violations - ['no_helmet', 'no_gloves']
```

✅ **Checkpoint**: Status changes to "✅ Cameras actively monitoring"

---

### Step 5: Test PPE Detection (5 min)

**Position yourself in front of camera**:

#### Test A: No PPE (Baseline)
1. Stand in camera view without any PPE
2. Wait 5-10 seconds
3. Look at camera card in admin dashboard

**Expected Display**:
```
[Camera Preview with LIVE badge]

Top-right overlay:
❌ PPE Violation
👤 1 Person(s) Detected

Below camera:
📊 Detected Objects:
  • Person (95%)
  • no_helmet (87%)
  • no_gloves (82%)

⚠️ Safety Violations:
  • ⚠️ Helmet Missing
  • ⚠️ Gloves Missing
```

✅ **Checkpoint**: Red "PPE Violation" badge visible, violations listed

#### Test B: Put on Helmet
1. Wear a helmet (or hat for testing)
2. Wait 5-10 seconds
3. Check display update

**Expected Display**:
```
Top-right overlay:
❌ PPE Violation  (still red because missing gloves)
👤 1 Person(s) Detected

📊 Detected Objects:
  • Person (95%)
  • Helmet (88%)
  • no_gloves (82%)

PPE Equipment:
  ✓ Helmet

⚠️ Safety Violations:
  • ⚠️ Gloves Missing
```

✅ **Checkpoint**: Helmet detected, but still showing violation for gloves

#### Test C: Full PPE
1. Wear helmet + gloves + vest (if available)
2. Wait 5-10 seconds
3. Check display

**Expected Display**:
```
Top-right overlay:
✅ PPE Compliant  (green badge!)
👤 1 Person(s) Detected

📊 Detected Objects:
  • Person (95%)
  • Helmet (88%)
  • Gloves (85%)
  • Vest (83%)

PPE Equipment:
  ✓ Helmet
  ✓ Gloves
  ✓ Vest

Required PPE:
  helmet  gloves  vest
```

✅ **Checkpoint**: Green "PPE Compliant" badge, no violations listed

---

## 📊 What to Look For

### Admin Dashboard Display

**Camera Card Shows**:
1. **Live video feed** from IP camera
2. **LIVE badge** (red, top-left)
3. **Compliance badge** (top-right):
   - Green "✅ PPE Compliant" or
   - Red "❌ PPE Violation"
4. **Person count**: "👤 1 Person(s) Detected"

**Detection Panel Shows**:
1. **Detected Objects**: All objects with confidence %
2. **PPE Equipment**: List of detected PPE (Helmet, Gloves, etc.)
3. **Safety Violations**: Specific missing items
4. **Required PPE**: What's needed for this zone
5. **Metadata**: Timestamp + inference time

### Backend Console Logs

```
[INFO] Starting camera monitor for station abc-123
[INFO] Connected to camera: http://192.168.1.100:8080/video
[INFO] Zone xyz requires PPE: ['helmet', 'gloves', 'vest']
[INFO] Station abc-123: PPE=❌ Violations - ['no_helmet', 'no_gloves']
[INFO] Logged PPE event for worker 12345678: violation
[INFO] Station abc-123: PPE=✅ Compliant - []
[INFO] Logged PPE event for worker 12345678: compliant
```

### Database Records

```sql
-- Check PPE events
SELECT 
  e.*,
  p.name as worker_name,
  z.name as zone_name,
  m.station_name
FROM ppe_events e
JOIN profiles p ON p.id = e.worker_id
JOIN zones z ON z.id = e.zone_id
LEFT JOIN monitoring_stations m ON m.id = e.camera_station_id
ORDER BY e.detected_at DESC
LIMIT 10;
```

Should show entries with:
- `compliance_status`: "violation" or "compliant"
- `detected_ppe`: JSON array of detected objects
- `camera_station_id`: UUID of monitoring station
- `detected_at`: Timestamp

---

## 🐛 Troubleshooting

### Issue: "Waiting for detection data..."

**Cause**: Backend monitoring not started or camera not accessible

**Fix**:
1. Check "Start Monitoring" was clicked
2. Verify backend shows "Connected to camera" in logs
3. Test camera URL in browser: `http://[ip]:8080/video`
4. Check backend is running (no crash)

---

### Issue: No objects detected

**Cause**: Camera quality too low or person too far

**Fix**:
1. Move closer to camera
2. Ensure good lighting
3. Camera should have clear view of upper body
4. Check camera resolution (480p minimum)

---

### Issue: Backend shows "Failed to open camera"

**Cause**: Camera URL incorrect or not accessible

**Fix**:
```bash
# Test camera URL
curl -I http://[camera-ip]:8080/video

# Should return: HTTP/1.1 200 OK
# If fails: Check camera app running, same WiFi network
```

---

### Issue: Detection too slow

**Cause**: CPU overloaded

**Fix**:
Add to `backend/.env`:
```bash
CAMERA_FRAME_INTERVAL_S=5.0  # Check every 5 seconds instead of 2
ORT_INTRA_OP_THREADS=1       # Use 1 CPU thread
```

---

### Issue: Wrong violations detected

**Cause**: Zone required_ppe not matching detection classes

**Fix**:
Zone `required_ppe` should use these exact values:
- `helmet` → Detects "Helmet"
- `gloves` → Detects "Gloves"
- `safety_goggles` or `goggles` → Detects "Goggles"
- `safety_boots` or `boots` → Detects "Boots"
- `high_vis_vest` or `vest` → Detects "Vest"

---

## ✅ Success Criteria

After testing, you should have:

- [x] Camera monitoring started successfully
- [x] Live video feed visible in admin dashboard
- [x] Real-time PPE detection overlay working
- [x] Red "Violation" badge when PPE missing
- [x] Green "Compliant" badge when all PPE present
- [x] Detected objects list shows correctly
- [x] Violations list shows specific missing items
- [x] Backend logs show detection results
- [x] Database has ppe_events entries
- [x] Worker compliance badge updates in worker list

---

## 📸 Expected Screenshots

### Before (No PPE):
```
┌─────────────────────────────────────┐
│ [Live Camera Feed]                  │
│ 🔴 LIVE         ❌ PPE Violation   │
│                 👤 1 Person(s)      │
│                                     │
└─────────────────────────────────────┘
📊 Detected: Person (95%), no_helmet, no_gloves
⚠️ Violations: Helmet Missing, Gloves Missing
```

### After (With PPE):
```
┌─────────────────────────────────────┐
│ [Live Camera Feed]                  │
│ 🔴 LIVE         ✅ PPE Compliant   │
│                 👤 1 Person(s)      │
│                                     │
└─────────────────────────────────────┘
📊 Detected: Person (95%), Helmet (88%), Gloves (85%)
✓ PPE: Helmet, Gloves
```

---

## 🎯 Next Steps

After successful test:

1. **Add more cameras** for different zones
2. **Configure alerts** for violations
3. **Test with multiple workers** in same zone
4. **Review PPE event history** in database
5. **Adjust detection intervals** for performance

---

## 📞 If Still Not Working

**Check these files**:
- Backend logs: Look for errors
- Browser console (F12): Check for JavaScript errors
- Supabase dashboard: Verify ppe_events table exists

**Provide this info**:
1. Backend console output
2. Browser console errors
3. `monitoring-status` endpoint response:
   ```bash
   curl http://localhost:8000/camera/monitoring-status
   ```
4. Database query result:
   ```sql
   SELECT COUNT(*) FROM ppe_events;
   ```

---

**Ready to test!** Follow each step and verify checkpoints. 🚀
