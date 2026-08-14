# 🚀 How to Start Backend - Quick Guide

## ❌ Problem Kamu Sekarang

Ketika run `python main.py`, tidak ada output dan langsung kembali ke prompt:
```bash
(venv) resti@MacBook-Air-6 backend % python main.py
(venv) resti@MacBook-Air-6 backend % 
```

Ini artinya: **Command `python` tidak ditemukan di virtual environment kamu**

---

## ✅ Solution - Use Startup Script

### Method 1: Automatic Startup (RECOMMENDED)

```bash
cd /Users/resti/Documents/testerchem/backend
./start.sh
```

Script akan:
- ✅ Check virtual environment
- ✅ Activate venv automatically
- ✅ Check dependencies installed
- ✅ Check OpenCV installed
- ✅ Start FastAPI server
- ✅ Show startup logs

**Expected Output**:
```
🚀 Starting ChemSafe Backend...

📦 Activating virtual environment...
✅ All checks passed!

🌐 Starting FastAPI server on http://localhost:8000
📊 API docs available at http://localhost:8000/docs

Press Ctrl+C to stop the server
─────────────────────────────────────────────────────
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

---

### Method 2: Manual Activation

```bash
cd /Users/resti/Documents/testerchem/backend

# Activate venv
source venv/bin/activate

# Use python3 (NOT python)
python3 main.py
```

**Or**:
```bash
# Directly with venv python
cd /Users/resti/Documents/testerchem/backend
./venv/bin/python main.py
```

---

## 🔍 Why `python main.py` Didn't Work

### Issue 1: Virtual Environment Not Activated

Kamu di folder backend tapi venv belum aktif:
```bash
resti@MacBook-Air-6 backend % python main.py  # ❌ Wrong
```

Should be:
```bash
resti@MacBook-Air-6 backend % source venv/bin/activate
(venv) resti@MacBook-Air-6 backend % python3 main.py  # ✅ Correct
```

### Issue 2: Wrong Python Command

macOS default tidak punya command `python`, hanya `python3`:
```bash
which python   # ❌ Not found
which python3  # ✅ Found: /usr/bin/python3
```

Setelah activate venv, gunakan `python3`:
```bash
(venv) resti@MacBook-Air-6 backend % python3 main.py
```

---

## 🎯 Quick Fix NOW

### Step 1: Stop Current Terminal
Press `Ctrl+C` if anything running

### Step 2: Use Startup Script
```bash
cd /Users/resti/Documents/testerchem/backend
./start.sh
```

### Step 3: Verify Running
Open browser: http://localhost:8000/health

Should see:
```json
{"status":"ok","service":"chemsafe-backend"}
```

---

## ✅ Correct Startup Sequence

**Every time you start backend**:

```bash
# 1. Go to backend folder
cd /Users/resti/Documents/testerchem/backend

# 2. Run startup script
./start.sh

# That's it! Server will start and show logs
```

**Expected logs**:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

## 🐛 Troubleshooting

### Error: "Permission denied: ./start.sh"
```bash
chmod +x start.sh
./start.sh
```

### Error: "No module named 'fastapi'"
```bash
source venv/bin/activate
pip install -r requirements.txt
./start.sh
```

### Error: "No module named 'cv2'"
```bash
source venv/bin/activate
pip install opencv-python==4.10.0.84
./start.sh
```

### Server starts but no logs
Check if already running on port 8000:
```bash
lsof -i :8000
# If found, kill it:
kill -9 [PID]
# Then start again:
./start.sh
```

---

## 📊 Test Backend is Working

### Test 1: Health Check
```bash
curl http://localhost:8000/health
```
Expected: `{"status":"ok","service":"chemsafe-backend"}`

### Test 2: Camera Monitoring Status
```bash
curl http://localhost:8000/camera/monitoring-status
```
Expected: `{"active_monitors":0,"monitors":{}}`

### Test 3: API Docs
Open browser: http://localhost:8000/docs
Should see FastAPI Swagger UI

---

## 🎯 Summary

**Wrong way** (what you did):
```bash
cd backend
python main.py  # ❌ No output, exits immediately
```

**Right way** (use this):
```bash
cd backend
./start.sh      # ✅ Shows startup logs, keeps running
```

**Or manual**:
```bash
cd backend
source venv/bin/activate
python3 main.py  # ✅ Shows startup logs
```

---

## 🚀 Next Steps

1. **Start backend**: `cd backend && ./start.sh`
2. **Verify running**: Open http://localhost:8000/health
3. **Start frontend**: `cd frontend && npm run dev`
4. **Test PPE detection**: Admin Dashboard → Live Monitoring → Start Monitoring

---

**Now try**: `cd backend && ./start.sh` and share the output! 🚀
