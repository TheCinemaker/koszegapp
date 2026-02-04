-- MASTER SAFE FIX
-- Egyesíti a fő alkalmazás védelmét és az admin belépés javítását.
-- 1. lépés: Jogosultságok helyreállítása (Admin belépéshez - 500 hiba ellen)
-- 2. lépés: Regisztrációs trigger biztosítása (Fő alkalmazáshoz)
-- 3. lépés: Admin felhasználók összekötése (Dashboard -> App)

--------------------------------------------------------------------------------
-- 1. JOGOSULTSÁGOK (FIX 500 ERROR)
--------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- Extension biztosítása
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public;

-- Szerepkörök engedélyezése a profilban
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('client', 'admin', 'superadmin', 'editor', 'partner', 'restaurant', 'provider', 'koszegpass', 'var', 'tourinform'));

--------------------------------------------------------------------------------
-- 2. FŐ ALKALMAZÁS VÉDELME (TRIGGER RESTORE)
--------------------------------------------------------------------------------
-- Visszabiztosítjuk a regisztrációs logikát, hogy a "sima" userek ne sérüljenek.

-- Először takarítunk, hogy tiszta legyen
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Újradefiniáljuk a biztonságos triggert
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- KőszegPass logika
  IF new.raw_user_meta_data->>'role' = 'koszegpass' THEN
    INSERT INTO public.koszegpass_users (id, username, full_name)
    VALUES (new.id, new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'full_name')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.profiles (id, username, full_name, role)
    VALUES (new.id, new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'full_name', 'client')
    ON CONFLICT DO NOTHING;

  -- Restaurant logika
  ELSIF new.raw_user_meta_data->>'role' = 'restaurant' THEN
    INSERT INTO public.profiles (id, role, full_name, username)
    VALUES (new.id, 'restaurant', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'nickname')
    ON CONFLICT DO NOTHING;

  -- Default Client logika
  ELSE
    INSERT INTO public.profiles (id, full_name, username, role)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'nickname', 'client')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Ha hiba van, logoljuk, de NE állítsuk meg a folyamatot (fontos!)
  RAISE WARNING 'Trigger hiba: %', SQLERRM;
  RETURN new;
END;
$$;

-- Trigger újraaktiválása (CSAK INSERT-re, hogy a login UPDATE-et ne zavarja!)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


--------------------------------------------------------------------------------
-- 3. ADMIN FELHASZNÁLÓK ÖSSZEKÖTÉSE (LINKING)
--------------------------------------------------------------------------------
-- A Dashboard-on lévő userek összekötése a profil táblával.

CREATE OR REPLACE FUNCTION link_dashboard_users_master(
    p_email text, 
    p_nickname text, 
    p_full_name text
) RETURNS void AS $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

    IF v_user_id IS NOT NULL THEN
        -- Profil update/insert
        INSERT INTO public.profiles (id, username, full_name, role)
        VALUES (v_user_id, p_nickname, p_full_name, 'superadmin')
        ON CONFLICT (id) DO UPDATE SET role = 'superadmin';

        -- Whitelist update/insert
        INSERT INTO public.admin_whitelist (username, role, description)
        VALUES (p_nickname, 'superadmin', 'Linked via Master Script')
        ON CONFLICT (username) DO UPDATE SET role = 'superadmin';

        RAISE NOTICE '✅ Linked: %', p_email;
    ELSE
        RAISE NOTICE '⚠️ User missing in Auth (create on dashboard first): %', p_email;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Futtatás a 4 felhasználóra
SELECT link_dashboard_users_master('client.admin@koszeg.app',   'admin',   'Rendszer Admin');
SELECT link_dashboard_users_master('client.devteam@koszeg.app', 'devteam', 'Fejlesztői Csapat');
SELECT link_dashboard_users_master('client.varos@koszeg.app',   'varos',   'Városvezetők');
SELECT link_dashboard_users_master('client.kulsos@koszeg.app',  'kulsos',  'Külsős Partner');

DROP FUNCTION link_dashboard_users_master;

SELECT '✅ MASTER FIX COMPLETE: Permissions OK, Main App Trigger OK, Admins Linked' as status;
