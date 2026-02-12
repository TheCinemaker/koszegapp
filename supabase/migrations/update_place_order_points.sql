CREATE OR REPLACE FUNCTION place_order_full(
    p_restaurant_id uuid,
    p_customer_name text,
    p_customer_phone text,
    p_customer_address text,
    p_customer_note text,
    p_total_price numeric,
    p_items jsonb,
    p_user_id uuid,
    p_payment_method text DEFAULT 'cash' -- 'cash', 'card_terminal', 'szep_card'
) RETURNS jsonb AS $$
DECLARE
    v_order_id uuid;
    v_item jsonb;
    v_points_to_add int;
BEGIN
    -- 1. Create Order
    INSERT INTO orders (
        user_id, 
        restaurant_id, 
        total_price, 
        status, 
        customer_name, 
        customer_phone, 
        customer_address, 
        customer_note,
        payment_method, -- New column needed
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
        'pending' -- Will be paid upon delivery
    ) RETURNING id INTO v_order_id;

    -- 2. Insert Order Items
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

    -- 3. Award Points (100 HUF = 1 Point)
    -- Only for registered users
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
$$ LANGUAGE plpgsql;
