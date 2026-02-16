-- Add RLS policies for order_items table
-- This allows restaurant owners and users to view order items

-- Allow users to view items from their own orders
CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
  )
);

-- Allow restaurant owners to view order items for their restaurant's orders
CREATE POLICY "Restaurant owners can view order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    JOIN restaurants ON restaurants.id = orders.restaurant_id
    WHERE orders.id = order_items.order_id 
    AND restaurants.owner_id = auth.uid()
  )
);
