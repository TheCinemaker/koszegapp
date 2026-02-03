-- RESTORE DATABASE HEALTH (CLEAN SQL)
-- Ez a script "kitakarítja" a zavaró tényezőket az adatbázisból, hogy a belépés működjön.

--------------------------------------------------------------------------------
-- 1. TRIGGEREK TÖRLÉSE (Ezek okozzák a legtöbb 500-as hibát belépéskor)
--------------------------------------------------------------------------------
-- Töröljük a "regisztrációs" automatizmust, ami elhasalhat.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

--------------------------------------------------------------------------------
-- 2. JOGOSULTSÁGOK HELYREÁLLÍTÁSA (Standard Supabase beállítások)
--------------------------------------------------------------------------------
-- Biztosítjuk, hogy a rendszer hozzáférjen a public sémához.
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

--------------------------------------------------------------------------------
-- 3. BIZTONSÁGI KIEGÉSZÍTŐK (Extension)
--------------------------------------------------------------------------------
-- Kell a jelszókezeléshez és ID generáláshoz.
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public;

--------------------------------------------------------------------------------
-- 4. PROFIL STABILIZÁLÁS
--------------------------------------------------------------------------------
-- Megengedjük a 'superadmin' és egyéb role-okat, nehogy ez blokkoljon.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('client', 'admin', 'superadmin', 'editor', 'partner', 'restaurant', 'provider', 'koszegpass', 'var', 'tourinform'));

SELECT '✅ TISZTA LAP: Triggerek törölve, Jogosultságok visszaállítva.' as status;
