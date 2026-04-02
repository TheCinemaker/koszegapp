-- 🛠️ EGYSZERŰSÍTETT FIX A KŐSZEGEATS ÉTLAP RENDEZÉSHEZ 
-- Csak ezt a két sort futtasd le a Supabase SQL Editor-ban!

ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE public.menu_categories ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- (A többi rész nem szükséges, mert a hiba azt jelezte, hogy a Realtime már be van kapcsolva)
