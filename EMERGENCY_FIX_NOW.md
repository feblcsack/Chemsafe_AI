# 🚨 EMERGENCY FIX - App Broken by RLS Policies

## Problem
RLS policies kita terlalu restrictive dan causing 500 errors di semua Supabase queries. App completely broken.

## Immediate Action Required

### Step 1: Rollback RLS Policies (2 minutes)

1. **Open Supabase Dashboard → SQL Editor**
2. **Copy entire content of `RLS_ROLLBACK_AND_FIX.sql`**
3. **Run the script**
4. **Refresh your browser**

### Step 2: Verify App Works Again

After running rollback script:

✅ **Browser console should show**:
- No more 500 errors
- `ALL zones in database: [...]` (with actual data, not null)
- App loads properly

✅ **Dashboard should show**:
- No "Supabase database connection failed" errors
- UI renders properly
- No infinite error loops

---

## What the Rollback Does

### Option A: Disable RLS (Recommended for Now)

```sql
ALTER TABLE worker_zone_map DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE zones DISABLE ROW LEVEL SECURITY;
```

**Effect**:
- All authenticated users can read/write all data
- ⚠️ No access control (development/testing only)
- ✅ App will work immediately
- ✅ No 500 errors

**Security**:
- Fine for local development
- Fine if only you + trusted team using app
- NOT recommended for production with untrusted users

### Option B: Simple Permissive Policies (Alternative)

If you want RLS enabled but less restrictive:

```sql
-- Uncomment the section at bottom of RLS_ROLLBACK_AND_FIX.sql
-- Allows all authenticated users to access everything
```

---

## Why Did This Happen?

### Root Cause
Our RLS policies had issues:

1. **Complex JOIN queries in policies** - Too expensive for PostgreSQL
2. **Circular dependencies** - Policy on profiles referencing profiles
3. **Conflicting with existing policies** - Old policies weren't fully removed
4. **Missing indexes** - Slow queries timed out

### The Fix Strategy

**Phase 1** (NOW): Get app working
- Disable RLS temporarily
- Or use simple permissive policies
- Confirm app loads and works

**Phase 2** (LATER): Add proper RLS
- Start with simple policies
- Test each one individually
- Add indexes for performance
- Gradually make more restrictive

---

## After Rollback: Testing Checklist

### 1. App Loads ✅
- [ ] No 500 errors in console
- [ ] Dashboard renders
- [ ] No connection errors

### 2. Worker Flow Works ✅
- [ ] Worker can scan QR code
- [ ] Worker can check into zone
- [ ] Zone info loads properly

### 3. Admin Flow Works ✅
- [ ] Admin can see zones list
- [ ] Admin can see worker check-ins
- [ ] Admin can send alerts

### 4. Camera Setup Works ✅
- [ ] Can add monitoring station
- [ ] Camera URL saves
- [ ] Station list loads

---

## Next Steps After App Works

### Option 1: Keep RLS Disabled (Quick)
If this is development/internal tool:
- Leave RLS disabled
- Focus on features
- Add RLS later when needed

### Option 2: Add Simple RLS (Medium)
Run the alternative section in rollback script:
```sql
-- Simple "authenticated users can access all" policies
CREATE POLICY "profiles_authenticated_all" ON profiles
  FOR ALL TO authenticated
  USING (true);
```

### Option 3: Proper RLS (Complex)
After app stable:
- Add organization-based access control
- Test each policy individually
- Add database indexes
- Monitor performance

---

## Debugging Commands

### Check RLS Status
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('worker_zone_map', 'profiles', 'zones')
  AND schemaname = 'public';
```

Expected after rollback: All show `FALSE` (RLS disabled)

### Check Remaining Policies
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('worker_zone_map', 'profiles', 'zones');
```

Expected after rollback: Only old policies remain (not the ones we added)

### Test Basic Query
```sql
-- This should work without errors
SELECT * FROM zones LIMIT 5;
SELECT * FROM profiles LIMIT 5;
SELECT * FROM worker_zone_map LIMIT 5;
```

---

## My Apologies

The complex RLS policies broke your app. The rollback script will fix it immediately by disabling RLS.

**Priority order**:
1. Get app working (disable RLS) ✅ 
2. Test all features work ✅
3. Add simple RLS later (optional) ⏳

Run `RLS_ROLLBACK_AND_FIX.sql` now to restore your app!
