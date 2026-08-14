-- ============================================
-- EMERGENCY ROLLBACK AND PROPER FIX
-- ============================================
-- Problem: Previous RLS policies causing 500 errors
-- Solution: Remove conflicting policies and add simpler ones

-- ============================================
-- STEP 1: REMOVE ALL POLICIES WE JUST ADDED
-- ============================================

-- Remove worker_zone_map policies
DROP POLICY IF EXISTS "worker_zone_map_worker_self" ON worker_zone_map;
DROP POLICY IF EXISTS "worker_zone_map_admin_read" ON worker_zone_map;

-- Remove profiles policies  
DROP POLICY IF EXISTS "profiles_self_read" ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_read_org" ON profiles;

-- Remove zones policies
DROP POLICY IF EXISTS "zones_worker_read" ON zones;
DROP POLICY IF EXISTS "zones_admin_all" ON zones;

-- ============================================
-- STEP 2: CHECK WHAT POLICIES REMAIN
-- ============================================

-- Run this to see current state:
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('worker_zone_map', 'profiles', 'zones')
ORDER BY tablename, policyname;

-- ============================================
-- STEP 3: SIMPLER APPROACH - DISABLE RLS FOR TESTING
-- ============================================
-- This is TEMPORARY to get your app working again
-- We'll add proper policies after confirming app works

-- Disable RLS temporarily (ONLY for development/testing)
ALTER TABLE worker_zone_map DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE zones DISABLE ROW LEVEL SECURITY;

-- Note: This makes all data readable by all authenticated users
-- Fine for development, but you'll want proper RLS in production

-- ============================================
-- STEP 4: VERIFICATION
-- ============================================

-- Check RLS status (should show FALSE now)
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('worker_zone_map', 'profiles', 'zones')
  AND schemaname = 'public';

-- Expected output:
-- worker_zone_map | FALSE
-- profiles        | FALSE
-- zones           | FALSE

-- ============================================
-- ALTERNATIVE: SIMPLE PERMISSIVE POLICIES
-- ============================================
-- If you want RLS enabled but more permissive:
-- (Run this INSTEAD of DISABLE RLS above)

/*
-- Re-enable RLS
ALTER TABLE worker_zone_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- Simple permissive policies for authenticated users
CREATE POLICY "worker_zone_map_authenticated_all" ON worker_zone_map
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "profiles_authenticated_all" ON profiles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "zones_authenticated_all" ON zones
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
*/

-- ============================================
-- SUCCESS INDICATORS
-- ============================================
-- ✅ No more 500 errors in browser console
-- ✅ App loads without Supabase connection errors
-- ✅ Admin can load dashboard
-- ✅ Worker can load dashboard
-- ✅ Zones query returns data (not null)

-- After confirming app works, we can add back
-- proper RLS policies one by one
