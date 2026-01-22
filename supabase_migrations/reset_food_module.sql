-- ==========================================
-- KOSZEGAPP FOOD MODULE RESET SCRIPT
-- ==========================================
-- WARNING: This will DELETE all existing data in:
-- restaurants, menu_categories, menu_items, orders, order_items
-- Use this to get a completely clean, working state.

-- 1. DROP EVERYTHING (Clean Slate)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;

-- 2. RE-CREATE RESTAURANTS TABLE (With correct owner_id)
CREATE TABLE restaurants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  owner_id uuid REFERENCES auth.users(id), -- Vital link to Auth
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  phone text,
  address text,
  access_code text DEFAULT '1234',
  is_open boolean DEFAULT true,
  image_url text
);

-- Enable RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public restaurants are viewable by everyone" 
ON restaurants FOR SELECT USING (true);

CREATE POLICY "Owners can insert their own restaurant" 
ON restaurants FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own restaurant" 
ON restaurants FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own restaurant" 
ON restaurants FOR DELETE USING (auth.uid() = owner_id);

-- 3. RE-CREATE MENU CATEGORIES
CREATE TABLE menu_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer DEFAULT 0
);
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view categories" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Owners manage categories" ON menu_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM restaurants r WHERE r.id = menu_categories.restaurant_id AND r.owner_id = auth.uid())
);

-- 4. RE-CREATE MENU ITEMS
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
CREATE POLICY "Owners manage items" ON menu_items FOR ALL USING (
  EXISTS (SELECT 1 FROM restaurants r WHERE r.id = menu_items.restaurant_id AND r.owner_id = auth.uid())
);

-- 5. RE-CREATE ORDERS SYSTEM
CREATE TABLE orders (
  id serial PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  customer_note text,
  status text DEFAULT 'new',
  total_price integer NOT NULL
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- Owners can see orders for their restaurant
CREATE POLICY "Owners see orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM restaurants r WHERE r.id = orders.restaurant_id AND r.owner_id = auth.uid())
);
-- Customers can insert orders (Public for now, or auth restricted)
CREATE POLICY "Public create orders" ON orders FOR INSERT WITH CHECK (true);

CREATE TABLE order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id integer REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity integer NOT NULL,
  price integer NOT NULL
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners see order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o 
          JOIN restaurants r ON r.id = o.restaurant_id 
          WHERE o.id = order_items.order_id AND r.owner_id = auth.uid())
);
CREATE POLICY "Public create order items" ON order_items FOR INSERT WITH CHECK (true);

-- 6. FIX PROFILES ROLE
-- Ensure 'restaurant' is a valid role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('client', 'provider', 'admin', 'restaurant', 'tourinform', 'partner', 'varos', 'var'));

SELECT 'Food Module Reset Successfully' as status;
