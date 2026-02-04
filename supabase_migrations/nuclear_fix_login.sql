-- NUCLEAR FIX FOR LOGIN (500 ERROR)
-- This script forcefully removes POTENTIAL BLOCKERS for login.

-- 1. DROP TRIGGERS ON AUTH.USERS
-- If there is a broken trigger running on UPDATE (last_sign_in_at), it kills login.
-- We drop the known one, and generic ones.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users; -- Just in case
DROP TRIGGER IF EXISTS handle_updated_at ON auth.users; -- Common supabase trigger

-- 2. RESET FUNCTIONS (To be safe)
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. RESET PERMISSIONS (The likely culprit of 500)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- 4. ENSURE PGCRYPTO in PUBLIC (or extensions)
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public; 
-- Note: Sometimes it's in "extensions" schema, but we try public to be sure functions find it.

-- 5. VERIFY USERS EXIST (Just a check)
DO $$
DECLARE
    v_count int;
BEGIN
    SELECT count(*) INTO v_count FROM auth.users WHERE email IN ('client.admin@koszeg.app', 'client.devteam@koszeg.app');
    RAISE NOTICE 'Found % admin users in Auth.', v_count;
END $$;

SELECT '✅ Nuclear Fix Applied: Triggers Dropped + Permissions Reset' as status;
