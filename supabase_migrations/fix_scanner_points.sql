-- FIX SCANNER POINTS
-- A "nuclear" takarítás miatt előfordulhat, hogy a szkenner (backend) elvesztette az írási jogát a pontok táblára.
-- Ez a script visszaadja ezeket a jogokat.

-- 1. Biztosítjuk a jogokat a Service Role számára (Backend használja)
GRANT ALL ON TABLE public.koszegpass_users TO service_role, postgres;
GRANT ALL ON TABLE public.koszegpass_points_log TO service_role, postgres;
GRANT ALL ON TABLE public.koszegpass_cards TO service_role, postgres;

-- 2. Biztosítjuk a szekvenciák (ID generálás) használatát is
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role, postgres;


-- 3. (OPCIONÁLIS) Ha a backend véletlenül "anon" módban futna (környezeti változó hiba miatt)
-- Ideiglenesen engedélyezzük, amíg kiderül.
-- FIGYELEM: Productionben ezt szigorítani kell, de most a működés a cél.
GRANT SELECT, INSERT, UPDATE ON TABLE public.koszegpass_users TO anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.koszegpass_points_log TO anon, authenticated;

-- 4. RLS Policy javítás (Ha az RLS be van kapcsolva, kell policy is)
ALTER TABLE public.koszegpass_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.koszegpass_points_log ENABLE ROW LEVEL SECURITY;

-- Service Role mindent vihet (Bypass RLS) - ez alapból így van, de biztosra megyünk:
-- (A Supabase Service Role alapból bypass-olja az RLS-t, így ide nem kell külön policy neki)

-- De ha ANON-t használ a rendszer, akkor kell policy:
CREATE POLICY "Scanner Update Users" ON public.koszegpass_users
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Scanner Insert Log" ON public.koszegpass_points_log
FOR INSERT WITH CHECK (true);

SELECT '✅ Scanner permissions restored (Service + Fallback Policies)' as status;
