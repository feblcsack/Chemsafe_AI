-- ChemSafe Database Updates
-- Run these SQL commands in Supabase SQL Editor ONE BY ONE

-- 1. Add additional_requirements column to zones table
ALTER TABLE zones ADD COLUMN IF NOT EXISTS additional_requirements text;

-- 2. Add checked_in_at column to worker_zone_map table (CRITICAL FIX)
ALTER TABLE worker_zone_map ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;

-- 2b. Add camera_station_id to ppe_events for tracking which camera detected the event
ALTER TABLE ppe_events ADD COLUMN IF NOT EXISTS camera_station_id uuid REFERENCES monitoring_stations(id);

-- 3. Create worker_alerts table
CREATE TABLE IF NOT EXISTS worker_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id uuid REFERENCES profiles(id),
  zone_id uuid REFERENCES zones(id),
  message text NOT NULL,
  alert_type text CHECK (alert_type IN ('warning', 'danger', 'info')),
  sent_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz
);

-- 3. Create worker_acknowledgments table
CREATE TABLE IF NOT EXISTS worker_acknowledgments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id uuid REFERENCES profiles(id),
  zone_id uuid REFERENCES zones(id),
  requirements_version text,
  acknowledged_at timestamptz DEFAULT now()
);

-- 4. Create monitoring_stations table
CREATE TABLE IF NOT EXISTS monitoring_stations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id uuid REFERENCES zones(id),
  station_name text NOT NULL,
  camera_url text,
  stream_key text,
  status text CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- 5. Enable RLS for new tables
ALTER TABLE worker_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_stations ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for worker_alerts
DROP POLICY IF EXISTS "worker_alerts_self_read" ON worker_alerts;
CREATE POLICY "worker_alerts_self_read" ON worker_alerts
  FOR SELECT USING (auth.uid() = worker_id);

DROP POLICY IF EXISTS "worker_alerts_admin_all" ON worker_alerts;
CREATE POLICY "worker_alerts_admin_all" ON worker_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 7. Create RLS policies for worker_acknowledgments
DROP POLICY IF EXISTS "worker_acknowledgments_self" ON worker_acknowledgments;
CREATE POLICY "worker_acknowledgments_self" ON worker_acknowledgments
  FOR ALL USING (auth.uid() = worker_id);

DROP POLICY IF EXISTS "worker_acknowledgments_admin_read" ON worker_acknowledgments;
CREATE POLICY "worker_acknowledgments_admin_read" ON worker_acknowledgments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 8. Create RLS policies for monitoring_stations
DROP POLICY IF EXISTS "monitoring_stations_admin_all" ON monitoring_stations;
CREATE POLICY "monitoring_stations_admin_all" ON monitoring_stations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Verification: Check if all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('worker_alerts', 'worker_acknowledgments', 'monitoring_stations');

-- Success! Database is ready for ChemSafe Enhanced System