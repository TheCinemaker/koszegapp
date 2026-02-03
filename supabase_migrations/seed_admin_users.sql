-- SEED ADMIN USERS
-- Creates the authentication logins for the Admin system

-- Enable the pgcrypto extension to allow password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- FIX CONSTRAINT: Allow new admin roles in profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('client', 'admin', 'superadmin', 'editor', 'partner', 'restaurant', 'provider', 'koszegpass', 'var', 'tourinform'));

-- Helper function to create user if not exists
CREATE OR REPLACE FUNCTION create_admin_user(
    p_email text, 
    p_password text, 
    p_role text, 
    p_nickname text, 
    p_full_name text
) RETURNS void AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Check if user exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

    IF v_user_id IS NULL THEN
        -- Create User
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
            now(), -- Auto confirm
            jsonb_build_object('provider', 'email', 'providers', array['email']),
            jsonb_build_object('role', p_role, 'nickname', p_nickname, 'full_name', p_full_name),
            now(),
            now()
        ) RETURNING id INTO v_user_id;

        -- Create Identity (Supabase requirement sometimes)
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
            v_user_id::text, -- Use user_id as provider_id for email provider
            jsonb_build_object('sub', v_user_id, 'email', p_email),
            'email',
            now(),
            now(),
            now()
        );

        RAISE NOTICE 'Created user: %', p_email;
    ELSE
        -- Update password just in case (optional, but good for reset)
        UPDATE auth.users 
        SET encrypted_password = crypt(p_password, gen_salt('bf')) 
        WHERE id = v_user_id;
        
        RAISE NOTICE 'User already exists (password updated): %', p_email;
    END IF;

    -- Ensure Profile Exists (via Trigger or Manual)
    -- Trigger handled by handle_new_user, but we can be safe:
    INSERT INTO public.profiles (id, username, full_name, role)
    VALUES (v_user_id, p_nickname, p_full_name, p_role)
    ON CONFLICT (id) DO UPDATE SET role = p_role;

    -- Ensure Whitelist Entry Exists
    INSERT INTO public.admin_whitelist (username, role, description)
    VALUES (p_nickname, p_role, 'Seeded via script')
    ON CONFLICT (username) DO UPDATE SET role = p_role;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute Seed
-- 1. ADMIN (Superadmin)
SELECT create_admin_user('client.admin@koszeg.app', 'KoszegAdmin2024!', 'superadmin', 'admin', 'Rendszer Adminisztrátor');

-- 2. DEVTEAM (Superadmin)
SELECT create_admin_user('client.devteam@koszeg.app', 'DevTeamSecret123', 'superadmin', 'devteam', 'Fejlesztői Csapat');

-- 3. VAROS (Editor)
SELECT create_admin_user('client.varos@koszeg.app', 'VarosMarketing24', 'editor', 'varos', 'Városmarketing');

-- 4. KULSOS (Partner)
SELECT create_admin_user('client.kulsos@koszeg.app', 'PartnerUser123', 'partner', 'kulsos', 'Külsős Partner');


-- Clean up helper function
DROP FUNCTION create_admin_user;

SELECT '✅ Admin Users Seeded Successfully' as status;
