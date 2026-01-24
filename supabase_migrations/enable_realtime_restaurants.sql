-- Enable Realtime for Restaurants Table
-- This allows customers to see Delivery Time updates instantly.

-- 1. Enable Replication
alter table public.restaurants replica identity full;

-- 2. Add to Publication (Safe Block)
do $$
begin
  alter publication supabase_realtime add table public.restaurants;
exception
  when duplicate_object then null;
  when others then null;
end;
$$;
