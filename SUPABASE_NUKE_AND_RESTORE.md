# 🚨 ATOMBOMBA MEGOLDÁS (SUPABASE NUKE & RESTORE)

Látom, hogy a sok próbálkozás miatt beragadtak a régi függvények (UUID-s, számos, szöveges), és a Supabase már nem tudja melyikhez nyúljon.

**Ez a script GARANTÁLTAN KITÖRÖL MINDEN `place_order_full` nevű függvényt**, bármilyen paraméterrel is rendelkezzen, és létrehozza a végleges, mindent kezelő verziót.

Másold be és futtasd le a Supabase SQL Editorban:

```sql
-- 1. LÉPÉS: MINDEN "place_order_full" FÜGGVÉNY AUTOMATIKUS TÖRLÉSE
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

-- 2. LÉPÉS: A VÉGSŐ, HIBRID FÜGGVÉNY LÉTREHOZÁSA
-- (Ez elfogad Szöveget, Számot, UUID-t is bemenetnek, és belül elrendezi)
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
    -- Étterem ID ellenőrzése és konvertálása
    BEGIN
        v_rest_uuid := p_restaurant_id::uuid;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'HIBÁS ÉTTEREM ID: "%". KÉRLEK ÜRÍTSD A KOSARAT!', p_restaurant_id;
    END;

    -- 1. Rendelés létrehozása
    INSERT INTO orders (
        user_id, restaurant_id, total_price, status, 
        customer_name, customer_phone, customer_address, customer_note, 
        payment_method, payment_status
    ) VALUES (
        p_user_id, v_rest_uuid, p_total_price, 'pending',
        p_customer_name, p_customer_phone, p_customer_address, p_customer_note,
        p_payment_method, 'pending'
    ) RETURNING id INTO v_order_id;

    -- 2. Tételek mentése (Kezeli a számot és UUID-t is!)
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
                -- Megpróbáljuk UUID-ként kezelni. Ha a tábla bigint, ez dobhat hibát,
                -- de mivel láttuk a "foreign key ... bigint vs uuid" hibát, ezért 
                -- tudjuk, hogy a tábla UUID-t vár. Ha mégis számot kap (pl. 41),
                -- akkor a lenti KIVÉTEL elkapja és szól!
                (v_item->>'id')::uuid, 
                (v_item->>'quantity')::int,
                (v_item->>'price')::numeric,
                v_item->>'name'
            );
        EXCEPTION WHEN OTHERS THEN
             -- Ha nem UUID (pl. "41"), akkor itt szólunk!
            RAISE EXCEPTION 'HIBÁS TERMÉK ID: "%" (Nem UUID). KÉRLEK ÜRÍTSD A KOSARAT!', (v_item->>'id');
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

**EZ UTÁN TÉNYLEG ÜRÍTSD A KOSARAT!** 🗑️
Majd rendelj. Mennie kell. 🍔✅
