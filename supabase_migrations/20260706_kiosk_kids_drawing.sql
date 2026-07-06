-- Kiosk Kids Drawing Module: stores drawing records and setup storage bucket

-- 1. Create drawings metadata table
CREATE TABLE IF NOT EXISTS kiosk_drawings (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  theme       TEXT        NOT NULL,                      -- e.g. "Castle", "Sights", etc.
  name        TEXT        DEFAULT 'Anonymous',
  age         INTEGER,
  country     TEXT,
  image_path  TEXT        NOT NULL,                      -- Public URL of the drawing PNG
  approved    BOOLEAN     DEFAULT false,                 -- Moderation status
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE kiosk_drawings ENABLE ROW LEVEL SECURITY;

-- Select policy: Anyone can see drawings (both for screensaver and gallery)
CREATE POLICY "Public Select drawings" ON kiosk_drawings
  FOR SELECT TO anon, authenticated USING (true);

-- Insert policy: Kiosk terminal (anon key) and authenticated users can submit drawings
CREATE POLICY "Kiosk Insert drawing" ON kiosk_drawings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Update policy: Allow updating approved status (needed for admin moderation)
CREATE POLICY "Admin Update drawing" ON kiosk_drawings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Delete policy: Allow deletion (needed for admin moderation/cleanup)
CREATE POLICY "Admin Delete drawing" ON kiosk_drawings
  FOR DELETE TO anon, authenticated USING (true);

-- 2. Create Storage Bucket (kiosk-drawings)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kiosk-drawings', 'kiosk-drawings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies: Public Read Access
CREATE POLICY "Public Read kiosk-drawings"
ON storage.objects FOR SELECT
USING ( bucket_id = 'kiosk-drawings' );

-- Storage Policies: Kiosk terminal upload drawings
CREATE POLICY "Kiosk Upload kiosk-drawings"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK ( bucket_id = 'kiosk-drawings' );

-- Storage Policies: Admin delete drawings
CREATE POLICY "Admin Delete kiosk-drawings"
ON storage.objects FOR DELETE
TO anon, authenticated
USING ( bucket_id = 'kiosk-drawings' );
