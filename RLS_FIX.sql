-- ============================================
-- RLS POLICY FIX for Admin Live Monitoring
-- ============================================
-- Problem: Admin cannot see workers in worker_zone_map because RLS blocks cross-user reads
-- Solution: Add policies that allow admins to view workers in their organization's zones

-- First, let's check current policies (for debugging)
-- Run this to see what policies exist:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('worker_zone_map', 'profiles', 'zones');

-- ============================================
-- 1. Fix worker_zone_map RLS policies
-- ============================================

-- Allow workers to manage their own check-ins
DROP POLICY IF EXISTS "worker_zone_map_worker_self" ON worker_zone_map;
CREATE POLICY "worker_zone_map_worker_self" ON worker_zone_map
  FOR ALL USING (auth.uid() = worker_id);

-- Allow admins to view ALL worker check-ins in their organization's zones
DROP POLICY IF EXISTS "worker_zone_map_admin_read" ON worker_zone_map;
CREATE POLICY "worker_zone_map_admin_read" ON worker_zone_map
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM zones z
      JOIN profiles p ON p.org_id = z.org_id
      WHERE z.id = worker_zone_map.zone_id
        AND p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- ============================================
-- 2. Fix profiles RLS policies
-- ============================================
-- This is CRITICAL for the join: profiles!worker_zone_map_worker_id_fkey(name)

-- Allow everyone to read their own profile
DROP POLICY IF EXISTS "profiles_self_read" ON profiles;
CREATE POLICY "profiles_self_read" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow everyone to UPDATE their own profile
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to read ALL profiles in their organization
DROP POLICY IF EXISTS "profiles_admin_read_org" ON profiles;
CREATE POLICY "profiles_admin_read_org" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM profiles admin
      WHERE admin.id = auth.uid()
        AND admin.role = 'admin'
        AND admin.org_id = profiles.org_id
    )
  );

-- ============================================
-- 3. Fix zones RLS policies (if not already permissive)
-- ============================================

-- Allow workers to read zones they need to check into
DROP POLICY IF EXISTS "zones_worker_read" ON zones;
CREATE POLICY "zones_worker_read" ON zones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM profiles p
      WHERE p.id = auth.uid()
        AND p.org_id = zones.org_id
    )
  );

-- Allow admins full access to their organization's zones
DROP POLICY IF EXISTS "zones_admin_all" ON zones;
CREATE POLICY "zones_admin_all" ON zones
  FOR ALL USING (
    EXISTS (
      SELECT 1 
      FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.org_id = zones.org_id
    )
  );

-- ============================================
-- 4. Verification Queries
-- ============================================

-- Run these to verify the fixes work:

-- Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('worker_zone_map', 'profiles', 'zones')
  AND schemaname = 'public';

-- Check all policies are created
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('worker_zone_map', 'profiles', 'zones')
ORDER BY tablename, policyname;

-- Test query (simulate what admin sees)
-- Replace 'ADMIN_USER_ID' with actual admin user ID
/*
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "ADMIN_USER_ID"}';

SELECT 
  w.worker_id,
  w.zone_id,
  w.checked_in_at,
  p.name as worker_name,
  z.name as zone_name
FROM worker_zone_map w
JOIN profiles p ON p.id = w.worker_id
JOIN zones z ON z.id = w.zone_id
WHERE z.org_id = (SELECT org_id FROM profiles WHERE id = 'ADMIN_USER_ID');

RESET ROLE;
*/

-- ============================================
-- SUCCESS INDICATORS:
-- ============================================
-- ✅ worker_zone_map has 2 policies (worker_self + admin_read)
-- ✅ profiles has 3 policies (self_read, self_update, admin_read_org)
-- ✅ zones has 2 policies (worker_read + admin_all)
-- ✅ Test query returns worker data when run as admin
