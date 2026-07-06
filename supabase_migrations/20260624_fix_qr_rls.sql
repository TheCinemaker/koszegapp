-- Módosítjuk az RLS Select szabályokat, hogy a vendégek (anon) minden sort láthassanak.
-- Ez elengedhetetlen ahhoz, hogy a Supabase Realtime megkapja az UPDATE eseményeket
-- amikor egy tétel elérhetősége is_available = true-ról false-ra (vagy vissza) változik.
-- A tényleges szűrést a JS kód végzi el az étlap lekérésekor (.eq('is_available', true)).

-- 1. qr_menu_categories RLS módosítás
DROP POLICY IF EXISTS "qr_categories_public_read" ON public.qr_menu_categories;
CREATE POLICY "qr_categories_public_read" ON public.qr_menu_categories
    FOR SELECT USING (true);

-- 2. qr_menu_items RLS módosítás
DROP POLICY IF EXISTS "qr_items_public_read" ON public.qr_menu_items;
CREATE POLICY "qr_items_public_read" ON public.qr_menu_items
    FOR SELECT USING (true);

-- 3. Replica Identity FULL beállítása, hogy a Realtime szűrni tudjon nem-elsődleges kulcsok alapján (qr_restaurant_id)
ALTER TABLE public.qr_menu_items REPLICA IDENTITY FULL;
ALTER TABLE public.qr_menu_categories REPLICA IDENTITY FULL;
