-- ==========================================
-- FIX AUTH PERSISTENCE (CITYPASS & FOOD)
-- ==========================================
-- This script ensures that when you register/login:
-- 1. The 'profiles' table exists (needed for global login check).
-- 2. The 'koszegpass_users' table exists.
-- 3. The TRIGGER exists so new users affect both tables.
-- ==========================================

-- 1. ENSURE PROFILES TABLE EXISTS
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  role text default 'client',
  avatar_url text,
  created_at timestamptz default now()
);
-- Allow 'koszegpass' role in constraints if check exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('client', 'provider', 'restaurant', 'admin', 'partner', 'var', 'varos', 'tourinform', 'koszegpass'));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Profiles View" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Self Profile Update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Self Profile Insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. ENSURE KOSZEGPASS USERS TABLE EXISTS
CREATE TABLE IF NOT EXISTS public.koszegpass_users (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  phone text,
  address text,
  points int default 0,
  rank text default 'Felfedező',
  created_at timestamptz default now()
);
ALTER TABLE public.koszegpass_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Self KoszegPass View" ON public.koszegpass_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Self KoszegPass Update" ON public.koszegpass_users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Self KoszegPass Insert" ON public.koszegpass_users FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. RECREATE THE TRIGGER (The Brain of Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- If KőszegPass User
  IF new.raw_user_meta_data->>'role' = 'koszegpass' THEN
    -- Insert into KőszegPass (if not exists)
    INSERT INTO public.koszegpass_users (id, username, full_name)
    VALUES (
      new.id, 
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'full_name'
    ) ON CONFLICT DO NOTHING;

    -- Insert into Profiles (Unified Login)
    INSERT INTO public.profiles (id, username, full_name, role)
    VALUES (
      new.id, 
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'full_name',
      'koszegpass' -- Explicitly mark as koszegpass for role checks
    ) ON CONFLICT DO NOTHING;

  -- If Restaurant Owner
  ELSIF new.raw_user_meta_data->>'role' = 'restaurant' THEN
    INSERT INTO public.profiles (id, role, full_name, username)
    VALUES (
      new.id, 
      'restaurant',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nickname'
    ) ON CONFLICT DO NOTHING;

  -- Default Client
  ELSE
    INSERT INTO public.profiles (id, full_name, username, role)
    VALUES (
      new.id, 
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nickname',
      'client'
    ) ON CONFLICT DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ATTACH TRIGGER (Drop first to avoid duplicates)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

SELECT 'AUTH PERSISTENCE FIXED' as status;
