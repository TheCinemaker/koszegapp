-- Create a stored procedure to handle order placement atomically and bypass RLS issues
CREATE OR REPLACE FUNCTION place_order_full(
    p_restaurant_id uuid,
    p_customer_name text,
    p_customer_phone text,
    p_customer_address text,
    p_customer_note text,
    p_total_price integer,
    p_items jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (bypasses RLS)
AS $$
DECLARE
    new_order_id integer;
    item_record jsonb;
BEGIN
    -- 1. Insert Order
    INSERT INTO orders (
        restaurant_id, 
        customer_name, 
        customer_phone, 
        customer_address, 
        customer_note, 
        total_price,
        status
    )
    VALUES (
        p_restaurant_id,
        p_customer_name,
        p_customer_phone,
        p_customer_address,
        p_customer_note,
        p_total_price,
        'new'
    )
    RETURNING id INTO new_order_id;

    -- 2. Insert Items
    -- p_items is expected to be an array of objects: { id (menu_item_id), quantity, price, name }
    FOR item_record IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
            order_id,
            menu_item_id,
            name,
            quantity,
            price
        )
        VALUES (
            new_order_id,
            (item_record->>'id')::uuid,
            item_record->>'name',
            (item_record->>'quantity')::integer,
            (item_record->>'price')::integer
        );
    END LOOP;

    -- 3. Return result
    RETURN json_build_object('id', new_order_id, 'status', 'success');
END;
$$;
