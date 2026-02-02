-- Enable Realtime for the orders table
-- This is REQUIRED for the restaurant admin to see orders instantly.

-- 1. Add table to publication
alter publication supabase_realtime add table orders;

-- 2. Ensure schema replication is on (usually default, but good to ensure)
alter table orders replica identity full;
