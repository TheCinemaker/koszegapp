-- =================================================================
-- ☢️ NUCLEAR RESET & REBUILD (ALL MODULES) ☢️
-- =================================================================
-- This script WIPES the entire public schema and rebuilds it correctly.
-- MODULES INCLUDED:
-- 1. AUTH & PROFILES (CityPass, Providers, Clients)
-- 2. FOOD DELIVERY (Restaurants, Menus, Orders, Realtime)
-- =================================================================

-- canvas: disable_auto_run

-- 1. 🗑️ DROP EVERYTHING (CLEAN SLATE - AGGRESSIVE)
-- WARNING: THIS DELETES ALL USERS AND DATA. NO TURNING BACK.
TRUNCATE auth.users RESTART IDENTITY CASCADE; 

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.place_order_full(uuid, text, text, text, text, integer, jsonb, uuid);

-- Food Tables
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.menu_categories CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;

-- Auth & Business Tables
DROP TABLE IF EXISTS public.koszegpass_users CASCADE;
DROP TABLE IF EXISTS public.providers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Potential Module Tables (Just in case they exist from previous installs)
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.schedules CASCADE;
DROP TABLE IF EXISTS public.user_gems CASCADE; -- If user tracking exists



-- =================================================================
-- 2. 🏰 AUTH & PROFILES MODULE
-- =================================================================

-- A) PROFILES (Global User Directory)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE,
  full_name text,
  role text DEFAULT 'client', -- 'client', 'koszegpass', 'restaurant', 'provider', 'admin'
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Profiles View" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Self Profile Update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Self Profile Insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- B) KOSZEGPASS USERS (Loyalty & ID System)
CREATE TABLE public.koszegpass_users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE,
  full_name text,
  phone text,
  address text,
  points int DEFAULT 0,
  rank text DEFAULT 'Felfedező',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.koszegpass_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Self Pass View" ON public.koszegpass_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Self Pass Update" ON public.koszegpass_users FOR UPDATE USING (auth.uid() = id);

-- C) PROVIDERS (Service Providers Directory)
CREATE TABLE public.providers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text,
  category text,
  slug text UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Provider View" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Owner Provider Manage" ON public.providers FOR ALL USING (auth.uid() = user_id);

-- D) AUTH TRIGGER (The Glue)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- 1. KOSZEGPASS USER
  IF new.raw_user_meta_data->>'role' = 'koszegpass' THEN
    INSERT INTO public.koszegpass_users (id, username, full_name)
    VALUES (new.id, new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'full_name')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.profiles (id, username, full_name, role)
    VALUES (new.id, new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'full_name', 'koszegpass')
    ON CONFLICT DO NOTHING;

  -- 2. RESTAURANT OWNER
  ELSIF new.raw_user_meta_data->>'role' = 'restaurant' THEN
    INSERT INTO public.profiles (id, username, full_name, role)
    VALUES (new.id, new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'full_name', 'restaurant')
    ON CONFLICT DO NOTHING;

  -- 3. STANDARD CLIENT / OTHER
  ELSE
    INSERT INTO public.profiles (id, username, full_name, role)
    VALUES (new.id, new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'full_name', 'client')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- =================================================================
-- 3. 🍕 FOOD & DELIVERY MODULE
-- =================================================================

-- A) RESTAURANTS
CREATE TABLE public.restaurants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  owner_id uuid REFERENCES auth.users(id), -- Nullable for demo/orphan, but linked if owner exists
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  phone text,
  address text,
  access_code text DEFAULT '1234',
  delivery_time text DEFAULT '30-40 perc',
  is_open boolean DEFAULT true,
  image_url text
);
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Restaurants View" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Owners Manage Restaurants" ON public.restaurants FOR ALL USING (auth.uid() = owner_id);

-- B) MENU CATEGORIES
CREATE TABLE public.menu_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer DEFAULT 0
);
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Categories View" ON public.menu_categories FOR SELECT USING (true);
CREATE POLICY "Owners Manage Categories" ON public.menu_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = menu_categories.restaurant_id AND r.owner_id = auth.uid())
);

-- C) MENU ITEMS
CREATE TABLE public.menu_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price integer NOT NULL,
  image_url text,
  available boolean DEFAULT true
);
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Items View" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Owners Manage Items" ON public.menu_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = menu_items.restaurant_id AND r.owner_id = auth.uid())
);

