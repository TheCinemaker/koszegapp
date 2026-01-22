-- Enable Realtime for restaurants table
alter publication supabase_realtime add table restaurants;

-- Ensure it's enabled for orders too just in case
alter publication supabase_realtime add table orders;
