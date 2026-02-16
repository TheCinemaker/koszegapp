-- Enable Realtime on orders table
-- This allows clients to subscribe to INSERT, UPDATE, DELETE events

ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
