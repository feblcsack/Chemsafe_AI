# Fix Camera Station Database Error

## ❌ Problem
Error saat save camera station:
```
Could not find the 'camera_type' column of 'monitoring_stations' in the schema cache
```

## ✅ Solution

Database perlu ditambahkan 3 kolom baru untuk support device cameras dan camera types.

### Step 1: Run Database Migration

1. **Buka Supabase Dashboard** → SQL Editor
2. **Copy paste SQL dari file** `ADD_CAMERA_COLUMNS.sql`
3. **Klik Run** atau tekan Cmd/Ctrl + Enter
4. **Verify output** - harus muncul "Camera columns added successfully!"

### Step 2: Verify Changes

Setelah run migration, coba lagi setup camera station:

1. Pilih zona
2. Masukkan nama station
3. Pilih "Device Camera" atau tipe lain
4. Untuk Device Camera:
   - Browser akan minta permission
   - Klik "Allow"
   - Pilih camera dari dropdown
   - Klik "Use This Camera Source"
5. Klik "Save Station"

Seharusnya **berhasil tanpa error!** ✅

## 📋 What Was Added

### New Columns in `monitoring_stations`:

| Column | Type | Purpose |
|--------|------|---------|
| `camera_type` | text | Type: device, ip_camera, rtsp, mjpeg, http |
| `camera_device_id` | text | Browser deviceId for USB/built-in cameras |
| `camera_device_label` | text | Human-readable camera name |

### Frontend Updates:

✅ MonitoringStationSetup properly saves device camera info
✅ CameraSourceSelector returns deviceId and label
✅ Button logic fixed - no longer checks availableDevices.length
✅ Loading state shows "Requesting camera permission..."
✅ Error handling with retry button
✅ Success indicator shows camera count

## 🎯 Expected Flow

### For Device Cameras:
1. Click "Device Camera"
2. System requests `getUserMedia()` permission
3. Browser shows permission prompt
4. User clicks "Allow"
5. Cameras enumerated and populated in dropdown
6. First camera auto-selected
7. Button "Use This Camera Source" enabled ✅
8. Save station → Success!

### For Network Cameras:
1. Click camera type (IP Camera, RTSP, etc)
2. Enter camera URL
3. Optionally click "Test" to verify
4. Click "Use This Camera Source"
5. Save station → Success!

## 🔍 Troubleshooting

**Button masih disabled?**
- Check browser console for permission errors
- Pastikan camera tidak digunakan aplikasi lain
- Try retry button
- Check browser allows camera access (Settings → Privacy)

**Save masih error?**
- Pastikan migration SQL sudah dijalankan
- Check error message di browser console
- Verify columns exist: Run `SELECT * FROM monitoring_stations LIMIT 1;` di Supabase SQL Editor

**Permission denied?**
- Browser perlu HTTPS atau localhost untuk camera access
- Check browser settings → Site permissions
- Retry dengan reload page
