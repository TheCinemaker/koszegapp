# 🚨 TISZTA VÍZ A POHÁRBA (VÉGSŐ JAVÍTÁS)

A hibaüzeneted (`foreign key constraint ...`) bebizonyította, hogy az adatbázisban **MINDEN UUID (kód)**.
Az átalakítás (`bigint`-re) ezért nem sikerült (és nem is szabad erőltetni, mert törné az adatkapcsolatokat).

A "41"-es szám **HIBÁS ADAT** a kosaradból (régi tesztből maradt).
Mivel az adatbázis UUID-t vár, a "41"-et nem fogadja el. Pont.

**MEGOLDÁS:**
1.  Futtasd le ezt a scriptet (ez visszaállítja a függvényt a helyes, UUID-s működésre, de **okosabb hibakezeléssel**).
2.  **ÜRÍTSD KI A KOSARAT!** (Ez a legfontosabb).
3.  Rendelj újra.

```sql
-- 1. Függvény törlése és újraírása (UUID-re optimalizálva, de szöveges bemenettel)
DROP FUNCTION IF EXISTS place_order_full;

CREATE OR REPLACE FUNCTION place_order_full(
    p_restaurant_id text, -- Szövegként jön be, hogy ne szálljon el azonnal
    p_customer_name text,
    p_customer_phone text,
    p_customer_address text,
    p_customer_note text,
    p_total_price numeric,
    p_items jsonb, -- A tételek JSON-ben jönnek
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
    -- 1. Étterem ID ellenőrzése és konvertálása
    BEGIN
        v_rest_uuid := p_restaurant_id::uuid;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'HIBÁS ÉTTEREM ID: "%". KÉRLEK ÜRÍTSD A KOSARAT!', p_restaurant_id;
    END;

    -- 2. Rendelés létrehozása (Orders tábla)
    INSERT INTO orders (
        user_id, restaurant_id, total_price, status, 
        customer_name, customer_phone, customer_address, customer_note, 
        payment_method, payment_status
    ) VALUES (
        p_user_id, v_rest_uuid, p_total_price, 'pending',
        p_customer_name, p_customer_phone, p_customer_address, p_customer_note,
        p_payment_method, 'pending'
    ) RETURNING id INTO v_order_id;

    -- 3. Tételek mentése (Order Items tábla)
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
                (v_item->>'id')::uuid, -- Itt próbáljuk meg UUID-re alakítani
                (v_item->>'quantity')::int,
                (v_item->>'price')::numeric,
                v_item->>'name'
            );
        EXCEPTION WHEN OTHERS THEN
            -- Ha egy tétel ID-ja nem UUID (pl. "41"), akkor itt szólunk!
            RAISE EXCEPTION 'HIBÁS TERMÉK ID: "%". KÉRLEK ÜRÍTSD A KOSARAT!', (v_item->>'id');
        END;
    END LOOP;

    -- 4. Pontok jóváírása
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
1.  Frissítsd a böngészőt.
2.  Nyisd meg a kosarat -> **TÖRLÉS** (Kuka ikon).
3.  Válassz éttermet -> Rendelj.

Így mennie kell! 🍔✅
