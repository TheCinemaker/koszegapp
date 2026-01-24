-- NUCLEAR RESET & REBUILD
-- WARNING: This will delete ALL user data (Profiles, Providers, KőszegPass Users).
-- It allows for a clean start with the correct Schema.

-- 1. Drop Dependencies & Triggers
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2. Drop Tables (Cascade to remove dependencies)
-- We use CASCADE to ensure any Linked tables (like Appointments) that might reference these are also handled (or at least the link is broken safely).
drop table if exists public.providers cascade;
drop table if exists public.koszegpass_users cascade;
drop table if exists public.profiles cascade;

-- 3. Recreate TABLES with Correct Schema

-- A) Public Profiles (Legacy / Shared ID)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  role text default 'client' check (role in ('client', 'provider', 'restaurant', 'admin', 'partner', 'var', 'varos', 'tourinform')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;
create policy "Public Usage" on public.profiles for select using (true);
create policy "Self Update" on public.profiles for update using (auth.uid() = id);
create policy "Self Insert" on public.profiles for insert with check (auth.uid() = id);

-- B) KőszegPass Users (New, Isolated Table)
create table public.koszegpass_users (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,         -- Used for Login
  full_name text,
  phone text,                   -- New Field for Food/Delivery
  address text,                 -- New Field for Food/Delivery
  points int default 0,
  rank text default 'Felfedező',
  created_at timestamptz default now()
);

-- Enable RLS for KőszegPass
alter table public.koszegpass_users enable row level security;
create policy "Self View" on public.koszegpass_users for select using (auth.uid() = id);
create policy "Self Update" on public.koszegpass_users for update using (auth.uid() = id);
create policy "Self Insert" on public.koszegpass_users for insert with check (auth.uid() = id);

-- C) Providers (Business Data)
create table public.providers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  business_name text,
  category text,
  slug text unique,
  created_at timestamptz default now()
);

-- Enable RLS for Providers
alter table public.providers enable row level security;
create policy "Public View" on public.providers for select using (true);
create policy "Owner Update" on public.providers for update using (auth.uid() = user_id);
create policy "Owner Insert" on public.providers for insert with check (auth.uid() = user_id);

-- 4. Recreate Auth Trigger (The Logic Hub)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  -- KőszegPass User (Client / Guest)
  if new.raw_user_meta_data->>'role' = 'koszegpass' then
    
    -- Insert into KőszegPass Users
    insert into public.koszegpass_users (id, username, full_name, phone, address)
    values (
      new.id, 
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'full_name',
      null, 
      null
    ) on conflict do nothing; -- Should not conflict on a clean install, but safe to keep

    -- Insert into Public Profiles (Mirror)
    insert into public.profiles (id, username, full_name, role)
    values (
      new.id, 
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'full_name',
      'client'
    ) on conflict do nothing;

  -- Restaurant Owner
  elsif new.raw_user_meta_data->>'role' = 'restaurant' then
    insert into public.profiles (id, role, full_name, username)
    values (
      new.id, 
      'restaurant',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nickname'
    ) on conflict do nothing;

  -- Provider / Partner
  elsif new.raw_user_meta_data->>'role' = 'provider' then
     insert into public.profiles (id, role, full_name, username)
    values (
      new.id, 
      'provider',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nickname'
    ) on conflict do nothing;

  -- Fallback (Internal / Other)
  else
    insert into public.profiles (id, full_name, username, role)
    values (
      new.id, 
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nickname',
      'client'
    ) on conflict do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- 5. Attach Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. (Optional) Clear Auth Users - WARNING
-- Note: You generally cannot run "DELETE FROM auth.users" from the SQL Editor due to permissions/FKs unless you are Super Admin.
-- It is recommended to delete users manually from the Supabase Authentication Dashboard to be 100% clean.
-- However, if you have permissions, you can uncomment:
-- delete from auth.users;
