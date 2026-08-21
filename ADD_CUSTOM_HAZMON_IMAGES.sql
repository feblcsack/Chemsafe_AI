-- Add custom image support to hazmon_collection table
-- This allows users to upload their own images for Hazmons

-- Add custom_image_url column
ALTER TABLE hazmon_collection
ADD COLUMN IF NOT EXISTS custom_image_url TEXT;

-- Add comment explaining the field
COMMENT ON COLUMN hazmon_collection.custom_image_url IS 'Optional custom image URL uploaded by user. If null, use default icon.';

-- Create storage bucket for hazmon images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hazmon-images', 'hazmon-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for hazmon images storage
CREATE POLICY IF NOT EXISTS "Users can upload hazmon images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'hazmon-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can view all hazmon images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'hazmon-images');

CREATE POLICY IF NOT EXISTS "Users can update own hazmon images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'hazmon-images' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'hazmon-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can delete own hazmon images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'hazmon-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update existing hazmon service to include custom_image_url in queries
-- (No SQL needed - just update TypeScript queries to SELECT custom_image_url)

-- Example: After running this, update hazmonService.ts to:
-- SELECT id, name, ..., custom_image_url FROM hazmon_collection

COMMENT ON TABLE hazmon_collection IS 'Stores user collected Hazmons with optional custom images';
