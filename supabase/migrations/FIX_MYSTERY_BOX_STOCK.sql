-- 1. DROP EXISTING FUNCTION
DROP FUNCTION IF EXISTS place_order_full;

-- 2. CREATE UPDATED FUNCTION WITH MYSTERY BOX STOCK MANAGEMENT
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
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id uuid;
    v_item jsonb;
    v_points_to_add int;
BEGIN
    -- 1. STOCK VALIDATION (Check all mystery boxes in one go)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        IF (v_item->>'is_mystery_box')::boolean = true THEN
            IF EXISTS (
                SELECT 1 FROM restaurants 
                WHERE id = p_restaurant_id 
                AND EXISTS (
                    SELECT 1 FROM jsonb_array_elements(mystery_box) AS box 
                    WHERE box->>'id' = v_item->>'mystery_box_id' 
                    AND (box->>'items_left')::int < (v_item->>'quantity')::int
                )
            ) THEN
                RAISE EXCEPTION 'ELFO_MYSTERY: Nincs elég készlet a(z) % termékből!', v_item->>'name';
            END IF;
        END IF;
    END LOOP;

    -- 2. CREATE ORDER
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

    -- 3. RECORD ITEMS AND REDUCE MYSTERY STOCK
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Insert into order_items
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

        -- If it's a mystery box, decrement the stock in restaurants table
        IF (v_item->>'is_mystery_box')::boolean = true THEN
            UPDATE restaurants
            SET mystery_box = (
                SELECT jsonb_agg(
                    CASE 
                        WHEN box->>'id' = v_item->>'mystery_box_id' THEN
                            jsonb_set(box, '{items_left}', ((box->>'items_left')::int - (v_item->>'quantity')::int)::text::jsonb)
                        ELSE box
                    END
                )
                FROM jsonb_array_elements(mystery_box) AS box
            )
            WHERE id = p_restaurant_id;
        END IF;
    END LOOP;

    -- 4. AWARD POINTS (100 HUF = 1 Point)
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
