-- Add Camera Type Support to Monitoring Stations
-- Run this in Supabase SQL Editor

-- Add new columns for camera source configuration
ALTER TABLE monitoring_stations 
ADD COLUMN IF NOT EXISTS camera_type text CHECK (camera_type IN ('device', 'ip_camera', 'rtsp', 'mjpeg', 'http')),
ADD COLUMN IF NOT EXISTS camera_device_id text,
ADD COLUMN IF NOT EXISTS camera_device_label text;

-- Update existing records to have default camera_type
UPDATE monitoring_stations 
SET camera_type = 'ip_camera'
WHERE camera_type IS NULL AND camera_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN monitoring_stations.camera_type IS 'Type of camera source: device (USB/built-in), ip_camera, rtsp, mjpeg, or http (phone)';
COMMENT ON COLUMN monitoring_stations.camera_device_id IS 'Browser MediaDeviceInfo.deviceId for device cameras';
COMMENT ON COLUMN monitoring_stations.camera_device_label IS 'Human-readable label for device cameras';

-- Verification: Check the new columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'monitoring_stations' 
AND column_name IN ('camera_type', 'camera_device_id', 'camera_device_label');

-- Success message
SELECT 'Camera columns added successfully!' as status;
