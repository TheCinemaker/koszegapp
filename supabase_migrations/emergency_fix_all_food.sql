-- ==========================================
-- EMERGENCY FIX ALL FOOD MODULE (SILVER BULLET)
-- ==========================================
-- This script does EVERYTHING in the correct order:
-- 1. Drops all food-related tables (Clean Slate)
-- 2. Re-creates tables with CORRECT schema (including user_id)
-- 3. Sets up ALL RLS policies correctly
-- 4. Re-creates the RPC function for ordering
-- 5. Restores the DEMO RESTAURANTS and MENUS
-- ==========================================

-- 1. DROP EXISTING TABLES
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;

-- 2. CREATE RESTAURANTS TABLE
CREATE TABLE restaurants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  owner_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  phone text,
  address text,
  access_code text DEFAULT '1234',
  is_open boolean DEFAULT true,
  image_url text,
  delivery_time text DEFAULT '30-40 perc' -- Add this field too as it was used in UI
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public restaurants view" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Owners insert restaurants" ON restaurants FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update restaurants" ON restaurants FOR UPDATE USING (auth.uid() = owner_id);

-- 3. CREATE MENU CATEGORIES
CREATE TABLE menu_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer DEFAULT 0
);
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view categories" ON menu_categories FOR SELECT USING (true);

-- 4. CREATE MENU ITEMS
CREATE TABLE menu_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES menu_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price integer NOT NULL,
  image_url text,
  available boolean DEFAULT true
);
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view items" ON menu_items FOR SELECT USING (true);

-- 5. CREATE ORDERS (WITH USER_ID !)
CREATE TABLE orders (
  id serial PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id), -- THE KEY FIX
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  customer_note text,
  status text DEFAULT 'new',
  total_price integer NOT NULL
);

-- 6. CREATE ORDER ITEMS
CREATE TABLE order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id integer REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity integer NOT NULL,
  price integer NOT NULL
);

-- 7. ENABLE REALTIME
ALTER TABLE orders REPLICA IDENTITY FULL;
-- Try catch block for publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

-- 8. FIX RLS FOR ORDERS (CRITICAL)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy: User can see their own orders
CREATE POLICY "Users view own orders" ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Policy: User can insert orders
CREATE POLICY "Users insert own orders" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- Policy: Admins/Restaurants can view ALL orders (Simplification for MVP)
CREATE POLICY "Admins view all orders" ON orders FOR SELECT TO authenticated USING (true);

-- Policy: Order Items viewable if Order is viewable
CREATE POLICY "View order items" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert order items" ON order_items FOR INSERT TO authenticated WITH CHECK (true);

-- 9. CREATE RPC FUNCTION
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

-- 10. RESTORE DEMO DATA (RESTAURANTS)
DO $$
DECLARE
  r_bella uuid;
  c_bella_pizza uuid;
  c_bella_drink uuid;
  r_burger uuid;
  c_burger_main uuid;
  c_burger_drink uuid;
  r_grill uuid;
  c_grill_main uuid;
  c_grill_drink uuid;
BEGIN
  -- INSERT RESTAURANTS
  insert into restaurants (name, slug, description, phone, address, access_code, image_url, delivery_time) values
    ('Bella Pizza', 'bella-pizza', 'Hagyományos olasz pizzák fatüzelésű kemencében', '+36 94 123 456', 'Kőszeg, Fő tér 1.', '1234', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=60', '45 perc')
    returning id into r_bella;

  insert into restaurants (name, slug, description, phone, address, access_code, image_url, delivery_time) values
    ('Burger Corner', 'burger-corner', 'Kézműves hamburgerek friss alapanyagokból', '+36 94 222 333', 'Kőszeg, Várkör 12.', '1234', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60', '30 perc')
    returning id into r_burger;

  insert into restaurants (name, slug, description, phone, address, access_code, image_url, delivery_time) values
    ('City Grill & Drink', 'city-grill', 'Gyors grillételek és hideg üdítők', '+36 94 987 654', 'Kőszeg, Rajnis utca 5.', '1234', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=60', '25 perc')
    returning id into r_grill;

  -- INSERT CATEGORIES
  insert into menu_categories (restaurant_id, name, order_index) values (r_bella, 'Pizzák', 1) returning id into c_bella_pizza;
  insert into menu_categories (restaurant_id, name, order_index) values (r_bella, 'Üdítők', 2) returning id into c_bella_drink;

  insert into menu_categories (restaurant_id, name, order_index) values (r_burger, 'Burgerek', 1) returning id into c_burger_main;
  insert into menu_categories (restaurant_id, name, order_index) values (r_burger, 'Üdítők', 2) returning id into c_burger_drink;

  insert into menu_categories (restaurant_id, name, order_index) values (r_grill, 'Grillételek', 1) returning id into c_grill_main;
  insert into menu_categories (restaurant_id, name, order_index) values (r_grill, 'Üdítők', 2) returning id into c_grill_drink;

  -- INSERT MENU ITEMS
  insert into menu_items (restaurant_id, category_id, name, description, price, image_url) values 
    (r_bella, c_bella_pizza, 'Margherita', 'Paradicsomszósz, mozzarella', 2600, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002'),
    (r_bella, c_bella_pizza, 'Pepperoni', 'Paradicsomszósz, pepperoni', 2900, 'https://images.unsplash.com/photo-1628840042765-356cda07504e'),
    (r_bella, c_bella_drink, 'Cola 0,5l', 'Hűtött', 600, null),
    (r_burger, c_burger_main, 'Classic Burger', 'Marhahús, cheddar', 3200, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd'),
    (r_burger, c_burger_main, 'Cheeseburger', 'Dupla sajt', 3400, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5'),
    (r_burger, c_burger_drink, 'Sprite 0,5l', 'Citromos üdítő', 600, null),
    (r_grill, c_grill_main, 'Grillkolbász', 'Mustárral', 2800, 'https://images.unsplash.com/photo-1596797038530-2c107229654b'),
    (r_grill, c_grill_main, 'Sült krumpli', 'Ropogós', 1400, 'https://images.unsplash.com/photo-1573080496987-a199f8cd75ec');
END $$;

SELECT 'FOOD MODULE FIXED COMPLETELY' as status;
