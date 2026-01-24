-- ==========================================
-- RESTORE DEMO RESTAURANTS DATA
-- ==========================================

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
  
  -- Dummy Owner ID (You might want to replace this with your actual User ID if you want to edit them)
  -- For now we leave it NULL or set it to the executing user if possible.
  -- But usually RLS prevents seeing them if owner_id is set to someone else.
  -- Let's set owner_id to auth.uid() if run in SQL editor as authenticated, OR allow public view.
  -- Our schema allows public view, so it's fine.
  
  -- NOTE: If you want to EDIT these in the admin panel, you must be logged in as the owner.
  -- Since we don't know your User ID here, these will be "orphan" restaurants or owned by NULL.
  -- (If owner_id is NULL, policies might strictly hide them from "Owners can..." queries, but "Public..." policies show them to customers).
BEGIN

  -- 1. INSERT RESTAURANTS
  insert into restaurants (name, slug, description, phone, address, access_code, image_url) values
    ('Baba Pizza', 'baba-pizza', 'Hagyományos olasz pizzák fatüzelésű kemencében', '+36 94 123 456', 'Kőszeg, Fő tér 1.', '1234', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=60')
    returning id into r_bella;

  insert into restaurants (name, slug, description, phone, address, access_code, image_url) values
    ('Burger Corner', 'burger-corner', 'Kézműves hamburgerek friss alapanyagokból', '+36 94 222 333', 'Kőszeg, Várkör 12.', '1234', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60')
    returning id into r_burger;

  insert into restaurants (name, slug, description, phone, address, access_code, image_url) values
    ('City Grill & Drink', 'city-grill', 'Gyors grillételek és hideg üdítők', '+36 94 987 654', 'Kőszeg, Rajnis utca 5.', '1234', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=60')
    returning id into r_grill;


  -- 2. INSERT CATEGORIES
  -- Bella
  insert into menu_categories (restaurant_id, name, order_index) values (r_bella, 'Pizzák', 1) returning id into c_bella_pizza;
  insert into menu_categories (restaurant_id, name, order_index) values (r_bella, 'Üdítők', 2) returning id into c_bella_drink;

  -- Burger
  insert into menu_categories (restaurant_id, name, order_index) values (r_burger, 'Burgerek', 1) returning id into c_burger_main;
  insert into menu_categories (restaurant_id, name, order_index) values (r_burger, 'Üdítők', 2) returning id into c_burger_drink;

  -- Grill
  insert into menu_categories (restaurant_id, name, order_index) values (r_grill, 'Grillételek', 1) returning id into c_grill_main;
  insert into menu_categories (restaurant_id, name, order_index) values (r_grill, 'Üdítők', 2) returning id into c_grill_drink;


  -- 3. INSERT MENU ITEMS
  -- Bella Items
  insert into menu_items (restaurant_id, category_id, name, description, price, image_url) values 
    (r_bella, c_bella_pizza, 'Margherita', 'Paradicsomszósz, mozzarella, bazsalikom', 2600, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002'),
    (r_bella, c_bella_pizza, 'Pepperoni', 'Paradicsomszósz, mozzarella, pepperoni', 2900, 'https://images.unsplash.com/photo-1628840042765-356cda07504e'),
    (r_bella, c_bella_drink, 'Cola 0,5l', 'Hűtött szénsavas üdítő', 600, null);

  -- Burger Items
  insert into menu_items (restaurant_id, category_id, name, description, price, image_url) values 
    (r_burger, c_burger_main, 'Classic Burger', 'Marhahús, cheddar, saláta, paradicsom', 3200, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd'),
    (r_burger, c_burger_main, 'Cheeseburger', 'Marhahús, dupla sajt, savanyú uborka', 3400, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5'),
    (r_burger, c_burger_drink, 'Sprite 0,5l', 'Citromos üdítő', 600, null);

  -- Grill Items
  insert into menu_items (restaurant_id, category_id, name, description, price, image_url) values 
    (r_grill, c_grill_main, 'Grillkolbász', 'Frissen sült grillkolbász mustárral', 2800, 'https://images.unsplash.com/photo-1596797038530-2c107229654b'),
    (r_grill, c_grill_main, 'Sült krumpli', 'Ropogós hasábburgonya', 1400, 'https://images.unsplash.com/photo-1573080496987-a199f8cd75ec'),
    (r_grill, c_grill_drink, 'Ásványvíz 0,5l', 'Szénsavmentes', 500, null);

END $$;
