-- ============================================================
-- QR Platform - Storage Bucket Inicializálás
-- ============================================================

-- 1. Létrehozzuk a vödröt (bucket)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('qr-platform', 'qr-platform', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Alapértelmezett RLS: Mindenki olvashatja a képeket (Public)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'qr-platform');

-- 3. Csak a bejelentkezett étterem-tulajdonosok tölthetnek fel a saját mappájukba
CREATE POLICY "Owner Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'qr-platform' 
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.qr_restaurants WHERE owner_id = auth.uid()
    )
);

-- 4. Csak a tulajdonos törölheti/módosíthatja a saját képeit
CREATE POLICY "Owner Update/Delete Access"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'qr-platform' 
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.qr_restaurants WHERE owner_id = auth.uid()
    )
);
