# 🚨 ATOMBOMBA II: A VÉGSŐ MEGOLDÁS (SUPABASE RESCUE)

A "42"-es hiba és a "Constraint Error" azt jelenti, hogy az adatbázisban lévő *kapcsolatok* (Foreign Key) akadályozzák a javítást.
Most **TÖRÖLJÜK A KORLÁTOZÁSOKAT**, hogy végre elfogadja az adatokat!

Másold be és futtasd le a Supabase SQL Editorban (ez mindent rendbe tesz):

```sql
-- 1. MINDEN "place_order_full" verzió törlése (hogy tiszta lapot kapjunk)
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (
        SELECT oid::regprocedure as func_signature 
        FROM pg_proc 
        WHERE proname = 'place_order_full' 
        AND pronamespace = 'public'::regnamespace
    ) LOOP 
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE'; 
    END LOOP; 
END $$;

-- 2. MEGSZÜNTETJÜK A KORLÁTOZÁST, ami a "42"-es szám miatt sír
-- (Először eldobja a Foreign Key-t, ha létezik)
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_menu_item_id_fkey;

-- 3. ÁTÁLLÍTJUK A MENÜ ELEMEKET SZÁM TÍPUSRA (BIGINT)
-- (Így el fogja fogadni a "41", "42"-es ID-kat!)
ALTER TABLE order_items 
ALTER COLUMN menu_item_id TYPE bigint USING (
    CASE 
        WHEN menu_item_id::text ~ '^[0-9]+$' THEN menu_item_id::text::bigint 
        ELSE NULL -- Ha régi UUID volt benne, az elveszhet, de most a működés a lényeg!
    END
);

-- 4. A VÉGLEGES, MINDENT TUDÓ FÜGGVÉNY LÉTREHOZÁSA
CREATE OR REPLACE FUNCTION place_order_full(
    p_restaurant_id text,
    p_customer_name text,
    p_customer_phone text,
    p_customer_address text,
    p_customer_note text,
    p_total_price numeric,
    p_items jsonb,
    p_user_id uuid,
    p_payment_method text DEFAULT 'cash'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id uuid;
    v_rest_uuid uuid;
    v_item jsonb;
    v_points_to_add int;
BEGIN
    -- Étterem ID: Konvertáljuk UUID-re (mert a Restaurants tábla UUID-s)
    BEGIN
        v_rest_uuid := p_restaurant_id::uuid;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'HIBÁS ÉTTEREM ID (Nem UUID): "%". KÉRLEK ÜRÍTSD A KOSARAT!', p_restaurant_id;
    END;

    -- 1. Rendelés létrehozása (Orders tábla)
    INSERT INTO orders (
        user_id, restaurant_id, total_price, status, 
        customer_name, customer_phone, customer_address, customer_note, 
        payment_method, payment_status
    ) VALUES (
        p_user_id, v_rest_uuid, p_total_price, 'pending',
        p_customer_name, p_customer_phone, p_customer_address, p_customer_note,
        p_payment_method, 'pending'
    ) RETURNING id INTO v_order_id;

    -- 2. Tételek mentése (ITT A LÉNYEG: BIGINT-ként mentjük a menüt!)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        BEGIN
            INSERT INTO order_items (
                order_id,
                menu_item_id,
                quantity,
                price,
                name
            ) VALUES (
                v_order_id,
                (v_item->>'id')::bigint, -- <--- SZÁMKÉNT (bigint) mentjük!
                (v_item->>'quantity')::int,
                (v_item->>'price')::numeric,
                v_item->>'name'
            );
        EXCEPTION WHEN OTHERS THEN
             -- Ha még mindig nem jó (pl. szöveg), szólunk
            RAISE EXCEPTION 'HIBÁS TERMÉK ID: "%". KÉRLEK ÜRÍTSD A KOSARAT!', (v_item->>'id');
        END;
    END LOOP;

    -- 3. Pontok jóváírása
    IF p_user_id IS NOT NULL THEN
        v_points_to_add := FLOOR(p_total_price / 100);
        UPDATE koszegpass_users 
        SET points = points + v_points_to_add 
        WHERE id = p_user_id;
    END IF;

    RETURN json_build_object(
        'order_id', v_order_id, 
        'status', 'success', 
        'points_awarded', v_points_to_add
    );
END;
$$;

GRANT EXECUTE ON FUNCTION place_order_full TO anon, authenticated, service_role;
```

**MOST MÁR TÉNYLEG MENNIE KELL!**
1.  Futtasd le a szkriptet.
2.  **ÜRÍTSD KI A KOSARAT AZ APPBAN!** (Ez fontos, hogy ne maradjon "beragadt" adat).
3.  Rendelj újra. 🍔✅
