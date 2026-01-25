-- Create Storage Bucket for Restaurant Images
-- Run this in SQL Editor

-- 1. Create Bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-images', 'restaurant-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Security Policies (Public Read, Authenticated Upload)

-- Allow Public Read
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'restaurant-images' );

-- Allow Authenticated Uploads (Any logged in user for this demo, or restrict to owners)
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'restaurant-images' );

-- Allow Owners to Update/Delete their own files (Simplified for demo: Authenticated)
CREATE POLICY "Authenticated Update" 
ON storage.objects FOR UPDATE
TO authenticated 
USING ( bucket_id = 'restaurant-images' );

SELECT '✅ Storage bucket "restaurant-images" ready!' as status;
