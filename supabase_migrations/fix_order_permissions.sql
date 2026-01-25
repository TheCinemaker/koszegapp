-- FIX: Allow Restaurant Owners to Update Order Status
-- Run this in SQL Editor to fix the issue where admin changes revert on refresh.

-- 1. Create Policy for Restaurant Owners to UPDATE orders
-- This checks if the user is the owner of the restaurant linked to the order.
CREATE POLICY "Restaurant Owners Update Orders" ON public.orders
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants r 
        WHERE r.id = orders.restaurant_id 
        AND r.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.restaurants r 
        WHERE r.id = orders.restaurant_id 
        AND r.owner_id = auth.uid()
    )
);

SELECT '✅ Order Update Permissions Fixed - Try Admin Panel Again' as status;
