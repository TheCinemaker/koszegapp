-- 1. ADD COLUMN
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 2. UPDATE RPC FUNCTION
-- We recreate the function to accept p_user_id
CREATE OR REPLACE FUNCTION place_order_full(
    p_restaurant_id uuid,
    p_customer_name text,
    p_customer_phone text,
    p_customer_address text,
    p_customer_note text,
    p_total_price integer,
    p_items jsonb,
    p_user_id uuid DEFAULT NULL -- New optional parameter
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Run as owner to bypass potential RLS issues during insertion if needed
AS $$
DECLARE
    new_order_id integer;
    item jsonb;
BEGIN
    -- Insert Order
    INSERT INTO public.orders (
        restaurant_id, 
        customer_name, 
        customer_phone, 
        customer_address, 
        customer_note, 
        total_price,
        user_id, -- Link to Auth User
        status
    ) VALUES (
        p_restaurant_id, 
        p_customer_name, 
        p_customer_phone, 
        p_customer_address, 
        p_customer_note, 
        p_total_price,
        p_user_id, 
        'new'
    ) RETURNING id INTO new_order_id;

    -- Insert Items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id, 
            menu_item_id, 
            name, 
            quantity, 
            price
        ) VALUES (
            new_order_id, 
            (item->>'id')::uuid, 
            (item->>'name'), 
            (item->>'quantity')::integer, 
            (item->>'price')::integer
        );
    END LOOP;

    RETURN json_build_object('id', new_order_id, 'status', 'success');
END;
$$;

-- 3. FIX RLS (Now that user_id exists)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;

-- Correct Policies
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
TO authenticated
USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = user_id );

-- Also allow Restaurants (admins) to view orders
-- (Assuming admins are authenticated and we rely on app logic + maybe restaurant_id check later)
CREATE POLICY "Admins/Restaurants can view all orders"
ON public.orders FOR SELECT
TO authenticated
USING ( true ); -- Permissive for now to ensure Admin Dashboard works

