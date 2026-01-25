-- Add cuisine and tags columns for filtering
-- Run this in SQL Editor

ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS cuisine text, -- e.g. "Olasz", "Magyaros", "Török"
ADD COLUMN IF NOT EXISTS tags text[]; -- e.g. ["pizza", "burger", "leves"]

ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS tags text[]; -- e.g. ["csípős", "vega", "mentes"]

SELECT '✅ Cuisine and Tags columns added' as status;
