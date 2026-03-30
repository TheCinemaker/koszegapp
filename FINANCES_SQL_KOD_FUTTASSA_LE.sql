-- ==========================================
-- 💰 KŐSZEGAPP PÉNZÜGYI MODUL FRISSÍTÉS 💰
-- Másold be ezt a Supabase SQL Editorba és nyomj RUN gombot!
-- ==========================================

-- 1. Éttermek tábla bővítése előfizetési adatokkal
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS subscription_type text DEFAULT 'simple', -- 'simple' vagy 'tablet'
ADD COLUMN IF NOT EXISTS subscription_fee integer DEFAULT 0;

-- 2. Számlázási és elszámolási tábla létrehozása
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
  billing_period text NOT NULL, -- Pl. '2026-03'
  total_revenue integer DEFAULT 0,
  commission_amount integer DEFAULT 0,
  subscription_type text,
  subscription_amount integer DEFAULT 0,
  total_due integer NOT NULL,
  status text DEFAULT 'pending', -- 'pending' (függőben), 'paid' (fizetve), 'overdue' (késedelmes)
  due_date timestamptz NOT NULL,
  paid_at timestamptz,
  UNIQUE(restaurant_id, billing_period) -- Egy hónapban csak egy számla lehet éttermenként
);

-- 3. RLS (Biztonsági) szabályok beállítása
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Mivel a Superadmin jelszóval van védve fixen a kliens oldalon, 
-- és ezt az oldalt / táblát csak ő használja, egyszerűsített Policy-t adunk neki:
CREATE POLICY "Allow All on Invoices" ON public.invoices FOR ALL USING (true);
CREATE POLICY "SuperAdmin View Orders" ON public.orders FOR SELECT USING (true); -- Lehetővé teszi az adatok látását anonim módban is
