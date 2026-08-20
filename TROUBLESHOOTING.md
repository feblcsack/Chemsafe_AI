# Troubleshooting Guide

## Quick Diagnosis

### Is the backend running?
```bash
curl http://localhost:8000/docs
```
Expected: Swagger UI loads ✅

### Is monitoring active?
```bash
curl http://localhost:8000/camera/monitoring-status
```
Expected: JSON with active monitors ✅

### Can you access MJPEG stream?
```
Open in browser: http://localhost:8000/camera/station/{station_id}/mjpeg
```
Expected: Live video feed ✅

---

## Common Issues & Solutions

### ❌ Issue 1: "Camera stream unavailable"

**Symptoms:**
- Blank screen on Admin Live Monitoring
- Error message: "Camera stream unavailable"
- MJPEG endpoint returns 404

**Diagnosis:**
```bash
# Check if monitoring is started
curl http://localhost:8000/camera/monitoring-status

# Response shows empty monitors?
# → Monitoring not started
```

**Solution:**
```bash
# Start monitoring
curl -X POST http://localhost:8000/camera/start-monitoring

# Verify it worked
curl http://localhost:8000/camera/monitoring-status
```

**Expected Response:**
```json
{
  "active_monitors": 1,
  "monitors": {
    "station-id-here": {
      "station_name": "Entrance Station",
      "started_at": "2024-01-15T10:30:00",
      "is_running": true
    }
  }
}
```

---

### ❌ Issue 2: Boxes still not showing

**Symptoms:**
- Camera feed visible
- No boxes drawn on detected objects
- Console shows naturalWidth = 0 or undefined

**Diagnosis:**
```javascript
// Open browser DevTools console on Admin Live Monitoring page
const img = document.querySelector('img[alt*="live feed"]');
console.log('Image src:', img?.src);
console.log('Natural width:', img?.naturalWidth);
console.log('Natural height:', img?.naturalHeight);
```

**Possible Causes & Solutions:**

#### Cause A: Image not loaded yet
```javascript
// If naturalWidth = 0 but src is correct
// → Wait for image to load
img.onload = () => console.log('Loaded!', img.naturalWidth);
```

#### Cause B: Wrong proxy URL
```javascript
// Image src should be:
// http://localhost:8000/camera/station/{station_id}/mjpeg

// NOT:
// rtsp://192.168.1.100:554/stream
```

**Fix in code:**
```typescript
// CameraPPEOverlay.tsx should have:
const proxyUrl = `${process.env.NEXT_PUBLIC_API_URL}/camera/station/${stationId}/mjpeg`;
<img src={proxyUrl} />  // ✅ Correct
```

#### Cause C: CORS issues
Check browser console for CORS errors

**Fix:** Ensure backend has CORS enabled (should be by default in main.py)

---

### ❌ Issue 3: Detection still slow

**Symptoms:**
- Detection updates taking >3 seconds
- Slow response to workers entering frame

**Diagnosis:**
```bash
# Check backend logs
tail -f backend.log | grep "PPE="

# Look for timing:
# Should see: "Station abc: PPE=✅ Compliant" every ~1.2s
# If seeing every 5s+ → Issue not fixed
```

**Solutions:**

#### Solution A: Check interval env var
```bash
# In backend/.env
COMPLIANCE_CHECK_INTERVAL_S=1.2  # Should be 1.2, not 5.0
```

#### Solution B: Restart backend
```bash
# Stop backend (Ctrl+C)
# Start again
cd backend
python main.py
```

#### Solution C: Verify code changes applied
```python
# In camera_monitor.py, check line ~38:
COMPLIANCE_CHECK_INTERVAL_S = float(os.getenv("COMPLIANCE_CHECK_INTERVAL_S", "1.2"))
# Should default to "1.2", not "5.0"
```

---

### ❌ Issue 4: GHS boxes still jittery

**Symptoms:**
- GHS scanner boxes "jump" between positions
- Not smooth/fluid animation

**Diagnosis:**
```typescript
// In browser console on GHS scanner page
// Check React DevTools state
displayDetections  // Should exist (new state for smoothing)
liveDetections     // Should also exist (raw detections)
```

**Solution A: Clear build cache**
```bash
cd frontend
rm -rf .next
npm run dev
```

**Solution B: Verify code changes**
Check `GHSScanner.tsx` has:
- `animationFrameRef` ref
- `displayDetections` state
- `requestAnimationFrame` loop in useEffect
- Render using `displayDetections` not `liveDetections`

---

### ❌ Issue 5: Backend crashes or high CPU

**Symptoms:**
- Backend process crashes
- CPU usage 100%
- Out of memory errors

**Diagnosis:**
```bash
# Check CPU/memory
top -pid $(pgrep -f "python main.py")

# Check how many monitors active
curl http://localhost:8000/camera/monitoring-status | jq '.active_monitors'
```

**Solutions:**

#### Solution A: Limit threads
```bash
# In backend/.env
ORT_INTRA_OP_THREADS=2  # Don't oversubscribe
```

#### Solution B: Reduce concurrent cameras
If monitoring >10 cameras simultaneously, consider:
```python
# Add to camera_monitor.py
MAX_CONCURRENT_CAMERAS = 10

# In start_monitoring():
if len(_active_monitors) >= MAX_CONCURRENT_CAMERAS:
    raise HTTPException(429, "Maximum concurrent cameras reached")
```

#### Solution C: Increase detection interval
```bash
# If still struggling:
COMPLIANCE_CHECK_INTERVAL_S=2.0  # Slower but more stable
```

---

### ❌ Issue 6: RTSP camera not connecting

**Symptoms:**
- Monitoring starts but no frames captured
- Logs show: "Failed to read frame"
- MJPEG stream shows nothing

