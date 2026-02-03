-- REPAIR ADMIN USERS (UPSERT STRATEGY)
-- Fixes admin accounts by updating them if they exist, or creating them if they don't.
-- Preserves existing Foreign Keys (Orders, etc.)

-- 1. Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. RELAX PROFILE CONSTRAINTS (Ensure this is applied)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('client', 'admin', 'superadmin', 'editor', 'partner', 'restaurant', 'provider', 'koszegpass', 'var', 'tourinform'));

-- 3. HELPER FUNCTION: upsert_admin_user
CREATE OR REPLACE FUNCTION upsert_admin_user(
    p_email text, 
    p_password text, 
    p_role text, 
    p_nickname text, 
    p_full_name text
) RETURNS void AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- A) UPSERT AUTH USER
    -- Check for existing user by email
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

    IF v_user_id IS NOT NULL THEN
        -- UPDATE EXISTING
        UPDATE auth.users
        SET 
            encrypted_password = crypt(p_password, gen_salt('bf')),
            raw_user_meta_data = jsonb_build_object('role', p_role, 'nickname', p_nickname, 'full_name', p_full_name),
            updated_at = now()
        WHERE id = v_user_id;
        
        RAISE NOTICE 'Updated existing user: %', p_email;
    ELSE
        -- INSERT NEW
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
            crypt(p_password, gen_salt('bf')),
            now(),
            jsonb_build_object('provider', 'email', 'providers', array['email']),
            jsonb_build_object('role', p_role, 'nickname', p_nickname, 'full_name', p_full_name),
            now(),
            now()
        ) RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'Created new user: %', p_email;
    END IF;

    -- B) UPSERT IDENTITY
    -- Check if identity exists for this user_id and provider 'email'
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id AND provider = 'email') THEN
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
            jsonb_build_object('sub', v_user_id, 'email', p_email),
            'email',
            now(),
            now(),
            now()
        );
        RAISE NOTICE 'Inserted missing identity for: %', p_email;
    END IF;

    -- C) UPSERT PROFILE
    -- Profile creation often handled by trigger, but we enforce it here for admin consistency
    INSERT INTO public.profiles (id, username, full_name, role)
    VALUES (v_user_id, p_nickname, p_full_name, p_role)
    ON CONFLICT (id) DO UPDATE 
    SET role = p_role, full_name = p_full_name, username = p_nickname;

    -- D) UPSERT WHITELIST
    INSERT INTO public.admin_whitelist (username, role, description)
    VALUES (p_nickname, p_role, 'Repaired via script')
    ON CONFLICT (username) DO UPDATE SET role = p_role;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. EXECUTE REPAIR
SELECT upsert_admin_user('client.admin@koszeg.app', 'KoszegAdmin2024!', 'superadmin', 'admin', 'Rendszer Adminisztrátor');
SELECT upsert_admin_user('client.devteam@koszeg.app', 'DevTeamSecret123', 'superadmin', 'devteam', 'Fejlesztői Csapat');
SELECT upsert_admin_user('client.varos@koszeg.app', 'VarosMarketing24', 'editor', 'varos', 'Városmarketing');
SELECT upsert_admin_user('client.kulsos@koszeg.app', 'PartnerUser123', 'partner', 'kulsos', 'Külsős Partner');

-- 5. CLEANUP
DROP FUNCTION upsert_admin_user;

SELECT '✅ Admin Users Repaired & Updated' as status;
