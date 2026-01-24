-- AGGRESSIVE CLEAN & FIX
-- 1. Drop ALL potential legacy triggers on auth.users
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists handle_new_user_trigger on auth.users;
drop trigger if exists "on_auth_user_created" on auth.users; -- Quote check

-- 2. Drop the function to ensure clean replacement
drop function if exists public.handle_new_user();

-- 3. Ensure Table Schema is Correct
alter table public.koszegpass_users 
add column if not exists phone text;

alter table public.koszegpass_users 
add column if not exists address text;

-- 4. Recreate Function with "Adoption" Logic
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
        on conflict do nothing;
    end if;

    -- B) Handle Public Profiles Table (Legacy/Shared)
    update public.profiles
    set id = new.id, full_name = new.raw_user_meta_data->>'full_name'
    where username = new.raw_user_meta_data->>'nickname';
    
    if not found then
        insert into public.profiles (id, username, full_name, role)
        values (
            new.id, 
            new.raw_user_meta_data->>'nickname',
            new.raw_user_meta_data->>'full_name',
            'client'
        )
        on conflict do nothing;
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

-- 5. Re-Attach Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
