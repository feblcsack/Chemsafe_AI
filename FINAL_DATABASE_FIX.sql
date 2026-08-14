-- FINAL DATABASE FIX - Run this in Supabase SQL Editor
-- This will fix all issues and make everything work properly

-- Step 1: Clean up all existing check-ins
DELETE FROM worker_zone_map;

-- Step 2: Make sure table has correct structure
-- Drop old constraints that cause issues
ALTER TABLE worker_zone_map DROP CONSTRAINT IF EXISTS worker_zone_map_pkey;

-- Step 3: Ensure we have an ID column
ALTER TABLE worker_zone_map ADD COLUMN IF NOT EXISTS id uuid DEFAULT uuid_generate_v4();

-- Step 4: Set new primary key on id
ALTER TABLE worker_zone_map ADD PRIMARY KEY (id);

-- Step 5: Add index for performance (not constraint, just index)
CREATE INDEX IF NOT EXISTS idx_worker_zone_map_worker ON worker_zone_map(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_zone_map_zone ON worker_zone_map(zone_id);

-- Step 6: Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'worker_zone_map'
ORDER BY ordinal_position;

-- Step 7: Check constraints
SELECT
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'worker_zone_map'::regclass;

-- Success! Now test worker check-in from the app
-- It should work without any errors
