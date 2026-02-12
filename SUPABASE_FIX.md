# 🚨 HIBA JAVÍTÁSA (42501 RLS Error)

A hiba oka: A felhasználónak nincs joga közvetlenül írni az `orders` táblába (Row Level Security).
A megoldás: A rendelés funkciót "Admin módban" kell futtatni (`SECURITY DEFINER`).

## Lépések:

1.  Nyisd meg a **Supabase Dashboard**-ot.
2.  Menj az **SQL Editor** menüpontba.
3.  Kattints a **New Query** gombra.
4.  Másold be az alábbi kódot és futtasd le (**Run**):

```sql
-- JAVÍTÁS: SECURITY DEFINER HOZZÁADÁSA
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
SECURITY DEFINER -- <--- EZT ADJUK HOZZÁ!
SET search_path = public
AS $$
DECLARE
    v_order_id uuid;
    v_item jsonb;
    v_points_to_add int;
BEGIN
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
        p_restaurant_id,
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
            (v_item->>'id')::uuid,
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
```

Miután lefuttattad ("Success"), próbáld újra a rendelést az appban! Működnie kell. ✅
