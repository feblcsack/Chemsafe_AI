-- ============================================
-- HAZMON DATABASE SETUP - FIXED VERSION
-- ============================================
-- Run this in Supabase SQL Editor
-- No dependencies on non-existent tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE 1: hazdex_entries (user's Hazmon collection)
-- ============================================
CREATE TABLE IF NOT EXISTS public.hazdex_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hazmon_id TEXT NOT NULL, -- 'ignivore', 'oxidrax', etc.
    first_discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_encountered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    times_encountered INTEGER NOT NULL DEFAULT 1,
    is_mastered BOOLEAN NOT NULL DEFAULT FALSE,
    mastered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one entry per user per Hazmon
    UNIQUE(user_id, hazmon_id)
);

-- ============================================
-- TABLE 2: hazmon_scan_records (individual scan instances)
-- ============================================
CREATE TABLE IF NOT EXISTS public.hazmon_scan_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hazdex_entry_id UUID NOT NULL REFERENCES public.hazdex_entries(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    ghs_category TEXT NOT NULL,
    ghs_fact TEXT NOT NULL,
    safety_recommendation TEXT NOT NULL,
    safety_score INTEGER NOT NULL CHECK (safety_score >= 1 AND safety_score <= 5),
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    location_label TEXT,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE 3: hazmon_fusion_alerts (combination warnings)
-- ============================================
CREATE TABLE IF NOT EXISTS public.hazmon_fusion_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hazmon_id_1 TEXT NOT NULL,
    hazmon_id_2 TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('warning', 'danger', 'critical')),
    shown_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_hazdex_user_id ON public.hazdex_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_hazdex_hazmon_id ON public.hazdex_entries(hazmon_id);
CREATE INDEX IF NOT EXISTS idx_hazdex_mastered ON public.hazdex_entries(user_id, is_mastered);
CREATE INDEX IF NOT EXISTS idx_hazmon_scans_entry ON public.hazmon_scan_records(hazdex_entry_id);
CREATE INDEX IF NOT EXISTS idx_hazmon_scans_date ON public.hazmon_scan_records(scanned_at);
CREATE INDEX IF NOT EXISTS idx_fusion_alerts_user ON public.hazmon_fusion_alerts(user_id, shown_at);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.hazdex_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hazmon_scan_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hazmon_fusion_alerts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: hazdex_entries
-- ============================================
DROP POLICY IF EXISTS "Users can view their own Hazdex entries" ON public.hazdex_entries;
CREATE POLICY "Users can view their own Hazdex entries"
    ON public.hazdex_entries FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own Hazdex entries" ON public.hazdex_entries;
CREATE POLICY "Users can insert their own Hazdex entries"
    ON public.hazdex_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own Hazdex entries" ON public.hazdex_entries;
CREATE POLICY "Users can update their own Hazdex entries"
    ON public.hazdex_entries FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: hazmon_scan_records
-- ============================================
DROP POLICY IF EXISTS "Users can view their own scan records" ON public.hazmon_scan_records;
CREATE POLICY "Users can view their own scan records"
    ON public.hazmon_scan_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.hazdex_entries
            WHERE hazdex_entries.id = hazmon_scan_records.hazdex_entry_id
            AND hazdex_entries.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their own scan records" ON public.hazmon_scan_records;
CREATE POLICY "Users can insert their own scan records"
    ON public.hazmon_scan_records FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.hazdex_entries
            WHERE hazdex_entries.id = hazmon_scan_records.hazdex_entry_id
            AND hazdex_entries.user_id = auth.uid()
        )
    );

-- ============================================
-- RLS POLICIES: hazmon_fusion_alerts
-- ============================================
DROP POLICY IF EXISTS "Users can view their own fusion alerts" ON public.hazmon_fusion_alerts;
CREATE POLICY "Users can view their own fusion alerts"
    ON public.hazmon_fusion_alerts FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own fusion alerts" ON public.hazmon_fusion_alerts;
