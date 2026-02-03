-- CLEAN AND SEED ADMIN USERS
-- Use this script to repair corrupted admin accounts by deleting and recreating them.

-- 1. Enable pgcrypto (Required for password hashing)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. FIX PROFILE CONSTRAINTS (Crucial for Superadmin role)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('client', 'admin', 'superadmin', 'editor', 'partner', 'restaurant', 'provider', 'koszegpass', 'var', 'tourinform'));

-- 3. CLEANUP: Delete specific admin users to start fresh
-- This removes any "half-created" users from previous failed attempts.
DELETE FROM auth.users WHERE email IN (
  'client.admin@koszeg.app', 
  'client.devteam@koszeg.app', 
  'client.varos@koszeg.app', 
  'client.kulsos@koszeg.app'
);

-- 4. HELPER FUNCTION
CREATE OR REPLACE FUNCTION create_admin_user_clean(
    p_email text, 
    p_password text, 
    p_role text, 
    p_nickname text, 
    p_full_name text
) RETURNS void AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Create User (We know it doesn't exist because we just deleted it)
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
        p_email,
        crypt(p_password, gen_salt('bf')), -- Hash password
        now(),
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        jsonb_build_object('role', p_role, 'nickname', p_nickname, 'full_name', p_full_name),
        now(),
        now()
    ) RETURNING id INTO v_user_id;

    -- Create Identity (CRITICAL: Previously missing this caused the 500 error)
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
        v_user_id::text, -- Provider ID matches User ID for email
        jsonb_build_object('sub', v_user_id, 'email', p_email),
        'email',
        now(),
        now(),
        now()
    );

    -- Create Profile
    INSERT INTO public.profiles (id, username, full_name, role)
    VALUES (v_user_id, p_nickname, p_full_name, p_role)
    ON CONFLICT (id) DO UPDATE SET role = p_role;

    -- Create Whitelist Entry
    INSERT INTO public.admin_whitelist (username, role, description)
    VALUES (p_nickname, p_role, 'Seeded via clean script')
    ON CONFLICT (username) DO UPDATE SET role = p_role;

    RAISE NOTICE '✅ Successfully recreated user: %', p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. EXECUTE CREATION
SELECT create_admin_user_clean('client.admin@koszeg.app', 'KoszegAdmin2024!', 'superadmin', 'admin', 'Rendszer Adminisztrátor');
SELECT create_admin_user_clean('client.devteam@koszeg.app', 'DevTeamSecret123', 'superadmin', 'devteam', 'Fejlesztői Csapat');
SELECT create_admin_user_clean('client.varos@koszeg.app', 'VarosMarketing24', 'editor', 'varos', 'Városmarketing');
SELECT create_admin_user_clean('client.kulsos@koszeg.app', 'PartnerUser123', 'partner', 'kulsos', 'Külsős Partner');

-- 6. CLEANUP
DROP FUNCTION create_admin_user_clean;

SELECT '✅ All Admin Users Repaired' as status;
