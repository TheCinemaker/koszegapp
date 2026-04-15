-- ============================================================
-- QR Platform v3 - TELJES IZOLÁCIÓ
-- Saját qr_restaurants tábla, semmi köze az EATS-hez
-- ============================================================

-- ── Régi struktúra takarítása ─────────────────────────────
DROP TABLE IF EXISTS public.qr_orders CASCADE;
DROP TABLE IF EXISTS public.qr_menu_items CASCADE;
DROP TABLE IF EXISTS public.qr_menu_categories CASCADE;
DROP TABLE IF EXISTS public.qr_restaurants CASCADE;

-- ── 1. QR Éttermek (saját tábla, semmi köze a restaurants-hoz) ──
CREATE TABLE IF NOT EXISTS public.qr_restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    subscription_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. QR Étlap Kategóriák ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.qr_menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_restaurant_id UUID NOT NULL REFERENCES public.qr_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '🍽️',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 3. QR Étlap Ételek ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.qr_menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_restaurant_id UUID NOT NULL REFERENCES public.qr_restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.qr_menu_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    allergens TEXT[],
    is_available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 4. QR Asztali Rendelések ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.qr_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_restaurant_id UUID NOT NULL REFERENCES public.qr_restaurants(id) ON DELETE CASCADE,
    table_id TEXT NOT NULL,
    session_token TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_price INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'payment_requested', 'paid', 'cancelled')),
    waiter_called BOOLEAN DEFAULT false,
    waiter_called_at TIMESTAMPTZ,
    payment_requested_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 5. Indexek ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_qr_restaurants_owner ON public.qr_restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_qr_categories_restaurant ON public.qr_menu_categories(qr_restaurant_id);
CREATE INDEX IF NOT EXISTS idx_qr_items_restaurant ON public.qr_menu_items(qr_restaurant_id);
CREATE INDEX IF NOT EXISTS idx_qr_items_category ON public.qr_menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_qr_orders_restaurant ON public.qr_orders(qr_restaurant_id);
CREATE INDEX IF NOT EXISTS idx_qr_orders_table ON public.qr_orders(qr_restaurant_id, table_id);
CREATE INDEX IF NOT EXISTS idx_qr_orders_token ON public.qr_orders(session_token);

-- ── 6. RLS ────────────────────────────────────────────────
ALTER TABLE public.qr_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_orders ENABLE ROW LEVEL SECURITY;

-- qr_restaurants: mindenki olvashat (vendégek látják az éttermeket), csak tulajdonos módosíthat
CREATE POLICY "qr_restaurants_public_read" ON public.qr_restaurants FOR SELECT USING (true);
CREATE POLICY "qr_restaurants_owner_insert" ON public.qr_restaurants FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "qr_restaurants_owner_update" ON public.qr_restaurants FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "qr_restaurants_owner_delete" ON public.qr_restaurants FOR DELETE USING (auth.uid() = owner_id);

-- qr_menu_categories: mindenki olvashat (vendégnek kell), tulajdonos módosíthat
CREATE POLICY "qr_categories_public_read" ON public.qr_menu_categories FOR SELECT USING (is_active = true);
CREATE POLICY "qr_categories_owner_all" ON public.qr_menu_categories FOR ALL
    USING (qr_restaurant_id IN (SELECT id FROM public.qr_restaurants WHERE owner_id = auth.uid()));

-- qr_menu_items: mindenki olvashat, tulajdonos módosíthat
CREATE POLICY "qr_items_public_read" ON public.qr_menu_items FOR SELECT USING (is_available = true);
CREATE POLICY "qr_items_owner_all" ON public.qr_menu_items FOR ALL
    USING (qr_restaurant_id IN (SELECT id FROM public.qr_restaurants WHERE owner_id = auth.uid()));

-- qr_orders: teljes anonimotás (vendégek rendelnek QR kóddal)
CREATE POLICY "qr_orders_public_select" ON public.qr_orders FOR SELECT USING (true);
CREATE POLICY "qr_orders_public_insert" ON public.qr_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "qr_orders_public_update" ON public.qr_orders FOR UPDATE USING (true);

-- ── 7. updated_at trigger ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_qr_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_qr_orders_updated_at ON public.qr_orders;
CREATE TRIGGER trg_qr_orders_updated_at
    BEFORE UPDATE ON public.qr_orders
    FOR EACH ROW EXECUTE PROCEDURE update_qr_orders_updated_at();

-- ── 8. Realtime ───────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'qr_orders') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.qr_orders;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'qr_menu_items') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.qr_menu_items;
    END IF;
END $$;
