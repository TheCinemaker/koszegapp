# 🚨 VÉGSŐ SQL SCRIPT (BIZTOS AMI BIZTOS)

Ha az előzőek (`SUPABASE_UNLOCK.md` - RLS tiltás) megvoltak, és ÜRÍTETTED a kosarat, de MÉG MINDIG hiba van, akkor futtasd le ezt az **utolsó módosítást**.

**Ez a szkript átírja a függvényt, hogy "szöveges" (TEXT) ID-kat fogadjon el, és belül alakítsa át őket.** Így nem száll el azonnal a típus ellenőrzésen, ha valami furcsa formátum érkezik.

Másold be és futtasd le a Supabase SQL Editorban:

```sql
-- Először töröljük a régit
DROP FUNCTION IF EXISTS place_order_full;

-- Újra létrehozzuk, de most TEXT típusú ID-kat vár (lazább ellenőrzés)
CREATE OR REPLACE FUNCTION place_order_full(
    p_restaurant_id text, -- <--- TEXT lett, nem UUID (így nem dob hibát a bemenetre)
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
    v_item jsonb;
    v_points_to_add int;
    v_rest_uuid uuid;
BEGIN
    -- Átalakítjuk az ID-t UUID-ra (biztonságosan)
    BEGIN
        v_rest_uuid := p_restaurant_id::uuid;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Hibás étterem ID formátum: %', p_restaurant_id;
    END;

    -- 1. Rendelés létrehozása
    INSERT INTO orders (
        user_id, 
        restaurant_id, 
        total_price, 
        status, 
        customer_name, 
        customer_phone, 
        customer_address, 
        customer_note,
        payment_method, 
        payment_status
    ) VALUES (
        p_user_id,
        v_rest_uuid, -- A konvertált UUID megy be
        p_total_price,
        'pending',
        p_customer_name,
        p_customer_phone,
        p_customer_address,
        p_customer_note,
        p_payment_method,
        'pending'
    ) RETURNING id INTO v_order_id;

    -- 2. Tételek mentése
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
            order_id,
            menu_item_id,
            quantity,
            price,
            name
        ) VALUES (
            v_order_id,
            (v_item->>'id')::uuid, -- A menü elemekél is feltételezzük az UUID-t
            (v_item->>'quantity')::int,
            (v_item->>'price')::numeric,
            v_item->>'name'
        );
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

Ezután próbáld a rendelést! 🤞🍔
