-- Enable Realtime for Menu Tables

-- 1. Enable Replication
alter table public.menu_items replica identity full;
alter table public.menu_categories replica identity full;

-- 2. Add to Publication (Use Safe Block)
do $$
begin
  alter publication supabase_realtime add table public.menu_items;
exception
  when duplicate_object then null;
  when others then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.menu_categories;
exception
  when duplicate_object then null;
  when others then null;
end;
$$;
