-- EMERGENCY DB FIX
-- Resolves "Database error querying schema" (500) and login failures.

-- 1. RESET SCHEMA PERMISSIONS (Crucial for 500 Errors)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- 2. ENSURE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. RELAX PROFILE CONSTRAINTS
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('client', 'admin', 'superadmin', 'editor', 'partner', 'restaurant', 'provider', 'koszegpass', 'var', 'tourinform'));

-- 4. ENSURE ADMIN USER EXISTS (Upsert Safe Mode)
DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'client.admin@koszeg.app';
    v_pass text := 'koszegapp1532';
BEGIN
    -- A) Get or Create User ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', v_email,
            crypt(v_pass, gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}',
            '{"role":"superadmin","nickname":"admin","full_name":"Rendszer Admin"}',
            now(), now()
        ) RETURNING id INTO v_user_id;
    ELSE
        -- Update Password if exists
        UPDATE auth.users 
        SET encrypted_password = crypt(v_pass, gen_salt('bf')),
            updated_at = now()
        WHERE id = v_user_id;
    END IF;

    -- B) Fix Identity
    DELETE FROM auth.identities WHERE user_id = v_user_id; -- Clean slate
    INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), v_user_id, v_user_id::text,
        jsonb_build_object('sub', v_user_id, 'email', v_email),
        'email', now(), now(), now()
    );

    -- C) Fix Profile
    INSERT INTO public.profiles (id, username, full_name, role)
    VALUES (v_user_id, 'admin', 'Rendszer Admin', 'superadmin')
    ON CONFLICT (id) DO UPDATE SET role = 'superadmin';

    -- D) Fix Whitelist
    INSERT INTO public.admin_whitelist (username, role, description)
    VALUES ('admin', 'superadmin', 'System Admin')
    ON CONFLICT (username) DO UPDATE SET role = 'superadmin';

END $$;

-- 5. REPEAT FOR OTHER USERS (Simplified)
-- DevTeam
DO $$
DECLARE v_user_id uuid; v_email text := 'client.devteam@koszeg.app';
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    IF v_user_id IS NULL THEN
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) 
        VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', v_email, crypt('devteam', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"superadmin","nickname":"devteam","full_name":"Dev Team"}', now(), now()) RETURNING id INTO v_user_id;
    ELSE UPDATE auth.users SET encrypted_password = crypt('devteam', gen_salt('bf')) WHERE id = v_user_id; END IF;
    DELETE FROM auth.identities WHERE user_id = v_user_id;
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at) VALUES (gen_random_uuid(), v_user_id, v_user_id::text, jsonb_build_object('sub', v_user_id, 'email', v_email), 'email', now(), now());
    INSERT INTO public.profiles (id, username, full_name, role) VALUES (v_user_id, 'devteam', 'Dev Team', 'superadmin') ON CONFLICT (id) DO UPDATE SET role = 'superadmin';
    INSERT INTO public.admin_whitelist (username, role, description) VALUES ('devteam', 'superadmin', 'Dev Team') ON CONFLICT (username) DO UPDATE SET role = 'superadmin';
END $$;

-- Varos
DO $$
DECLARE v_user_id uuid; v_email text := 'client.varos@koszeg.app';
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    IF v_user_id IS NULL THEN
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) 
        VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', v_email, crypt('koszegvaros', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"superadmin","nickname":"varos","full_name":"Varosvezetes"}', now(), now()) RETURNING id INTO v_user_id;
    ELSE UPDATE auth.users SET encrypted_password = crypt('koszegvaros', gen_salt('bf')) WHERE id = v_user_id; END IF;
    DELETE FROM auth.identities WHERE user_id = v_user_id;
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at) VALUES (gen_random_uuid(), v_user_id, v_user_id::text, jsonb_build_object('sub', v_user_id, 'email', v_email), 'email', now(), now());
    INSERT INTO public.profiles (id, username, full_name, role) VALUES (v_user_id, 'varos', 'Varosvezetes', 'superadmin') ON CONFLICT (id) DO UPDATE SET role = 'superadmin';
    INSERT INTO public.admin_whitelist (username, role, description) VALUES ('varos', 'superadmin', 'Varos') ON CONFLICT (username) DO UPDATE SET role = 'superadmin';
END $$;

SELECT '✅ Emergency Fix Complete: Permissions Reset + Admin Users Verified' as status;
