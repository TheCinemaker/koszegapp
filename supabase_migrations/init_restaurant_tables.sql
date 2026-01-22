-- ==========================================
-- 1. DROP TABLES IF EXIST (Clean Slate)
-- ==========================================
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists menu_items cascade;
drop table if exists menu_categories cascade;
drop table if exists restaurants cascade;

-- ==========================================
-- 2. CREATE TABLES
-- ==========================================

-- RESTAURANTS
create table restaurants (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  slug text not null unique,
  description text,
  phone text,
  address text,
  access_code text default '1234', -- Simple Code Login
  is_open boolean default true,
  image_url text
);

-- MENU CATEGORIES
create table menu_categories (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  name text not null,
  order_index integer default 0
);

-- MENU ITEMS
create table menu_items (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  category_id uuid references menu_categories(id) on delete cascade,
  name text not null,
  description text,
  price integer not null,
  image_url text,
  available boolean default true
);

-- ORDERS
create table orders (
  id serial primary key, -- Simple numeric ID for easy reading (e.g., #1024)
  created_at timestamptz default now(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  customer_note text,
  status text default 'new', -- new, accepted, rejected, ready, delivered
  total_price integer not null
);

-- ORDER ITEMS
create table order_items (
  id uuid default gen_random_uuid() primary key,
  order_id integer references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null, -- Keep record even if item deleted
  name text not null, -- Snapshot of name
  quantity integer not null,
  price integer not null -- Snapshot of price
);

-- ==========================================
-- 3. INSERT DEMO DATA
-- ==========================================

-- INSERT RESTAURANTS
insert into restaurants (name, slug, description, phone, address, access_code)
values
  (
    'Bella Pizza',
    'bella-pizza',
    'Hagyományos olasz pizzák fatüzelésű kemencében',
    '+36 94 123 456',
    'Kőszeg, Fő tér 1.',
    '1234'
  ),
  (
    'Burger Corner',
    'burger-corner',
    'Kézműves hamburgerek friss alapanyagokból',
    '+36 94 222 333',
    'Kőszeg, Várkör 12.',
    '1234'
  ),
  (
    'City Grill & Drink',
    'city-grill',
    'Gyors grillételek és hideg üdítők',
    '+36 94 987 654',
    'Kőszeg, Rajnis utca 5.',
    '1234'
  );

-- INSERT CATEGORIES (Using DO block to get IDs dynamically)
DO $$
DECLARE
  r_bella uuid;
  r_burger uuid;
  r_grill uuid;
BEGIN
  -- Get Restaurant IDs
  select id into r_bella from restaurants where slug = 'bella-pizza';
  select id into r_burger from restaurants where slug = 'burger-corner';
  select id into r_grill from restaurants where slug = 'city-grill';

  -- BELLA PIZZA CATEGORIES
  insert into menu_categories (restaurant_id, name, order_index) values (r_bella, 'Pizzák', 1);
  insert into menu_categories (restaurant_id, name, order_index) values (r_bella, 'Üdítők', 2);

  -- BURGER CORNER CATEGORIES
  insert into menu_categories (restaurant_id, name, order_index) values (r_burger, 'Burgerek', 1);
  insert into menu_categories (restaurant_id, name, order_index) values (r_burger, 'Üdítők', 2);

  -- CITY GRILL CATEGORIES
  insert into menu_categories (restaurant_id, name, order_index) values (r_grill, 'Grillételek', 1);
  insert into menu_categories (restaurant_id, name, order_index) values (r_grill, 'Üdítők', 2);
END $$;

-- INSERT MENU ITEMS
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
  -- Get IDs for Bella
  select id into r_bella from restaurants where slug = 'bella-pizza';
  select id into c_bella_pizza from menu_categories where restaurant_id = r_bella and name = 'Pizzák';
  select id into c_bella_drink from menu_categories where restaurant_id = r_bella and name = 'Üdítők';

  -- Get IDs for Burger
  select id into r_burger from restaurants where slug = 'burger-corner';
  select id into c_burger_main from menu_categories where restaurant_id = r_burger and name = 'Burgerek';
  select id into c_burger_drink from menu_categories where restaurant_id = r_burger and name = 'Üdítők';

  -- Get IDs for Grill
  select id into r_grill from restaurants where slug = 'city-grill';
  select id into c_grill_main from menu_categories where restaurant_id = r_grill and name = 'Grillételek';
  select id into c_grill_drink from menu_categories where restaurant_id = r_grill and name = 'Üdítők';

  -- ITEMS: BELLA
  insert into menu_items (restaurant_id, category_id, name, description, price) values 
    (r_bella, c_bella_pizza, 'Margherita', 'Paradicsomszósz, mozzarella, bazsalikom', 2600),
    (r_bella, c_bella_pizza, 'Pepperoni', 'Paradicsomszósz, mozzarella, pepperoni', 2900),
    (r_bella, c_bella_drink, 'Cola 0,5l', 'Hűtött szénsavas üdítő', 600);

  -- ITEMS: BURGER
  insert into menu_items (restaurant_id, category_id, name, description, price) values 
    (r_burger, c_burger_main, 'Classic Burger', 'Marhahús, cheddar, saláta, paradicsom', 3200),
    (r_burger, c_burger_main, 'Cheeseburger', 'Marhahús, dupla sajt, savanyú uborka', 3400),
    (r_burger, c_burger_drink, 'Sprite 0,5l', 'Citromos üdítő', 600);

  -- ITEMS: GRILL
  insert into menu_items (restaurant_id, category_id, name, description, price) values 
    (r_grill, c_grill_main, 'Grillkolbász', 'Frissen sült grillkolbász mustárral', 2800),
    (r_grill, c_grill_main, 'Sült krumpli', 'Ropogós hasábburgonya', 1400),
    (r_grill, c_grill_drink, 'Ásványvíz 0,5l', 'Szénsavmentes', 500);

END $$;