**Diagnosis:**
```bash
# Test RTSP URL directly with ffmpeg
ffmpeg -i rtsp://192.168.1.100:554/stream -frames:v 1 test.jpg

# If this fails → Camera URL wrong or unreachable
```

**Solutions:**

#### Solution A: Check camera URL format
```bash
# Common formats:
rtsp://username:password@192.168.1.100:554/stream
rtsp://192.168.1.100:554/h264_stream
rtsp://192.168.1.100/live/ch00_0

# Try with VLC player first to verify URL
```

#### Solution B: Check network connectivity
```bash
# Ping camera
ping 192.168.1.100

# Check port open
nc -zv 192.168.1.100 554
```

#### Solution C: Camera credentials
Some RTSP cameras need authentication:
```
rtsp://admin:password123@192.168.1.100:554/stream
```

---

### ❌ Issue 7: Frontend errors

**Symptoms:**
- TypeScript compilation errors
- React runtime errors
- Page won't load

**Diagnosis:**
```bash
# Check browser console for errors
# Check terminal running npm run dev for build errors
```

**Solutions:**

#### Solution A: Reinstall dependencies
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### Solution B: Clear Next.js cache
```bash
cd frontend
rm -rf .next
npm run dev
```

#### Solution C: Check environment variables
```bash
# In frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

---

### ❌ Issue 8: No detections appearing

**Symptoms:**
- Camera feed working
- Boxes not showing
- No detection data in latest endpoint

**Diagnosis:**
```bash
# Check if detection data exists
curl http://localhost:8000/camera/station/{station_id}/latest

# If 404 → No detections yet
# If 200 → Detection data exists but not rendering
```

**Solutions:**

#### Solution A: Wait for first detection
Detection takes ~1.2s to start. Wait a moment after starting monitoring.

#### Solution B: Check if person in frame
PPE detection needs a person in frame to detect violations.

**Test:**
- Stand in front of camera
- Wait 1-2 seconds
- Should see detection appear

#### Solution C: Lower confidence threshold
```python
# In camera_monitor.py, line where ppe_engine.detect is called:
result = await asyncio.to_thread(
    ppe_engine.detect, 
    frame_bytes, 
    0.3,  # Lower from 0.4 to 0.3 for more sensitivity
    zone_required_ppe
)
```

---

## Performance Debugging

### Slow inference?

```bash
# Check inference_ms values in responses
curl http://localhost:8000/camera/station/{station_id}/latest | jq '.inference_ms'

# If >200ms consistently:
# - Check CPU usage (top)
# - Verify vectorized code applied
# - Consider reducing camera resolution
```

### Memory growing?

```bash
# Monitor Python process memory
ps aux | grep "python main.py"

# If memory growing continuously:
# - Check for memory leaks
# - Verify old frames being released
# - Restart backend periodically if needed
```

---

## Testing Checklist

Run through this checklist before demo:

```bash
# 1. Backend health
curl http://localhost:8000/docs
# ✅ Should load Swagger UI

# 2. Start monitoring
curl -X POST http://localhost:8000/camera/start-monitoring
# ✅ Should return success with station list

# 3. Check monitoring status
curl http://localhost:8000/camera/monitoring-status
# ✅ Should show active monitors

# 4. Test MJPEG stream
open http://localhost:8000/camera/station/{station_id}/mjpeg
# ✅ Should show live video in browser

# 5. Check latest detection
curl http://localhost:8000/camera/station/{station_id}/latest
# ✅ Should return detection JSON

# 6. Frontend loads
open http://localhost:3000/admin/dashboard
# ✅ Should load without errors

# 7. Live monitoring works
# ✅ Camera feed visible
# ✅ Boxes appear on detected objects
# ✅ Status badges show correctly

# 8. GHS scanner smooth
open http://localhost:3000/admin/dashboard
# Click "Workplace Assessment Scanner"
# ✅ Boxes move smoothly (no jumping)
```

---

## Emergency Fixes

### If demo breaks during presentation:

#### Quick Fix 1: Restart everything
```bash
# Terminal 1: Stop & restart backend
cd backend
^C
python main.py

# Terminal 2: Stop & restart frontend
cd frontend
^C
npm run dev

# Wait 30 seconds, try again
```

#### Quick Fix 2: Use fallback getUserMedia
If camera monitoring fails, fall back to worker's own camera:
```
Go to: http://localhost:3000/worker/dashboard
Use QR code scan → Will use device camera (always works)
```

#### Quick Fix 3: Show recorded demo
If live system fails, have a pre-recorded video showing:
- System working correctly
- Real-time detection
- Performance metrics

---

## Contact Info

If completely stuck:

1. **Check all three docs:**
   - `PERFORMANCE_OPTIMIZATIONS.md` - Technical details
   - `QUICK_TEST_GUIDE.md` - Step-by-step testing
   - `FIXES_COMPLETE.md` - What was changed

2. **Review logs:**
   - Backend: Terminal output
   - Frontend: Browser DevTools console
   - System: `dmesg` for system-level issues

3. **Verify code changes applied:**
   - `git status` - Check if files modified
   - `git diff` - See what changed

---

## Known Working Configuration

For reference, this setup is tested and working:

```yaml
Environment:
  OS: macOS
  Python: 3.10+
  Node: 18+
  
Backend:
  COMPLIANCE_CHECK_INTERVAL_S: 1.2
  ORT_INTRA_OP_THREADS: 2
  
Frontend:
  NEXT_PUBLIC_API_URL: http://localhost:8000
  
Cameras:
  Test URL: rtsp://192.168.1.100:554/stream
  Format: RTSP/MJPEG/HTTP
  Resolution: 1920x1080 or lower
```

If your setup matches this, it should work ✅

---

**Last Resort:** Revert to working backup and try fixes one at a time to isolate the issue.
