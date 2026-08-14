# 🔍 Live Monitoring & Alert System Debug Guide

## Issue: Worker Tidak Terdeteksi di Live Monitoring

### ✅ **Step 1: Verify Worker Check-in Data**

**Check di Supabase Dashboard:**
1. Go to Supabase → Table Editor → `worker_zone_map`
2. Should see entries with:
   - `worker_id`: User ID yang check-in
   - `zone_id`: Zone ID yang di-scan
   - `checked_in_at`: Timestamp check-in

**SQL Query untuk check:**
```sql
SELECT 
  wzm.*,
  p.name as worker_name,
  z.name as zone_name
FROM worker_zone_map wzm
LEFT JOIN profiles p ON p.id = wzm.worker_id
LEFT JOIN zones z ON z.id = wzm.zone_id;
```

### ✅ **Step 2: Debug Live Monitoring**

**Open Browser Console (F12) dan check:**
1. Go to Admin Dashboard → Live Monitoring
2. Click "Refresh Worker List" 
3. Look for console logs:
   - "Raw worker data: [...]"
   - "Formatted workers: [...]"

**Expected output:**
```javascript
Raw worker data: [
  {
    worker_id: "uuid-here",
    zone_id: "zone-uuid",
    checked_in_at: "2024-...",
    profiles: { name: "Worker Name" },
    zones: { name: "Zone Name" }
  }
]
```

### ✅ **Step 3: Test Alert System**

**After worker appears in list:**
1. Click on worker card (should highlight in orange)
2. Select alert type: Info/Warning/Danger
3. Type message: "Test alert - please acknowledge"
4. Click "Send Alert"
5. Check browser console for success/error logs

**Worker should receive alert:**
- Login as worker in different browser/incognito
- Go to Worker Dashboard  
- Should see alert notification at top

### ✅ **Step 4: Fix Common Issues**

**Issue 1: RLS (Row Level Security) Problems**
```sql
-- Check if RLS policies allow cross-org access
SELECT * FROM worker_zone_map; -- Should only show your org's data
```

**Issue 2: Missing Profile Names**
```sql
-- Check if profiles exist
SELECT id, name, role FROM profiles WHERE role = 'worker';
```

**Issue 3: Realtime Subscriptions**
- Check Network tab for WebSocket connections
- Should see "realtime" connections to Supabase

### ✅ **Step 5: Manual Test Setup**

**Create test data manually:**
```sql
-- Insert test worker check-in (replace UUIDs with actual ones)
INSERT INTO worker_zone_map (worker_id, zone_id, checked_in_at)
VALUES ('your-worker-uuid', 'your-zone-uuid', NOW());
```

## 📊 Total Assessments Explained

### **What is "Total Assessments"?**

**Total Assessments = Number of GHS Scans performed**

### **How it works:**
1. **Admin goes to "Assess Hazards" tab**
2. **Scans GHS pictogram** on chemical product
3. **System logs scan** in `workplace_scans` table
4. **Counter increases** in analytics

### **Purpose:**
- Track how many chemical products have been assessed
- Monitor admin activity and workplace safety efforts  
- Show compliance with hazard assessment requirements
- Analytics for safety program effectiveness

### **To increase Total Assessments:**
1. Go to Admin Dashboard → Assess Hazards
2. Click "Start Workplace Assessment"
3. Point camera at GHS symbols (any image with symbols works for testing)
4. Complete scan → Creates assessment record
5. Create zone (optional) → Assessment is logged regardless

### **View Assessment History:**
```sql
SELECT 
  ws.*,
  p.name as scanned_by_name,
  z.name as zone_name
FROM workplace_scans ws
LEFT JOIN profiles p ON p.id = ws.scanned_by  
LEFT JOIN zones z ON z.id = ws.zone_id
ORDER BY ws.created_at DESC;
```

## 🔧 Quick Fixes

### **If Live Monitoring Shows No Workers:**

1. **Check Database:**
   ```sql
   SELECT COUNT(*) FROM worker_zone_map WHERE zone_id IS NOT NULL;
   ```

2. **Refresh Page** - Sometimes real-time updates lag

3. **Check Browser Console** - Look for JavaScript errors

4. **Test with Manual Entry:**
   ```sql
   -- Add test entry (replace with real UUIDs)
   INSERT INTO worker_zone_map VALUES (
     uuid_generate_v4(),
     'worker-uuid', 
     'zone-uuid', 
     NOW()
   );
   ```

### **If Alerts Don't Work:**

1. **Check worker_alerts table permissions:**
   ```sql
   -- Test alert insertion
   INSERT INTO worker_alerts (worker_id, message, alert_type)
   VALUES ('worker-uuid', 'Test message', 'info');
   ```

2. **Check Realtime subscriptions:**
   - Open Network tab → should see WebSocket connections
   - Look for "postgres_changes" messages

3. **Test with both accounts:**
   - Admin window: Send alert
   - Worker window (incognito): Should receive immediately

## ✅ Success Checklist

- [ ] Worker appears in Live Monitoring after check-in
- [ ] Worker name shows correctly (not just UUID)
- [ ] Zone name displays properly  
- [ ] Alert system works bidirectionally
- [ ] Total Assessments increases after GHS scans
- [ ] Real-time updates work without refresh

**If any of these fail, use the debug steps above! 🚀**