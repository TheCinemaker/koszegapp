-- 1. Restore 'orders' table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id),
    restaurant_id uuid, -- Assuming referenced table exists, otherwise might need loose coupling or check
    total_price numeric,
    status text DEFAULT 'pending', -- pending, accepted, preparing, delivering, completed, cancelled
    customer_name text,
    customer_phone text,
    customer_address text,
    customer_note text,
    payment_method text DEFAULT 'cash', -- cash, card_terminal, szep_card
    payment_status text DEFAULT 'pending' -- pending, paid
);

-- 2. Restore 'order_items' table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id uuid,
    quantity int,
    price numeric,
    name text
);

-- 3. Ensure columns exist (redundant if table just created, but safe for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
        ALTER TABLE orders ADD COLUMN payment_method text DEFAULT 'cash';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
        ALTER TABLE orders ADD COLUMN payment_status text DEFAULT 'pending';
    END IF;
END $$;

-- 4. Recreate the RPC function
DROP FUNCTION IF EXISTS place_order_full;

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
    -- Insert Order
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

    -- Insert Items
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

    -- Award Points
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
