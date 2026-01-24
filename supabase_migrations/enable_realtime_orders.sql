-- Enable Realtime for Orders Table (Fixed Syntax)

-- 1. Enable Replication (Required for Realtime)
alter table public.orders replica identity full;

-- 2. Add to Realtime Publication (Safe Block)
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null; -- Ignore if already added
  when others then null; -- Safely ignore other add errors to keep script running
end;
$$;

-- 3. Also verify 'order_items'
alter table public.order_items replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.order_items;
exception
  when duplicate_object then null;
  when others then null;
end;
$$;
