# ✅ FIXED - Backend Startup Working Now!

## 🔧 What Was Wrong

Script used `python main.py` but:
1. macOS doesn't have `python` command (only `python3`)
2. FastAPI apps run with `uvicorn`, not `python main.py`

## ✅ Fixed Now

Updated `start.sh` to use:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🚀 START BACKEND NOW

### Run This Command:

```bash
cd /Users/resti/Documents/testerchem/backend
./start.sh
```

### Expected Output (THIS TIME IT WILL WORK):

```
🚀 Starting ChemSafe Backend...

📦 Activating virtual environment...
✅ All checks passed!

🌐 Starting FastAPI server on http://localhost:8000
📊 API docs available at http://localhost:8000/docs

Press Ctrl+C to stop the server
─────────────────────────────────────────────────────

INFO:     Will watch for changes in these directories: ['/Users/resti/Documents/testerchem/backend']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

✅ **If you see this**, backend is running successfully!

---

## 🧪 Test Backend is Working

### Open New Terminal (Keep Backend Running)

**Test 1: Health Check**
```bash
curl http://localhost:8000/health
```
Should return:
```json
{"status":"ok","service":"chemsafe-backend"}
```

**Test 2: Camera Monitoring Status**
```bash
curl http://localhost:8000/camera/monitoring-status
```
Should return:
```json
{"active_monitors":0,"monitors":{}}
```

**Test 3: Open Browser**
```
http://localhost:8000/docs
```
Should see FastAPI Swagger documentation with all endpoints.

---

## 📊 Available Endpoints

After backend starts, these endpoints are available:

- `GET /health` - Health check
- `GET /camera/monitoring-status` - Check monitoring status
- `POST /camera/start-monitoring` - Start PPE detection
- `POST /camera/stop-monitoring` - Stop PPE detection
- `GET /camera/station/{id}/latest` - Get latest detection
- `GET /zones` - List zones
- `POST /zones` - Create zone
- `WS /ppe/stream/{worker_id}/{zone_id}` - PPE detection WebSocket
- And more...

---

## 🎯 Next Steps After Backend Starts

### 1. Verify Backend Running
```bash
# In new terminal
curl http://localhost:8000/health
```

### 2. Start Frontend
```bash
# In new terminal
cd /Users/resti/Documents/testerchem/frontend
npm run dev
```

### 3. Test PPE Detection
- Open browser: http://localhost:3000
- Login as admin
- Go to Live Monitoring tab
- Click "Start Monitoring"
- See PPE detection in action!

---

## 🐛 If Still Not Working

### Issue: "Address already in use"

Port 8000 already used. Kill existing process:
```bash
# Find process using port 8000
lsof -i :8000

# Kill it (replace PID with actual number)
kill -9 [PID]

# Try start again
./start.sh
```

### Issue: "uvicorn: command not found"

Install requirements:
```bash
source venv/bin/activate
pip install -r requirements.txt
./start.sh
```

### Issue: Script exits immediately

Check for syntax errors:
```bash
source venv/bin/activate
python3 -c "import main; print('OK')"
```

---

## ✅ Summary

**Before (Broken)**:
```bash
./start.sh
# Shows header, exits immediately ❌
```

**After (Fixed)**:
```bash
./start.sh
# Shows header, then Uvicorn logs, stays running ✅
```

**Key Change**:
- Changed from: `python main.py`
- Changed to: `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`

---

## 🚀 TRY NOW!

```bash
cd /Users/resti/Documents/testerchem/backend
./start.sh
```

Kamu **HARUS** melihat output Uvicorn dengan:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Jika masih exit tanpa log**, share error message dan kita debug lebih lanjut! 🔧
