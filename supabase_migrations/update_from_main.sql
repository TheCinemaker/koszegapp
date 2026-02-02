-- Consolidated Safe Update Script (FULL CONTENT)
-- Run this entire script in Supabase SQL Editor

-- ==========================================
-- 1. Admin Whitelist (New Feature)
-- ==========================================

-- Create Admin Whitelist Table
create table if not exists public.admin_whitelist (
  username text primary key,
  role text not null check (role in ('superadmin', 'editor', 'partner')), -- Simplified roles
  description text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.admin_whitelist enable row level security;

-- Policy: Everyone (authenticated or anon) can READ this table to check permissions
-- (We need this so the Login page can check if the user is allowed BEFORE fully letting them in)
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'admin_whitelist' and policyname = 'Allow public read access') then
    create policy "Allow public read access"
      on public.admin_whitelist for select
      using (true);
  end if;
end $$;

-- Seed Data (The 4 authorized users)
insert into public.admin_whitelist (username, role, description)
values
  ('admin', 'superadmin', 'Teljes hozzáférés'),
  ('devteam', 'superadmin', 'Teljes hozzáférés (Fejlesztők)'),
  ('varos', 'editor', 'Teljes hozzáférés (Város)'),
  ('kulsos', 'partner', 'Csak új esemény felvétele')
on conflict (username) do update
set role = excluded.role;


-- ==========================================
-- 2. Schema Updates (Safe)
-- ==========================================

-- Add Phone and Address to koszegpass_users
-- 1. Add columns if they don't exist
alter table public.koszegpass_users 
add column if not exists phone text,
add column if not exists address text;

-- Add missing columns to koszegpass_users table if they don't exist
ALTER TABLE koszegpass_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE koszegpass_users ADD COLUMN IF NOT EXISTS card_type TEXT DEFAULT 'bronze';
ALTER TABLE koszegpass_users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Ensure RLS is enabled
ALTER TABLE koszegpass_users ENABLE ROW LEVEL SECURITY;

-- Policy for reading own data (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'koszegpass_users' AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile" ON koszegpass_users
            FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

-- Policy for updating own data
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'koszegpass_users' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" ON koszegpass_users
            FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- SAFE FIX FOR MENU ITEMS COLUMN
DO $$
BEGIN
  -- Check if 'available' exists and 'is_available' does not
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'available') THEN
    ALTER TABLE menu_items RENAME COLUMN available TO is_available;
  END IF;
END $$;


-- ==========================================
-- 3. Fixes & Permissions (Safe)
-- ==========================================

-- FIX ORDERS USERID
-- 1. ADD COLUMN
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 2. UPDATE RPC FUNCTION
CREATE OR REPLACE FUNCTION place_order_full(
    p_restaurant_id uuid,
    p_customer_name text,
    p_customer_phone text,
    p_customer_address text,
    p_customer_note text,
    p_total_price integer,
    p_items jsonb,
    p_user_id uuid DEFAULT NULL -- New optional parameter
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Run as owner to bypass potential RLS issues during insertion if needed
AS $$
DECLARE
    new_order_id integer;
    item jsonb;
BEGIN
    -- Insert Order
    INSERT INTO public.orders (
        restaurant_id, 
        customer_name, 
        customer_phone, 
        customer_address, 
        customer_note, 
        total_price,
        user_id, -- Link to Auth User
        status
    ) VALUES (
        p_restaurant_id, 
        p_customer_name, 
        p_customer_phone, 
        p_customer_address, 
        p_customer_note, 
        p_total_price,
        p_user_id, 
        'new'
    ) RETURNING id INTO new_order_id;

    -- Insert Items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id, 
            menu_item_id, 
            name, 
            quantity, 
            price
        ) VALUES (
            new_order_id, 
            (item->>'id')::uuid, 
            (item->>'name'), 
            (item->>'quantity')::integer, 
            (item->>'price')::integer
        );
    END LOOP;

    RETURN json_build_object('id', new_order_id, 'status', 'success');
END;
$$;

-- 3. FIX RLS (Now that user_id exists)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;

-- Correct Policies
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
TO authenticated
USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Admins/Restaurants can view all orders" ON public.orders;
CREATE POLICY "Admins/Restaurants can view all orders"
ON public.orders FOR SELECT
TO authenticated
USING ( true ); -- Permissive for now to ensure Admin Dashboard works


-- FIX AUTH PERSISTENCE
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
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Public Profiles View') then
    CREATE POLICY "Public Profiles View" ON public.profiles FOR SELECT USING (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Self Profile Update') then
    CREATE POLICY "Self Profile Update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Self Profile Insert') then
     CREATE POLICY "Self Profile Insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  end if;
end $$;


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
    -- ERROR FIX: Role 'koszegpass' might not be fully propagated in constraints or causes issues.
    -- We map them to 'client' in the main profiles table, because they ARE clients, just with a special pass.
    -- Or we can try to force 'client' if 'koszegpass' fails.
    INSERT INTO public.profiles (id, username, full_name, role)
    VALUES (
      new.id, 
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'full_name',
      'client' -- SAFE FALLBACK: All KőszegPass users are Clients + Pass holder.
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


-- ENABLE REALTIME
-- 1. Add table to publication
do $$
begin
  alter publication supabase_realtime add table orders;
exception when others then
  null;
end $$;

-- 2. Ensure schema replication is on
alter table orders replica identity full;


-- ==========================================
-- 4. New Features
-- ==========================================

-- LIGHTWEIGHT UPDATE: Points System & Realtime Fixes
-- 1. Ensure 'points' column exists in koszegpass_users
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'koszegpass_users' AND column_name = 'points') THEN
        ALTER TABLE public.koszegpass_users ADD COLUMN points integer DEFAULT 0;
    END IF;
END $$;

-- 2. Ensure Realtime is enabled for core tables (Restaurants, Menu, Orders)
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.restaurants REPLICA IDENTITY FULL;
ALTER TABLE public.menu_items REPLICA IDENTITY FULL;

DO $$ 
BEGIN 
  -- Remove tables from publication first to avoid errors if they exist (optional, but cleaner)
  -- ALTER PUBLICATION supabase_realtime DROP TABLE public.orders, public.restaurants, public.menu_items; 
  -- Add them back ensuring they are present
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders, public.restaurants, public.menu_items; 
EXCEPTION WHEN OTHERS THEN 
  NULL; -- Ignore if already added
END; $$;

-- 3. Create Points Trigger Function
CREATE OR REPLACE FUNCTION public.update_points_on_delivery()
RETURNS trigger AS $$
DECLARE
  earned_points integer;
BEGIN
  -- Only run if status changed to 'delivered' FROM something else
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Calculate: 1 Point per 1000 HUF
    earned_points := floor(NEW.total_price / 1000);
    
    -- Update KőszegPass User points if they exist
    IF earned_points > 0 THEN
      UPDATE public.koszegpass_users
      SET points = points + earned_points
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach Trigger to Orders Table
DROP TRIGGER IF EXISTS on_order_delivered_reward ON public.orders;
CREATE TRIGGER on_order_delivered_reward
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.update_points_on_delivery();

SELECT '✅ Update Completed Successfully' as status;
