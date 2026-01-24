-- Consolidated Auth Setup
-- Run this in Supabase SQL Editor to fully configure the Auth System for KőszegPass + Providers.

-- 1. Create KőszegPass Users Table (if not exists)
create table if not exists public.koszegpass_users (
  id uuid references auth.users not null primary key,
  username text unique,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.koszegpass_users enable row level security;

-- Policies for KőszegPass Users
drop policy if exists "Users can view their own koszegpass profile." on public.koszegpass_users;
create policy "Users can view their own koszegpass profile." on public.koszegpass_users for select using ( auth.uid() = id );

drop policy if exists "Users can insert their own koszegpass profile." on public.koszegpass_users;
create policy "Users can insert their own koszegpass profile." on public.koszegpass_users for insert with check ( auth.uid() = id );

drop policy if exists "Users can update their own koszegpass profile." on public.koszegpass_users;
create policy "Users can update their own koszegpass profile." on public.koszegpass_users for update using ( auth.uid() = id );

-- 2. Create/Update the Auth Handling Function
-- This function handles ALL user creations (Client, Provider, Restaurant)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  -- KőszegPass User (Client) -- The new standard for Guests
  if new.raw_user_meta_data->>'role' = 'koszegpass' then
    
    -- 1. Try to adopt existing KőszegPass profile (handle re-registration)
    update public.koszegpass_users 
    set id = new.id, full_name = new.raw_user_meta_data->>'full_name'
    where username = new.raw_user_meta_data->>'nickname';

    if not found then
        insert into public.koszegpass_users (id, username, full_name, phone, address)
        values (
            new.id, 
            new.raw_user_meta_data->>'nickname',
            new.raw_user_meta_data->>'full_name',
            null, 
            null
        );
    end if;

    -- 2. Try to adopt existing Profile (Legacy)
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
        );
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

-- 3. Bind Trigger to Auth Table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