CREATE POLICY "Users can insert their own fusion alerts"
    ON public.hazmon_fusion_alerts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own fusion alerts" ON public.hazmon_fusion_alerts;
CREATE POLICY "Users can update their own fusion alerts"
    ON public.hazmon_fusion_alerts FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Update timestamp on row update
-- ============================================
CREATE OR REPLACE FUNCTION update_hazdex_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hazdex_entries_updated_at ON public.hazdex_entries;
CREATE TRIGGER hazdex_entries_updated_at
    BEFORE UPDATE ON public.hazdex_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_hazdex_updated_at();

-- ============================================
-- FUNCTION: Check for dangerous combinations
-- ============================================
CREATE OR REPLACE FUNCTION check_hazardous_combination(
    p_user_id UUID,
    p_new_hazmon_id TEXT
)
RETURNS TABLE (
    hazmon_id_1 TEXT,
    hazmon_id_2 TEXT,
    severity TEXT
) AS $$
BEGIN
    -- Get recent scans (within last hour)
    RETURN QUERY
    SELECT 
        he.hazmon_id as hazmon_id_1,
        p_new_hazmon_id as hazmon_id_2,
        CASE 
            -- Critical combinations
            WHEN (he.hazmon_id = 'corrolith' AND p_new_hazmon_id = 'oxidrax') THEN 'critical'
            WHEN (he.hazmon_id = 'oxidrax' AND p_new_hazmon_id = 'corrolith') THEN 'critical'
            WHEN (he.hazmon_id = 'ignivore' AND p_new_hazmon_id = 'oxidrax') THEN 'critical'
            WHEN (he.hazmon_id = 'oxidrax' AND p_new_hazmon_id = 'ignivore') THEN 'critical'
            -- Danger combinations
            WHEN (he.hazmon_id = 'venomask' AND p_new_hazmon_id = 'corrolith') THEN 'danger'
            WHEN (he.hazmon_id = 'corrolith' AND p_new_hazmon_id = 'venomask') THEN 'danger'
            ELSE 'warning'
        END as severity
    FROM public.hazdex_entries he
    WHERE he.user_id = p_user_id
    AND he.last_encountered_at >= NOW() - INTERVAL '1 hour'
    AND he.hazmon_id != p_new_hazmon_id
    AND (
        -- Check known dangerous pairs
        (he.hazmon_id = 'corrolith' AND p_new_hazmon_id = 'oxidrax') OR
        (he.hazmon_id = 'oxidrax' AND p_new_hazmon_id = 'corrolith') OR
        (he.hazmon_id = 'ignivore' AND p_new_hazmon_id = 'oxidrax') OR
        (he.hazmon_id = 'oxidrax' AND p_new_hazmon_id = 'ignivore') OR
        (he.hazmon_id = 'venomask' AND p_new_hazmon_id = 'corrolith') OR
        (he.hazmon_id = 'corrolith' AND p_new_hazmon_id = 'venomask')
    )
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT SELECT, INSERT, UPDATE ON public.hazdex_entries TO authenticated;
GRANT SELECT, INSERT ON public.hazmon_scan_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.hazmon_fusion_alerts TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
    'hazdex_entries' as table_name,
    COUNT(*) as row_count
FROM public.hazdex_entries
UNION ALL
SELECT 
    'hazmon_scan_records' as table_name,
    COUNT(*) as row_count
FROM public.hazmon_scan_records
UNION ALL
SELECT 
    'hazmon_fusion_alerts' as table_name,
    COUNT(*) as row_count
FROM public.hazmon_fusion_alerts;

-- ============================================
-- SUCCESS!
-- ============================================
-- Hazmon database schema applied successfully.
-- Next steps:
-- 1. Integrate GHSScannerWithHazmon in your frontend
-- 2. Add Hazdex navigation to worker dashboard
-- 3. Test with a scan!
