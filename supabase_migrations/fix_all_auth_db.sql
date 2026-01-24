-- COMPREHENSIVE FIX FOR 500 ERROR
-- 1. Ensure Columns Exist (Idempotent)
alter table public.koszegpass_users 
add column if not exists phone text;

alter table public.koszegpass_users 
add column if not exists address text;

-- 2. Drop and Recreate the Auth Trigger Function with Robust Logic
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  -- KőszegPass User (Client)
  if new.raw_user_meta_data->>'role' = 'koszegpass' then
    
    -- A) Handle KőszegPass Table
    -- Try update (Adoption of orphan row with same username)
    update public.koszegpass_users 
    set id = new.id, full_name = new.raw_user_meta_data->>'full_name'
    where username = new.raw_user_meta_data->>'nickname';
    
    -- If no row found, insert new one
    if not found then
        insert into public.koszegpass_users (id, username, full_name, phone, address)
        values (
            new.id, 
            new.raw_user_meta_data->>'nickname',
            new.raw_user_meta_data->>'full_name',
            null, 
            null
        )
        -- Safety net: if ID collides (shouldn't happen on new user), do nothing
        on conflict (id) do nothing;
    end if;

    -- B) Handle Public Profiles Table (Legacy/Shared)
    -- Try update (Adoption of orphan row)
    update public.profiles
    set id = new.id, full_name = new.raw_user_meta_data->>'full_name'
    where username = new.raw_user_meta_data->>'nickname';
    
    -- If no row found, insert new one
    if not found then
        insert into public.profiles (id, username, full_name, role)
        values (
            new.id, 
            new.raw_user_meta_data->>'nickname',
            new.raw_user_meta_data->>'full_name',
            'client'
        )
        on conflict (id) do nothing;
    end if;
    
  -- Restaurant Owner
  elsif new.raw_user_meta_data->>'role' = 'restaurant' then
    insert into public.profiles (id, role, full_name, username)
    values (
      new.id, 
      'restaurant',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nickname'
    ) on conflict (id) do nothing;
    
  -- Provider / Partner
  elsif new.raw_user_meta_data->>'role' = 'provider' then
     insert into public.profiles (id, role, full_name, username)
    values (
      new.id, 
      'provider',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nickname'
    ) on conflict (id) do nothing;
    
  -- Fallback (Generic Client)
  else
    insert into public.profiles (id, full_name, username, role)
    values (
      new.id, 
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nickname',
      'client'
    ) on conflict (id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;
