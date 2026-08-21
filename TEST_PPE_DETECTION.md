# Test PPE Detection System

## Quick Backend Test

### 1. Check Backend is Running
```bash
curl http://localhost:8000/
```

Expected: `{"service":"ChemSafe API"...}`

### 2. Check PPE Model Exists
```bash
ls -lh backend/models/ppe-detector*.onnx
```

Expected: Shows `ppe-detector.quant.onnx` (~10MB)

### 3. Test Detection Endpoint with Sample Image

```bash
# Create a test image (or use your webcam screenshot)
# Replace 'test.jpg' with actual image file

curl -X POST http://localhost:8000/camera/detect-frame \
  -F "image=@test.jpg" \
  -F "station_id=test-station" \
  -F "required_ppe=[\"helmet\",\"gloves\"]"
```

Expected Response:
```json
{
  "timestamp": "2026-08-20T...",
  "compliant": false,
  "violations": ["no_helmet"],
  "detections": [
    {
      "class": "Person",
      "confidence": 0.95,
      "box": [100, 50, 300, 400]
    }
  ],
  "inference_ms": 150
}
```

## Frontend Console Debug

When device camera is streaming, check browser console for:

### Expected Logs:

```
📹 Canvas sized to 1280x720
📤 Sending frame to backend (245KB)
📥 Backend response status: 200
✅ Detection result: {timestamp: "...", compliant: false, ...}
   - Compliant: ❌ NO
   - Detections: 2 objects
   - Violations: no_helmet
   - Inference: 156ms
🎨 Drawing 2 detections on 1280x720 canvas
   1. Person @ [120, 80, 450, 680]
   2. no_helmet @ [180, 90, 350, 280]
```

### Common Issues:

**No logs at all:**
- Camera not streaming - check "LIVE" badge appears
- Check browser console for errors
- Verify `NEXT_PUBLIC_API_URL` is set (should be `http://localhost:8000`)

**`📤 Sending frame` but no `📥 Backend response`:**
- Backend not running or crashed
- CORS issue (check backend allows localhost:3000)
- Network error - check `http://localhost:8000/docs`

**`📥 Backend response status: 500`:**
- PPE model file missing
- ONNX Runtime not installed: `pip install onnxruntime`
- Check backend logs for Python errors

**`📥 Backend response status: 422`:**
- Invalid form data
- Check `station_id` and `required_ppe` format

**`✅ Detection result` but no bounding boxes:**
- Check `detections` array has items
- If empty, model didn't detect anything (try with person in frame)
- Check canvas size matches video

## Manual Testing Steps

### Setup:
1. **Start backend:**
   ```bash
   cd backend
   python -m uvicorn main:app --reload
   ```

2. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open browser console** (F12 or Cmd+Option+I)

### Test Flow:

1. **Login as Admin**
2. **Go to Camera Monitoring section**
3. **Add New Station:**
   - Name: "Test PPE Device Camera"
   - Select any zone
   - Click "Device Camera"
   - Allow camera permission
   - Select camera
   - Click "Use This Camera Source"
   - Save

4. **Start Monitoring** - Click button

5. **Check for:**
   - ✅ Video feed shows
   - ✅ "LIVE" badge appears
   - ✅ Console shows `📤 Sending frame` every 2 seconds
   - ✅ Console shows `✅ Detection result`
   - ✅ Bounding boxes appear on video
   - ✅ Detection panel shows below video

### Test with PPE:

1. **Wear helmet** → Should detect "Helmet" class, green box
2. **Remove helmet** → Should detect "no_helmet" violation, red box
3. **Stand in frame** → Should detect "Person", blue box
4. **Wear gloves** → Should detect "Gloves", green box

### Expected Behavior:

- **Person detected:** Blue box around person
- **PPE detected:** Green boxes (Helmet, Gloves, Vest, etc.)
- **Missing PPE:** Red boxes (no_helmet, no_gloves, etc.)
- **Compliance status:**
  - Green "PPE Compliant" if all required PPE present
  - Red "PPE Violation" if any missing

## Performance Benchmarks

### Good Performance:
- Inference: 100-200ms
- Frame rate: Every 2 seconds
- No lag in video playback
- Bounding boxes update smoothly

### Poor Performance (Needs Investigation):
- Inference: >500ms
- Frames delayed or not sending
- Video stuttering
- Backend CPU 100%

## Troubleshooting Commands

### Check Backend Logs:
```bash
# Watch backend terminal for errors
# Look for "ERROR" or "Exception" lines
```

### Check Frontend Network Tab:
```
Browser DevTools → Network tab → Filter: "detect-frame"
- Should show POST requests every 2 seconds
- Status should be 200
- Response preview shows detection JSON
```

### Check Backend Endpoint Directly:
```bash
# List all endpoints
curl http://localhost:8000/docs

# Should show POST /camera/detect-frame
```

### Restart Everything:
```bash
# Kill all processes
pkill -f "uvicorn"
pkill -f "next dev"

# Start fresh
cd backend && python -m uvicorn main:app --reload &
cd frontend && npm run dev
```

## Success Indicators

✅ Backend responds to `/camera/detect-frame`
✅ Frontend console shows detection logs
✅ Bounding boxes visible on video
✅ Detection panel updates with results
✅ Compliance status changes based on PPE
✅ No errors in console
✅ Inference time < 300ms
✅ Video plays smoothly

If ALL indicators pass → **System working perfectly!** 🎉

If ANY fail → Check specific section above for debugging.
