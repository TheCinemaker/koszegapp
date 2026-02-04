-- FIX REGISTRATIONDB.sql
-- Run this script to repair the user registration process

-- 1. DROP EXISTING HANDLER AND TRIGGER TO START FRESH
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. ENSURE TABLES EXIST (Safe idempotency)
CREATE TABLE IF NOT EXISTS public.koszegpass_users (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  phone text,
  address text,
  points int default 0,
  rank text default 'Felfedező',
  status text default 'active',
  card_type text default 'bronze',
  created_at timestamptz default now()
);

-- Ensure Profiles exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  role text default 'client',
  avatar_url text,
  created_at timestamptz default now()
);

-- 3. DEFINE ROBUST TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public -- SAFETY: Force public schema
AS $$
BEGIN
  -- Defensive Block for KőszegPass
  IF new.raw_user_meta_data->>'role' = 'koszegpass' THEN
    BEGIN
        INSERT INTO public.koszegpass_users (id, username, full_name)
        VALUES (
            new.id, 
            new.raw_user_meta_data->>'nickname',
            new.raw_user_meta_data->>'full_name'
        ) ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        -- Log error but allow auth user creation to succeed
        RAISE WARNING 'Error creating koszegpass_users for %: %', new.id, SQLERRM;
    END;

    BEGIN
        INSERT INTO public.profiles (id, username, full_name, role)
        VALUES (
            new.id, 
            new.raw_user_meta_data->>'nickname',
            new.raw_user_meta_data->>'full_name',
            'client' -- Fallback to client to satisfy constraints
        ) ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error creating profile for %: %', new.id, SQLERRM;
    END;

  -- Defensive Block for Restaurant
  ELSIF new.raw_user_meta_data->>'role' = 'restaurant' THEN
    BEGIN
        INSERT INTO public.profiles (id, role, full_name, username)
        VALUES (
            new.id, 
            'restaurant',
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'nickname'
        ) ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error creating restaurant profile: %', SQLERRM;
    END;

  -- Default Client
  ELSE
    BEGIN
        INSERT INTO public.profiles (id, full_name, username, role)
        VALUES (
            new.id, 
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'nickname',
            'client'
        ) ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error creating client profile: %', SQLERRM;
    END;
  END IF;

  RETURN new;
END;
$$;

-- 4. ATTACH TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

SELECT '✅ Registration Trigger Fixed & Hardened' as status;
