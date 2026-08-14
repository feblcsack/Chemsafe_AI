# 🧪 Test Alert System - Step by Step

## Setup (5 minutes)

### Required Windows/Tabs:
1. **Admin Dashboard** - Your main browser window
2. **Worker Dashboard** - Open in incognito/private window or different browser
3. **Browser Console** - Press F12 in both windows

---

## Step-by-Step Test

### 1️⃣ Worker Check-in

**In Worker Window (Incognito)**:
1. Login as worker
2. Scan QR code for a zone
3. Acknowledge safety requirements
4. **Check console** - Should see:
   ```
   Setting up alert subscription for worker: [UUID]
   Alert subscription status: SUBSCRIBED
   ```

✅ **Checkpoint**: Worker dashboard shows "Ready to Work" and console shows "SUBSCRIBED"

---

### 2️⃣ Admin Sees Worker

**In Admin Window**:
1. Go to Live Monitoring tab
2. **Check**: Worker appears in "Active Workers" list
3. Worker count shows "1 checked in"

✅ **Checkpoint**: Admin can see worker in the list

---

### 3️⃣ Send Alert from Admin

**In Admin Window**:
1. Click on the worker card (should highlight in orange/red)
2. Right side shows: "Selected Worker: [Worker Name]"
3. Choose alert type: **Warning** (yellow button)
4. Type message: `"Test alert - please respond"`
5. Click **"Send Alert"** button

**Check Admin Console**:
```
📤 Sending alert to worker: {
  worker_id: "...",
  worker_name: "...",
  message: "Test alert - please respond",
  alert_type: "warning"
}
✅ Alert sent successfully: [{...}]
Worker should receive real-time notification now!
```

✅ **Checkpoint**: Admin console shows "✅ Alert sent successfully"

---

### 4️⃣ Worker Receives Alert

**Switch to Worker Window**:

**Check Worker Console IMMEDIATELY**:
Should see within 1-2 seconds:
```
🚨 ALERT RECEIVED: {
  new: {
    id: "...",
    message: "Test alert - please respond",
    alert_type: "warning",
    ...
  }
}
Alert details: {
  id: "...",
  message: "Test alert - please respond",
  type: "warning",
  timestamp: "..."
}
Adding alert to state: {...}
New alerts array: [{...}]
```

**Check Worker UI**:
- Alert card appears at **TOP of screen**
- Yellow/orange background (warning color)
- Shows message: "Test alert - please respond"
- ⚠️ Icon visible
- ✕ button to dismiss

✅ **Checkpoint**: Worker sees alert card and console shows "ALERT RECEIVED"

---

## 🐛 If Alerts NOT Showing

### Debug Checklist

#### Check 1: Worker Subscription Status
**Worker Console** should show:
```
Setting up alert subscription for worker: [UUID]
Alert subscription status: SUBSCRIBED ✅
```

❌ If shows "CLOSED" or error → Subscription failed

#### Check 2: Worker ID Set
**Worker Console**, type:
```javascript
// Check if workerId is set
console.log('Worker ID:', workerId);
```
Should show UUID, not `null`

#### Check 3: Database Insert
**Run in Supabase SQL Editor**:
```sql
SELECT * FROM worker_alerts ORDER BY created_at DESC LIMIT 5;
```
Should show the alert you just sent.

❌ If empty → Alert not inserted (admin side problem)
✅ If shows alert → Alert inserted but worker not receiving (subscription problem)

#### Check 4: Real-time Connection
**Worker Console**, check for:
```
Removing stale channel: realtime:worker-alerts-[UUID]
Alert subscription status: SUBSCRIBED
```

❌ If stuck at "CONNECTING" → Network/Supabase issue

#### Check 5: Alert Type Column Name
The database column is `alert_type` (not `type`). Worker code now maps this correctly.

---

## 🎯 Expected Behavior Summary

### Timeline:
1. **Admin clicks "Send Alert"** → 0s
2. **Database INSERT** → ~100ms
3. **Supabase real-time triggers** → ~200ms
4. **Worker receives via WebSocket** → ~500ms
5. **Worker console logs "ALERT RECEIVED"** → ~500ms
6. **Worker UI updates with alert card** → ~600ms

**Total time**: Less than 1 second from send to display

---

## 🔍 Advanced Debugging

### Check Supabase Real-time Status

**In Supabase Dashboard**:
1. Go to Database → Replication
2. Check "Realtime" is enabled
3. Check `worker_alerts` table has replication enabled

### Manual Test Insert

**Run in Supabase SQL Editor**:
```sql
-- Replace [WORKER_UUID] with actual worker user ID
INSERT INTO worker_alerts (worker_id, message, alert_type, zone_id)
VALUES (
  '[WORKER_UUID]',
  'Manual test alert',
  'info',
  (SELECT zone_id FROM worker_zone_map WHERE worker_id = '[WORKER_UUID]' LIMIT 1)
);
```

Worker should receive this immediately if subscription working.

### Check Browser Console for Errors

Common issues:
- ❌ "WebSocket connection failed" → Network issue
- ❌ "Cannot read property 'new'" → Payload format issue
- ❌ "RLS policy violation" → Should not happen with RLS disabled
- ❌ "Subscription timeout" → Supabase connection issue

---

## ✅ Success Criteria

When everything works:

1. **Admin sends alert** → Console shows "✅ Alert sent"
2. **Worker receives immediately** → Console shows "🚨 ALERT RECEIVED"
3. **Alert card displays** → Yellow/orange card at top
4. **Worker can dismiss** → Click ✕ to remove
5. **Total time < 1 second** → Real-time experience

---

## 📋 Test Multiple Alert Types

### Test 1: Info Alert (Blue)
- Type: Info
- Message: "Remember to take your break at 3pm"
- Expected: Blue card, ℹ️ icon

### Test 2: Warning Alert (Yellow)
- Type: Warning  
- Message: "Please ensure all PPE is worn correctly"
- Expected: Yellow/orange card, ⚠️ icon

### Test 3: Danger Alert (Red)
- Type: Danger
- Message: "EVACUATE IMMEDIATELY - Chemical spill detected"
- Expected: Red card, ⚠️ icon

---

## 🚀 Next Steps After Alerts Working

1. ✅ Test different alert types (info, warning, danger)
2. ✅ Test multiple alerts stacking
3. ✅ Test dismiss functionality
4. ⏳ Add sound/notification for danger alerts
5. ⏳ Add alert acknowledgment tracking
6. ⏳ Enable PPE detection to auto-send alerts

---

## Need Help?

If alerts still not working after these checks:

1. Share **both console logs** (admin + worker)
2. Share result of **SQL query** (worker_alerts table)
3. Share any **error messages**
4. Confirm **Supabase real-time is enabled**

The enhanced logging will show exactly where the flow breaks!
