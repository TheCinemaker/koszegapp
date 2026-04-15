-- KőszegEATS Digitális Étlap & QR Platform Inicializálás

-- 1. Tábla létrehozása
CREATE TABLE IF NOT EXISTS public.qr_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active', -- active, payment_requested, cleared
    payment_method TEXT, -- cash, card, szep, none
    total_price INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexek a gyors kereséshez
CREATE INDEX IF NOT EXISTS idx_qr_orders_restaurant ON public.qr_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_qr_orders_table ON public.qr_orders(table_number);
CREATE INDEX IF NOT EXISTS idx_qr_orders_status ON public.qr_orders(status);

-- 3. RLS (Row Level Security) - Engedélyezzük az anonim olvasást/írást (QR platform lényege)
ALTER TABLE public.qr_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read check for active tables" ON public.qr_orders
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert for table orders" ON public.qr_orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update for table orders" ON public.qr_orders
    FOR UPDATE USING (true);

-- 4. Realtime bekapcsolása (Ha már be van kapcsolva a publikáció, ez hiba lehet, de ha nincs, kell)
-- DO $$ BEGIN
--   IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'qr_orders') THEN
--     ALTER PUBLICATION supabase_realtime ADD TABLE public.qr_orders;
--   END IF;
-- END $$;

-- 5. Funkció az updated_at frissítéséhez
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_qr_orders_modtime
    BEFORE UPDATE ON public.qr_orders
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
