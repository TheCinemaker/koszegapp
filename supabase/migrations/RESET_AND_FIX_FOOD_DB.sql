-- ⚠️ WARNING: This script will delete all existing ORDERS (not menu items) to fix the schema.
-- It ensures the tables have the correct columns and the RPC function works.

-- 1. DROP EXISTING ORDER TABLES AND FUNCTIONS (Clean Slate for Orders)
DROP FUNCTION IF EXISTS place_order_full;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;

-- 2. RECREATE 'orders' TABLE
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id), -- Can be null for guest checkout
    restaurant_id uuid REFERENCES restaurants(id),
    total_price numeric NOT NULL,
    status text DEFAULT 'pending', -- pending, accepted, preparing, ready, delivered, rejected, cancelled
    customer_name text,
    customer_phone text,
    customer_address text,
    customer_note text,
    payment_method text DEFAULT 'cash', -- cash, card_terminal, szep_card
    payment_status text DEFAULT 'pending' -- pending, paid
);

-- 3. RECREATE 'order_items' TABLE
CREATE TABLE order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id uuid REFERENCES menu_items(id), -- Enforce valid menu item
    quantity int NOT NULL,
    price numeric NOT NULL,
    name text NOT NULL
);

-- 4. ENABLE RLS (Row Level Security) - OPTIONAL BUT RECOMMENDED
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES (Allow users to see their own orders, Restaurants to see their orders)
-- Allow Users to INSERT (Place order)
CREATE POLICY "Users can insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
-- Allow Users to VIEW their own orders
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow Restaurants (Owners) to VIEW orders for their restaurant
-- (Assuming 'restaurants' table has 'owner_id')
CREATE POLICY "Restaurant owners can view orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM restaurants WHERE id = orders.restaurant_id AND owner_id = auth.uid())
);
-- Allow Restaurants to UPDATE status
CREATE POLICY "Restaurant owners can update orders" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM restaurants WHERE id = orders.restaurant_id AND owner_id = auth.uid())
);


-- 6. RECREATE THE RPC FUNCTION (Securely)
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
SECURITY DEFINER -- Runs with elevated privileges to bypass RLS complexity during insert
SET search_path = public
AS $$
DECLARE
    v_order_id uuid;
    v_item jsonb;
    v_points_to_add int;
BEGIN
    -- 1. Insert Order
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
        'new', -- Default status for new orders
        p_customer_name,
        p_customer_phone,
        p_customer_address,
        p_customer_note,
        p_payment_method,
        'pending'
    ) RETURNING id INTO v_order_id;

    -- 2. Insert Items
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

    -- 3. Award Points (Only if registered)
    IF p_user_id IS NOT NULL THEN
        v_points_to_add := FLOOR(p_total_price / 100);
        
        -- Check if user exists in koszegpass_users (to prevent error)
        IF EXISTS (SELECT 1 FROM koszegpass_users WHERE id = p_user_id) THEN
            UPDATE koszegpass_users
            SET points = points + v_points_to_add
            WHERE id = p_user_id;
        END IF;
    END IF;

    RETURN json_build_object(
        'order_id', v_order_id, 
        'status', 'success',
        'points_awarded', v_points_to_add
    );
END;
$$;
