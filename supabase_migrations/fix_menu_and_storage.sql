-- 1. Fix column name mismatch in menu_items
-- Code uses 'is_available', Database has 'available'
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'available') THEN
    ALTER TABLE menu_items RENAME COLUMN available TO is_available;
  END IF;
END $$;

-- 2. Create Storage Bucket for Menu Items
-- Note: 'storage' schema might not be directly modifiable in all setups via SQL editor, 
-- but usually inserting into storage.buckets works for Supabase.

INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-items', 'menu-items', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies (RLS)
-- Enable RLS on objects if not enabled (usually it is)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Public Read Access
DROP POLICY IF EXISTS "Public Select Menu Images" ON storage.objects;
CREATE POLICY "Public Select Menu Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'menu-items' );

-- Policy: Authenticated Upload (Restaurant Owners)
-- Allow any authenticated user to upload for now to keep it simple, 
-- ideally restricted to the restaurant folder they own.
DROP POLICY IF EXISTS "Auth Upload Menu Images" ON storage.objects;
CREATE POLICY "Auth Upload Menu Images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'menu-items' 
  AND auth.role() = 'authenticated'
);

-- Policy: Owners can Update/Delete their own files
DROP POLICY IF EXISTS "Auth Update/Delete Menu Images" ON storage.objects;
CREATE POLICY "Auth Update/Delete Menu Images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'menu-items' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Auth Delete Menu Images" ON storage.objects;
CREATE POLICY "Auth Delete Menu Images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'menu-items' AND auth.uid() = owner );
