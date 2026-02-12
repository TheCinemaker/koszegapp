# 🚨 HIBRID JAVÍTÁS (HA VEGYESEK AZ ID-K)

A hibaüzeneted (`uuid: "41"`) és a screenshot alapján úgy tűnik:
1.  Az **ÉTTERMEK** ID-ja UUID (kód). ✅
2.  De a **MENÜ ELEMEK** ID-ja valószínűleg SZÁM (pl. 41). ⚠️

Ez okozza a kavarodást. A lenti szkript "hibrid" módba állítja a rendszert:
*   Az étterem ID marad UUID.
*   A menü elem ID átvált SZÁM-ra (bigint).

---

### Teendő: Másold be és futtasd le a Supabase SQL Editorban:

```sql
-- 1. Lépés: Átállítjuk a rendelés tételeket, hogy elfogadjanak SZÁMOKAT is (ha eddig UUID volt)
-- FIGYELEM: Ha volt ott már UUID, az NULL lesz, de most a működés a cél!
ALTER TABLE order_items 
ALTER COLUMN menu_item_id TYPE bigint USING (
    CASE 
        WHEN menu_item_id::text ~ '^[0-9]+$' THEN menu_item_id::text::bigint 
        ELSE NULL 
    END
);

-- 2. Lépés: Frissítjük a rendelés funkciót a HIBRID működéshez
CREATE OR REPLACE FUNCTION place_order_full(
    p_restaurant_id text, -- Lazább bemenet (szöveg), amit majd UUID-re konvertálunk
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
    -- Étterem ID konvertálása UUID-re (mert a screenshoton láttuk, hogy az UUID)
    BEGIN
        v_rest_uuid := p_restaurant_id::uuid;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Hibás étterem ID (nem UUID): %', p_restaurant_id;
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

    -- 2. Tételek mentése (ITT A VÁLTOZÁS: BIGINT-ként kezeljük a menüt!)
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
            (v_item->>'id')::bigint, -- <--- SZÁMKÉNT (bigint) mentjük!
            (v_item->>'quantity')::int,
            (v_item->>'price')::numeric,
            v_item->>'name'
        );
    END LOOP;

    -- 3. Pontok
    IF p_user_id IS NOT NULL THEN
        v_points_to_add := FLOOR(p_total_price / 100);
        UPDATE koszegpass_users SET points = points + v_points_to_add WHERE id = p_user_id;
    END IF;

    RETURN json_build_object(
        'order_id', v_order_id, 'status', 'success', 'points_awarded', v_points_to_add
    );
END;
$$;

GRANT EXECUTE ON FUNCTION place_order_full TO anon, authenticated, service_role;
```

**Ez a legbiztosabb tippem a "41"-es hiba alapján.** Próbáld ki! 🛠️
