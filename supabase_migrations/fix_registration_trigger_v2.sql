-- FIX: Registration Trigger Robustness
-- This script updates the 'handle_new_user' function to be idempotent (safe to retry).
-- It adds ON CONFLICT DO UPDATE clauses to prevent 'Database error' when rows already exist (or partial state).

create or replace function public.handle_new_user() 
returns trigger as $$
begin
  -- KőszegPass User (Client)
  if new.raw_user_meta_data->>'role' = 'koszegpass' then
    
    -- 1. Upsert into KőszegPass Users
    insert into public.koszegpass_users (id, username, full_name)
    values (
      new.id, 
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'full_name'
    )
    on conflict (id) do update set
      full_name = excluded.full_name,
      username = excluded.username; -- Explicitly update to ensure consistency

    -- 2. Upsert into public.profiles (as 'client') for system compatibility
    insert into public.profiles (id, username, full_name, role)
    values (
      new.id, 
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'full_name',
      'client'
    )
    on conflict (id) do update set
      full_name = excluded.full_name,
      role = 'client'; -- Ensure role is client

  -- Restaurant Owner
  elsif new.raw_user_meta_data->>'role' = 'restaurant' then
    insert into public.profiles (id, role, full_name, username)
    values (
      new.id, 
      'restaurant',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nickname'
    )
    on conflict (id) do update set
      full_name = excluded.full_name,
      role = 'restaurant';

  -- Provider / Partner
  elsif new.raw_user_meta_data->>'role' = 'provider' then
     insert into public.profiles (id, role, full_name, username)
    values (
      new.id, 
      'provider',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nickname'
    )
    on conflict (id) do update set
      full_name = excluded.full_name,
      role = 'provider';

  -- Fallback (Generic Client)
  else
    insert into public.profiles (id, full_name, username, role)
    values (
      new.id, 
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nickname',
      'client'
    )
    on conflict (id) do update set
      full_name = excluded.full_name;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Re-verify trigger existence (optional, but good practice)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
