-- LINK DASHBOARD USERS (THE CORRECT WAY)
-- Futtasd ezt a scriptet MIUTÁN létrehoztad a felhasználókat a Supabase Dashboard-on!
-- Ez a script NEM nyúl az auth.users táblához, csak a profilokat és a whitelistet állítja be.

-- 1. Segédfunkció az összekapcsoláshoz (Idempotens)
CREATE OR REPLACE FUNCTION link_admin_user(
    p_email text, 
    p_nickname text, 
    p_full_name text, 
    p_role text
) RETURNS void AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Megkeressük a Dashboard-on létrehozott user ID-ját email alapján (READ ONLY)
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

    IF v_user_id IS NULL THEN
        RAISE WARNING 'User not found: %. Kérlek hozd létre előbb a Dashboard-on!', p_email;
    ELSE
        -- 1. Profil frissítése/létrehozása (hogy a role 'superadmin' legyen)
        INSERT INTO public.profiles (id, username, full_name, role)
        VALUES (v_user_id, p_nickname, p_full_name, p_role)
        ON CONFLICT (id) DO UPDATE 
        SET role = p_role, full_name = p_full_name, username = p_nickname;

        -- 2. Whitelist frissítése/létrehozása
        INSERT INTO public.admin_whitelist (username, role, description)
        VALUES (p_nickname, p_role, 'Linked from Dashboard')
        ON CONFLICT (username) DO UPDATE SET role = p_role;

        RAISE NOTICE '✅ Linked user: % (ID: %)', p_email, v_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Összekapcsolás futtatása (A megadott email címek alapján)
SELECT link_admin_user('client.admin@koszeg.app',   'admin',   'Rendszer Admin',    'superadmin');
SELECT link_admin_user('client.devteam@koszeg.app', 'devteam', 'Fejlesztői Csapat', 'superadmin');
SELECT link_admin_user('client.varos@koszeg.app',   'varos',   'Városmarketing',    'superadmin');
SELECT link_admin_user('client.kulsos@koszeg.app',  'kulsos',  'Külsős Partner',    'superadmin');

-- 3. Takarítás
DROP FUNCTION link_admin_user;
