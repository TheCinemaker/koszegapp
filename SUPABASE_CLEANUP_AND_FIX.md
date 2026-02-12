# 🚨 TISZTÍTÓ ÉS VÉGSŐ JAVÍTÁS

Úgy tűnik, hogy a sok próbálkozás miatt most már **TÖBB** `place_order_full` függvény is van az adatbázisban (egy ami számokat vár, egy ami UUID-t, stb.), és a Supabase nem tudja melyiket törölje simán.

Ez a script **MINDEN VARÍÁCIÓT KITÖRÖL**, és létrehozza az egyetlen helyeset.

Masold be és futtasd le a Supabase SQL Editorban:

```sql
-- 1. MINDEN korábbi verzió törlése (hogy ne legyen ütközés)
DROP FUNCTION IF EXISTS place_order_full(uuid, text, text, text, text, numeric, jsonb, uuid, text);
DROP FUNCTION IF EXISTS place_order_full(bigint, text, text, text, text, numeric, jsonb, uuid, text);
DROP FUNCTION IF EXISTS place_order_full(text, text, text, text, text, numeric, jsonb, uuid, text);

-- 2. A VÉGSŐ, BIZTOS FÜGGVÉNY LÉTREHOZÁSA (Szöveges bemenet, okos hibakezelés)
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
    -- Étterem ID ellenőrzése
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

    -- 2. Tételek mentése
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
                (v_item->>'id')::uuid,
                (v_item->>'quantity')::int,
                (v_item->>'price')::numeric,
                v_item->>'name'
            );
        EXCEPTION WHEN OTHERS THEN
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

**Ezután:**
1.  **ÜRÍTSD KI A KOSARAT** (légyszi!).
2.  Próbáld a rendelést.

Most már tisztának kell lennie a pályának! 🧹✨
