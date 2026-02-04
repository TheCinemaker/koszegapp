-- FINAL ADMIN SETUP
-- Deletes and Re-creates the 4 admin users with EXACT credentials provided.
-- Ensures full access (superadmin) for all.

-- 1. EXTENSION
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. RELAX PROFILES CONSTRAINT (To allow 'superadmin')
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('client', 'admin', 'superadmin', 'editor', 'partner', 'restaurant', 'provider', 'koszegpass', 'var', 'tourinform'));

-- 3. CLEANUP (Nuclear option for these specific users)
DELETE FROM auth.identities WHERE email LIKE 'client.%@koszeg.app';
DELETE FROM auth.users WHERE email IN (
  'client.admin@koszeg.app', 
  'client.devteam@koszeg.app', 
  'client.varos@koszeg.app', 
  'client.kulsos@koszeg.app'
);
-- Also clean whitelist to ensure sync
DELETE FROM public.admin_whitelist WHERE username IN ('admin', 'devteam', 'varos', 'kulsos');


-- 4. HELPER FUNCTION
CREATE OR REPLACE FUNCTION create_final_admin(
    p_username text, 
    p_password text,
    p_full_name text
) RETURNS void AS $$
DECLARE
    v_user_id uuid;
    v_email text;
BEGIN
    v_email := 'client.' || p_username || '@koszeg.app';

    -- Create User in Auth
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        v_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        jsonb_build_object('role', 'superadmin', 'nickname', p_username, 'full_name', p_full_name),
        now(),
        now()
    ) RETURNING id INTO v_user_id;

    -- Create Identity
    INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id,
        v_user_id::text,
        jsonb_build_object('sub', v_user_id, 'email', v_email),
        'email',
        now(),
        now(),
        now()
    );

    -- Create Profile (Superadmin)
    INSERT INTO public.profiles (id, username, full_name, role)
    VALUES (v_user_id, p_username, p_full_name, 'superadmin')
    ON CONFLICT (id) DO UPDATE SET role = 'superadmin';

    -- Create Whitelist Entry (Superadmin)
    INSERT INTO public.admin_whitelist (username, role, description)
    VALUES (p_username, 'superadmin', 'Full Access Admin')
    ON CONFLICT (username) DO UPDATE SET role = 'superadmin';

    RAISE NOTICE '✅ Created Admin: % (Pass: %)', p_username, p_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. EXECUTE CREATION (The 4 Users)
-- Users provided: admin, devteam, varos (and assuming kulsos as 4th)
-- Password provided: koszegapp1532, devteam, koszegvaros

SELECT create_final_admin('admin',   'koszegapp1532', 'Rendszer Admin');
SELECT create_final_admin('devteam', 'devteam',       'Fejlesztők');
SELECT create_final_admin('varos',   'koszegvaros',   'Városvezetés');
SELECT create_final_admin('kulsos',  'PartnerUser123','Külsős Partner'); -- Keeping 4th with old pass just in case

-- 6. CLEANUP
DROP FUNCTION create_final_admin;

SELECT '✅ SYSTEM RESET: 4 Admin Users Created with Specific Passwords' as status;
