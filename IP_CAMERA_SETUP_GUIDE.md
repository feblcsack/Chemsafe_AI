# 📹 IP Camera Setup Guide - Complete Instructions

## 🎯 Goal: Connect Phone/Camera as Monitoring Station

---

## Option 1: Use Android Phone as IP Camera (EASIEST) ⭐

### Step 1: Install IP Webcam App
- **Download**: "IP Webcam" by Pavel Khlebovich (Google Play Store)
- **Free** and works perfectly

### Step 2: Configure App
1. Open IP Webcam app
2. Scroll down to bottom
3. Click **"Start Server"**
4. App will show IP address, example: `http://192.168.1.100:8080`

### Step 3: Find Your Camera URLs

App shows multiple URLs. Use these:

**For browser viewing:**
```
http://192.168.1.100:8080
```

**For video feed (use this in ChemSafe):**
```
http://192.168.1.100:8080/video
```

**Alternative feeds:**
```
http://192.168.1.100:8080/videofeed
http://192.168.1.100:8080/shot.jpg (snapshot)
```

### Step 4: Test Camera Feed

**Open in browser:**
```
http://192.168.1.100:8080
```

Should see camera controls and live view!

### Step 5: Add to ChemSafe

1. Admin Dashboard → Camera Setup
2. Click "Add Station"
3. **Station Name**: "Phone Camera - Zone 1"
4. **Zone**: Select your zone
5. **Camera URL**: `http://192.168.1.100:8080/video`
6. **Stream Key**: Leave empty (not needed)
7. Click "Add Station"

---

## Option 2: Use iPhone as IP Camera

### Recommended Apps:
- **"iVCam"** (Free, iOS + Windows/Mac app needed)
- **"EpocCam"** (Free version available)
- **"IP Webcam"** (iOS version)

### Setup:
1. Install app on iPhone
2. Start server
3. Note the IP address shown
4. Use format: `http://[iphone-ip]:8080/video`

---

## Option 3: Use Real IP Camera

### Compatible Camera Types:
- IP cameras with **RTSP** streaming
- Cameras with **MJPEG** over HTTP
- Security cameras with **HTTP API**

### Common URL Formats:

**RTSP (Most common):**
```
rtsp://192.168.1.100:554/stream
rtsp://admin:password@192.168.1.100:554/h264
rtsp://192.168.1.100:554/ch01/0
```

**MJPEG:**
```
http://192.168.1.100/mjpeg
http://192.168.1.100/video.cgi
http://192.168.1.100:8080/video.mjpeg
```

**With Authentication:**
```
http://admin:password@192.168.1.100/video
rtsp://username:password@192.168.1.100:554/stream
```

---

## 🔍 Troubleshooting

### Issue 1: Can't Connect to Phone Camera

**Check:**
1. Phone and laptop on **same WiFi network**
2. IP address is correct (check in app)
3. Port 8080 not blocked by firewall
4. Try accessing URL in browser first

**Test in browser:**
```bash
# Open this in Chrome/Safari
http://[your-phone-ip]:8080
```

Should show camera web interface.

### Issue 2: "Network Error" or Timeout

**Fix:**
1. **Check WiFi connection** - Both devices on same network
2. **Disable VPN** - VPN can block local network
3. **Check firewall** - Allow port 8080
4. **Try different port** - Some apps use 4747 or 8081

**Test connection:**
```bash
# In terminal/command prompt
ping 192.168.1.100

# If fails, devices not on same network
```

### Issue 3: Camera Shows "Offline" in ChemSafe

**Verify URL format:**

✅ **CORRECT:**
```
http://192.168.1.100:8080/video
http://192.168.1.100:8080/videofeed
```

❌ **WRONG:**
```
http://192.168.1.100:8080 (missing /video)
192.168.1.100:8080/video (missing http://)
https://192.168.1.100:8080/video (use http not https)
```

### Issue 4: How to Find Phone IP Address

**In IP Webcam App:**
- IP shown at top when server is running
- Example: "Access stream on: http://192.168.1.100:8080"

**Or check in phone settings:**
- Settings → WiFi → Click connected network
- Look for "IP Address"

**Or use network scanner:**
```bash
# Mac/Linux
arp -a

# Windows
arp -a

# Look for device with your phone's name
```

---

## 📋 Complete Setup Checklist

### Phone IP Camera Setup:
- [ ] Install "IP Webcam" app on Android
- [ ] Start server in app
- [ ] Note IP address (e.g., 192.168.1.100:8080)
- [ ] Open URL in browser to verify it works
- [ ] Add to ChemSafe with format: `http://[ip]:8080/video`
- [ ] Set station status to "active"
- [ ] Verify "Live Feed Active" shows in ChemSafe

### Testing:
- [ ] Camera feed accessible in browser
- [ ] Station shows "active" in ChemSafe
- [ ] Can see camera preview in monitoring station card
- [ ] Laptop and phone on same WiFi
- [ ] No VPN or firewall blocking connection

---

## 🎯 Recommended Setup for Testing

### Best Option: Android Phone + IP Webcam

**Why:**
- ✅ Free app
- ✅ Easy to setup (2 minutes)
- ✅ Works on any WiFi network
- ✅ Multiple video formats
- ✅ Good quality
- ✅ No additional hardware needed

**Setup Time:** 5 minutes
**Cost:** Free

### Steps:
1. Install app (2 min)
2. Start server (30 sec)
3. Add to ChemSafe (2 min)
4. Test monitoring (30 sec)

**Total:** Ready to use in 5 minutes! ⚡

---

## 🔧 Advanced: Using OBS for USB Camera

If you have USB webcam:

### Step 1: Install OBS Studio
Download from: https://obsproject.com/

### Step 2: Setup Virtual Camera
1. Open OBS
2. Add video source (USB camera)
3. Start virtual camera
4. Use OBS's streaming URL

### Step 3: Stream to Network
Use OBS with nginx-rtmp server or VLC streaming.

**Note:** This is more complex, use phone IP camera for simpler setup.

---

## 📱 Quick Test Commands

### Test if camera is accessible:

**Method 1: Browser**
```
http://192.168.1.100:8080
```

**Method 2: Command Line (Mac/Linux)**
```bash
curl -I http://192.168.1.100:8080/video
# Should return HTTP 200 OK
```

**Method 3: VLC Player**
1. Open VLC
2. Media → Open Network Stream
3. Enter: `http://192.168.1.100:8080/video`
4. Should show live video

---

## ✅ Success Criteria

**Camera setup is working when:**
- ✅ Browser shows camera feed at `http://[ip]:8080`
- ✅ ChemSafe shows station as "active"
- ✅ Can add camera URL without errors
- ✅ Station card shows "Live Feed Active"
- ✅ No connection timeout errors

---

## 🚀 Next Steps After Camera Setup

1. **Position camera** to view work area
2. **Test PPE detection** (future feature)
3. **Monitor workers** in real-time
4. **Send alerts** based on camera feed

**Camera is now ready for monitoring! 📹✅**