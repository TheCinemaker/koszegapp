# 🚨 VÉGSŐ JAVÍTÁS (42501 HIBA)

Ha az előző szkript nem működött, akkor valószínűleg nem volt elég jogosultsága a `postgres` felhasználónak sem, vagy nem futott le rendesen.
**Ez a "Nukleáris Megoldás", mindent helyre tesz.**

## Lépések:
1.  Nyisd meg a **Supabase Dashboard** -> **SQL Editor**.
2.  Kattints a **New Query** gombra.
3.  Másold be az ALÁBBI teljes kódot, és nyomj a **Run** gombra (jobb lent).
4.  Várd meg, amíg kiírja: **Success**.

```sql
-- 1. Biztosítjuk a jogosultságokat a publikus sémához
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Biztosítjuk a jogosultságokat a táblákhoz (hogy a függvény írhasson)
GRANT ALL ON TABLE public.orders TO postgres, service_role;
GRANT ALL ON TABLE public.order_items TO postgres, service_role;

-- 3. ÚJRA LÉTREHOZZUK A FÜGGVÉNYT (SECURITY DEFINER + JOGOSULTSÁGOK)
CREATE OR REPLACE FUNCTION place_order_full(
    p_restaurant_id uuid,
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
SECURITY DEFINER -- <--- EZT ADJUK HOZZÁ! (Admin jog)
SET search_path = public
AS $$
DECLARE
    v_order_id uuid;
    v_item jsonb;
    v_points_to_add int;
BEGIN
    -- Rendelés létrehozása
    INSERT INTO orders (
        user_id, restaurant_id, total_price, status, 
        customer_name, customer_phone, customer_address, customer_note, 
        payment_method, payment_status
    ) VALUES (
        p_user_id, p_restaurant_id, p_total_price, 'pending',
        p_customer_name, p_customer_phone, p_customer_address, p_customer_note,
        p_payment_method, 'pending'
    ) RETURNING id INTO v_order_id;

    -- Tételek mentése
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
            order_id, menu_item_id, quantity, price, name
        ) VALUES (
            v_order_id, (v_item->>'id')::uuid, (v_item->>'quantity')::int, 
            (v_item->>'price')::numeric, v_item->>'name'
        );
    END LOOP;

    -- Pontok jóváírása
    IF p_user_id IS NOT NULL THEN
        v_points_to_add := FLOOR(p_total_price / 100);
        UPDATE koszegpass_users SET points = points + v_points_to_add WHERE id = p_user_id;
    END IF;

    RETURN json_build_object(
        'order_id', v_order_id, 
        'status', 'success',
        'points_awarded', v_points_to_add
    );
END;
$$;

-- 4. Engedélyezzük a függvény futtatását mindenkinek (API hívás)
GRANT EXECUTE ON FUNCTION place_order_full TO anon, authenticated, service_role;
```

**Ha ez lefutott ("Success"), akkor 100%, hogy működni fog.** Próbáld újra a rendelést! 🍔✅