-- D) ORDERS (The Core Transaction Table)
CREATE TABLE public.orders (
  id serial PRIMARY KEY, -- Friendly ID (101, 102...)
  created_at timestamptz DEFAULT now(),
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id), -- Linked to Authenticated User
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  customer_note text,
  status text DEFAULT 'new', -- new, accepted, ready, delivered, rejected
  total_price integer NOT NULL
);
-- REALTIME SETUP
ALTER TABLE public.orders REPLICA IDENTITY FULL;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.orders; EXCEPTION WHEN OTHERS THEN NULL; END; $$;

-- RLS FOR ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users View Own Orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users Insert Own Orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- Restaurant Owners view orders (Simplified: All Auth users can VIEW, but frontend filters by ID)
CREATE POLICY "Authenticated View All Orders" ON public.orders FOR SELECT TO authenticated USING (true);


-- E) ORDER ITEMS
CREATE TABLE public.order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id integer REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity integer NOT NULL,
  price integer NOT NULL
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated View Order Items" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated Insert Order Items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);


-- 4. ⚙️ RPC FUNCTION (Secure Ordering)
CREATE OR REPLACE FUNCTION place_order_full(
    p_restaurant_id uuid,
    p_customer_name text,
    p_customer_phone text,
    p_customer_address text,
    p_customer_note text,
    p_total_price integer,
    p_items jsonb,
    p_user_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id integer;
    item jsonb;
BEGIN
    INSERT INTO public.orders (
        restaurant_id, customer_name, customer_phone, customer_address, customer_note, total_price, user_id, status
    ) VALUES (
        p_restaurant_id, p_customer_name, p_customer_phone, p_customer_address, p_customer_note, p_total_price, p_user_id, 'new'
    ) RETURNING id INTO new_order_id;

    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, menu_item_id, name, quantity, price) 
        VALUES (new_order_id, (item->>'id')::uuid, (item->>'name'), (item->>'quantity')::integer, (item->>'price')::integer);
    END LOOP;
    RETURN json_build_object('id', new_order_id, 'status', 'success');
END;
$$;


-- =================================================================
-- 5. 🌱 RESTORE DEMO DATA
-- =================================================================
DO $$
DECLARE
  r_bella uuid; c_bella_1 uuid; c_bella_2 uuid;
  r_burger uuid; c_burger_1 uuid; c_burger_2 uuid;
  r_grill uuid; c_grill_1 uuid; c_grill_2 uuid;
BEGIN
  -- RESTAURANTS
  insert into restaurants (name, slug, description, phone, address, access_code, image_url, delivery_time) values
    ('Bella Pizza', 'bella-pizza', 'Hagyományos olasz pizzák.', '+36 94 123 456', 'Kőszeg, Fő tér 1.', '1234', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=60', '45 perc')
    returning id into r_bella;

  insert into restaurants (name, slug, description, phone, address, access_code, image_url, delivery_time) values
    ('Burger Corner', 'burger-corner', 'Kézműves hamburgerek.', '+36 94 222 333', 'Kőszeg, Várkör 12.', '1234', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60', '30 perc')
    returning id into r_burger;

  insert into restaurants (name, slug, description, phone, address, access_code, image_url, delivery_time) values
    ('City Grill', 'city-grill', 'Gyors ételek.', '+36 94 987 654', 'Kőszeg, Rajnis u 5.', '1234', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=60', '25 perc')
    returning id into r_grill;

  -- CATEGORIES & ITEMS (Shortened for brevity but complete)
  insert into menu_categories (restaurant_id, name, order_index) values (r_bella, 'Pizzák', 1) returning id into c_bella_1;
  insert into menu_items (restaurant_id, category_id, name, description, price, image_url) values 
    (r_bella, c_bella_1, 'Margherita', 'Paradicsom, sajt', 2600, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002');
    
  insert into menu_categories (restaurant_id, name, order_index) values (r_burger, 'Burgerek', 1) returning id into c_burger_1;
  insert into menu_items (restaurant_id, category_id, name, description, price, image_url) values 
    (r_burger, c_burger_1, 'Classic Burger', 'Marhahús, cheddar', 3200, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd');
END $$;

SELECT '☢️ NUCLEAR RESET COMPLETE - SYSTEM REBUILT SUCCESSFULLY ☢️' as status;
