-- Seed Real Kőszeg Restaurants & Menus
-- Run this in SQL Editor to populate the database with realistic data.

-- 1. KÉKFÉNY ÉTTEREM (Hagyományos & Pizza)
DO $$
DECLARE
  v_rest_id uuid;
  v_cat_main uuid;
  v_cat_pizza uuid;
BEGIN
  INSERT INTO public.restaurants (name, slug, description, address, phone, delivery_time, is_open, has_delivery, cuisine, tags, image_url)
  VALUES (
    'Kékfény Étterem', 
    'kekfeny', 
    'Kőszeg legrégebbi étterme a Fő téren. Hagyományos ízek és kemencés pizzák.', 
    'Kőszeg, Fő tér 1.', 
    '+36 94 360 000', 
    '40-50 perc', 
    true, 
    true,
    'Magyaros',
    ARRAY['pizza', 'leves', 'hagyományos'],
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
  ) RETURNING id INTO v_rest_id;

  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (v_rest_id, 'Főételek', 1) RETURNING id INTO v_cat_main;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (v_rest_id, 'Pizzák', 2) RETURNING id INTO v_cat_pizza;

  INSERT INTO public.menu_items (restaurant_id, category_id, name, description, price, is_available, tags) VALUES
  (v_rest_id, v_cat_main, 'Rántott sajt rizzsel', 'Tartármártással, ahogy a nagyi csinálja.', 2800, true, ARRAY['vega']),
  (v_rest_id, v_cat_main, 'Cigánypecsenye', 'Fokhagymás tarja kakastaréjjal, hasábburgonyával.', 3400, true, ARRAY['húsos', 'csípős']),
  (v_rest_id, v_cat_pizza, 'Pizza Kőszeg', 'Paradicsomos alap, sonka, gomba, kukorica, sajt.', 2400, true, ARRAY['pizza']),
  (v_rest_id, v_cat_pizza, 'Pizza Diavolo', 'Csípős szalámi, pepperoni, hagyma, sajt.', 2600, true, ARRAY['pizza', 'csípős']);
END $$;

-- 2. IBRAHIM KÁVÉZÓ (Orientális & Kávé)
DO $$
DECLARE
  v_rest_id uuid;
  v_cat_coffee uuid;
  v_cat_food uuid;
BEGIN
  INSERT INTO public.restaurants (name, slug, description, address, phone, delivery_time, is_open, has_delivery, cuisine, tags, image_url)
  VALUES (
    'Ibrahim Kávézó & Étterem', 
    'ibrahim', 
    'Keleties hangulat a várfal tövében. Különleges kávék és ételek.', 
    'Kőszeg, Fő tér 4.', 
    '+36 94 361 111', 
    '30-40 perc', 
    true, 
    true,
    'Orientális',
    ARRAY['kávé', 'desszert', 'különleges'],
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80'
  ) RETURNING id INTO v_rest_id;

  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (v_rest_id, 'Kávék', 1) RETURNING id INTO v_cat_coffee;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (v_rest_id, 'Ételek', 2) RETURNING id INTO v_cat_food;

  INSERT INTO public.menu_items (restaurant_id, category_id, name, description, price, is_available, tags) VALUES
  (v_rest_id, v_cat_coffee, 'Török Kávé', 'Hagyományos módon, zaccosan főzve.', 950, true, ARRAY['kávé']),
  (v_rest_id, v_cat_food, 'Gyros Tál', 'Friss zöldségekkel, pitával és joghurtos öntettel.', 3200, true, ARRAY['húsos']),
  (v_rest_id, v_cat_food, 'Baklava', 'Diós-mézes sütemény.', 1200, true, ARRAY['desszert']);
END $$;

-- 3. BÉCSIKAPU ÉTTEREM (Hagyományos)
DO $$
DECLARE
  v_rest_id uuid;
  v_cat_soup uuid;
  v_cat_main uuid;
BEGIN
  INSERT INTO public.restaurants (name, slug, description, address, phone, delivery_time, is_open, has_delivery, cuisine, tags, image_url)
  VALUES (
    'Bécsikapu Étterem', 
    'becsikapu', 
    'Családias hangulat a vár közelében. Hatalmas adagok, magyaros ízek.', 
    'Kőszeg, Rajnis J. u. 5.', 
    '+36 94 360 222', 
    '50-60 perc', 
    true, 
    true,
    'Magyaros',
    ARRAY['leves', 'sült', 'kiadós'],
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80'
  ) RETURNING id INTO v_rest_id;

  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (v_rest_id, 'Levesek', 1) RETURNING id INTO v_cat_soup;
  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (v_rest_id, 'Frissensültek', 2) RETURNING id INTO v_cat_main;

  INSERT INTO public.menu_items (restaurant_id, category_id, name, description, price, is_available, tags) VALUES
  (v_rest_id, v_cat_soup, 'Húsleves gazdagon', 'Csigatésztával, zöldségekkel.', 1400, true, ARRAY['leves']),
  (v_rest_id, v_cat_main, 'Bécsikapu Tál (2 személyes)', 'Rántott hús, cigánypecsenye, rántott sajt, vegyes köret.', 8500, true, ARRAY['húsos', 'kiadós']);
END $$;

-- 4. CSABI-HAMI (Büfé)
DO $$
DECLARE
  v_rest_id uuid;
  v_cat_fast uuid;
BEGIN
  INSERT INTO public.restaurants (name, slug, description, address, phone, delivery_time, is_open, has_delivery, cuisine, tags, image_url)
  VALUES (
    'Csabi-Hami', 
    'csabihami', 
    'A legjobb hidegtálak és gyorsételek a városban.', 
    'Kőszeg, Gyöngyös u.', 
    '+36 30 123 456', 
    '20-30 perc', 
    true, 
    false, -- Pickup only example
    'Büfé',
    ARRAY['hidegtál', 'szendvics'],
    'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80'
  ) RETURNING id INTO v_rest_id;

  INSERT INTO public.menu_categories (restaurant_id, name, sort_order) VALUES (v_rest_id, 'Finomságok', 1) RETURNING id INTO v_cat_fast;

  INSERT INTO public.menu_items (restaurant_id, category_id, name, description, price, is_available, tags) VALUES
  (v_rest_id, v_cat_fast, 'Kaszinótojás franciasalátával', 'Klasszikus hidegtál.', 1800, true, ARRAY['hidegtál']),
  (v_rest_id, v_cat_fast, 'Sonkatekercs', 'Tormakrémmel töltve.', 600, true, ARRAY['hidegtál']);
END $$;

SELECT '✅ Real Kőszeg restaurants seeded!' as status;
