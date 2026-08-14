# 🔧 Multi-Organization Issue Fix

## 🚨 Problem Identified:

Dari SQL query results, ada **3 organizations berbeda**:

```
org_id: 53a4f709-ae8b-4458-b94c-0871faa9ea98 (Zone: test)
org_id: a07b68fd-e960-49f7-b42a-d3a2256b200a (Zone: tester dul, tata)  
org_id: 8f4d7ee8-c8f4-4532-9f13-b45179db61df (Zone: test with flame hazard)
```

**Workers check-in ke zones dari org berbeda**, sehingga:
- Admin dari org A tidak bisa lihat workers di org B
- Ini **CORRECT BEHAVIOR** untuk multi-tenant security
- Tapi untuk testing, kita perlu pastikan admin dan worker **di org yang sama**

---

## ✅ Solution Options:

### Option 1: Use Same Admin-Worker Pair (Recommended for Testing)

**Check which org your admin belongs to:**

```sql
-- Find your admin user
SELECT id, email, role FROM auth.users WHERE email = 'your-admin-email';

-- Check admin's org
SELECT id, email, role, org_id FROM profiles WHERE id = 'admin-user-id';
```

**Check which org your worker belongs to:**

```sql
-- Find worker
SELECT id, email, role FROM auth.users WHERE email = 'your-worker-email';

-- Check worker's org  
SELECT id, email, role, org_id FROM profiles WHERE id = 'worker-user-id';
```

**Make sure they match! If not, update:**

```sql
-- Option A: Move worker to admin's org
UPDATE profiles 
SET org_id = (SELECT org_id FROM profiles WHERE id = 'admin-user-id')
WHERE id = 'worker-user-id';

-- Option B: Move admin to worker's org (less common)
UPDATE profiles
SET org_id = (SELECT org_id FROM profiles WHERE id = 'worker-user-id')
WHERE id = 'admin-user-id';
```

### Option 2: Create Zone in Same Org as Worker

```sql
-- Find worker's org
SELECT org_id FROM profiles WHERE name = 'worker';

-- Create zone in that org (as admin from that org)
-- Do this via UI: Login as admin → Assess Hazards → Scan → Create Zone
```

### Option 3: Re-assign Worker to Correct Zone

```sql
-- Find zones in admin's org
SELECT z.id, z.name, z.org_id, p.email as admin_email
FROM zones z
JOIN profiles p ON z.created_by = p.id
WHERE p.role = 'admin';

-- Update worker's check-in to correct zone
UPDATE worker_zone_map
SET zone_id = 'zone-id-from-admin-org',
    checked_in_at = NOW()
WHERE worker_id = 'worker-user-id';
```

---

## 🧪 Quick Test Setup

**For testing purposes, create everything fresh:**

### Step 1: Create Test Admin + Org
```sql
-- Will be auto-created when you sign up as admin
-- Note the org_id after signup
SELECT id, email, role, org_id FROM profiles WHERE role = 'admin' ORDER BY created_at DESC LIMIT 1;
```

### Step 2: Create Test Worker in Same Org
```sql
-- Sign up as worker, then update org_id
UPDATE profiles 
SET org_id = 'admin-org-id-here'
WHERE email = 'worker@test.com';
```

### Step 3: Create Zone as Admin
- Login as admin
- Go to Assess Hazards
- Scan any GHS symbol
- Create zone

### Step 4: Worker Check-in
- Login as worker  
- Scan zone QR code
- Check-in

### Step 5: Verify in Live Monitoring
- Login as admin
- Go to Live Monitoring
- Click "Refresh Worker List"
- Open Console (F12)
- Should see logs showing worker

---

## 📊 Debug Query

**Run this to see complete org relationships:**

```sql
SELECT 
  'ADMIN' as type,
  p.id,
  p.email,
  p.name,
  p.role,
  p.org_id,
  (SELECT COUNT(*) FROM zones WHERE org_id = p.org_id) as zones_count
FROM profiles p
WHERE p.role = 'admin'

UNION ALL

SELECT 
  'WORKER' as type,
  p.id,
  p.email,
  p.name,
  p.role,
  p.org_id,
  (SELECT COUNT(*) FROM worker_zone_map wzm 
   JOIN zones z ON wzm.zone_id = z.id 
   WHERE z.org_id = p.org_id AND wzm.worker_id = p.id) as checkins_count
FROM profiles p
WHERE p.role = 'worker'

ORDER BY type, org_id;
```

---

## ✅ Expected Behavior After Fix:

### Console Output (Admin Dashboard → Live Monitoring):

```javascript
Loading monitoring data for context: {
  orgId: "8f4d7ee8-c8f4-4532-9f13-b45179db61df",
  user: {...}
}

ALL zones in database: [
  {id: "...", name: "test", org_id: "53a4f..."},
  {id: "...", name: "tester dul", org_id: "a07b6..."},  
  {id: "993f049f...", name: "test", org_id: "8f4d7..."}
]

Organization zones for this admin: [
  {id: "993f049f-d65d-4811-a2ab-b106e5f8f8c7", name: "test"}
]

ALL workers in database: [
  {worker_id: "6cf44...", zone_id: "993f04...", ...},
  ...
]

Workers in YOUR organization's zones: [
  {
    worker_id: "6cf44320-fdd2-48bc-a9c9-29ff58e37734",
    worker_name: "worker",
    zone_name: "test",
    zone_id: "993f049f-d65d-4811-a2ab-b106e5f8f8c7",
    checked_in_at: "2026-08-13T04:41:30.984Z"
  }
]

Total active workers found: 1
```

---

## 🎯 Action Items for You:

1. **Identify your admin's org_id:**
   ```sql
   SELECT id, email, org_id FROM profiles WHERE role = 'admin' AND email = 'your-admin-email';
   ```

2. **Identify your worker's org_id:**
   ```sql
   SELECT id, email, org_id FROM profiles WHERE role = 'worker' AND email = 'your-worker-email';
   ```

3. **If different, fix it:**
   ```sql
   -- Move worker to admin's org
   UPDATE profiles 
   SET org_id = 'admin-org-id-here'
   WHERE email = 'your-worker-email';
   
   -- Or create new zone in worker's org by logging in as admin from that org
   ```

4. **Test Live Monitoring:**
   - Refresh admin dashboard
   - Go to Live Monitoring
   - Click "Refresh Worker List"
   - Check browser console for detailed logs
   - Worker should appear now!

**Let me know your admin and worker org_ids and I'll give you exact SQL commands! 🚀**