-- FIX PERMISSIONS AND LINK USERS
-- Resolves "Database error querying schema" (500) and links Dashboard users to App.

-- 1. FIX SCHEMA PERMISSIONS (This fixes the 500 Error)
-- Previous scripts might have messed up access grants. We restore them here.
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- 2. ENABLE EXTENSION (Required)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. ENSURE PROFILE ROLES ARE ALLOWED
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('client', 'admin', 'superadmin', 'editor', 'partner', 'restaurant', 'provider', 'koszegpass', 'var', 'tourinform'));

-- 4. LINKING LOGIC (Connects your Dashboard Users to the App Tables)
-- Does NOT touch auth.users.
CREATE OR REPLACE FUNCTION link_dashboard_users_final(
    p_email text, 
    p_nickname text, 
    p_full_name text
) RETURNS void AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Read ID from auth.users (ReadOnly)
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

    IF v_user_id IS NOT NULL THEN
        -- Link Profile
        INSERT INTO public.profiles (id, username, full_name, role)
        VALUES (v_user_id, p_nickname, p_full_name, 'superadmin')
        ON CONFLICT (id) DO UPDATE SET role = 'superadmin';

        -- Link Whitelist
        INSERT INTO public.admin_whitelist (username, role, description)
        VALUES (p_nickname, 'superadmin', 'Linked Verified User')
        ON CONFLICT (username) DO UPDATE SET role = 'superadmin';

        RAISE NOTICE '✅ Linked: %', p_email;
    ELSE
        RAISE NOTICE '⚠️ User not found in Auth: % (Skipping)', p_email;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. EXECUTE LINKING (For the 4 specific users in your screenshot)
SELECT link_dashboard_users_final('client.admin@koszeg.app',   'admin',   'Rendszer Admin');
SELECT link_dashboard_users_final('client.devteam@koszeg.app', 'devteam', 'Fejlesztői Csapat');
SELECT link_dashboard_users_final('client.varos@koszeg.app',   'varos',   'Városvezetők');
SELECT link_dashboard_users_final('client.kulsos@koszeg.app',  'kulsos',  'Külsős Partner');

-- 6. CLEANUP
DROP FUNCTION link_dashboard_users_final;

SELECT '✅ Permissions Restored & Users Linked' as status;
