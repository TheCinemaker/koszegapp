-- FIX: Registration Trigger Robustness v3 (Fixing Re-registration)
-- This script updates the 'handle_new_user' function to handle orphaned profiles.
-- If a user was deleted from Auth but their profile remained (common in dev), 
-- re-registering with the same username creates a new ID but clashes on username UNIQUE constraint.
-- This script ADOPTS the old profile to the new ID.

create or replace function public.handle_new_user() 
returns trigger as $$
declare
  _username text;
  _fullname text;
  _role text;
begin
  _username := new.raw_user_meta_data->>'nickname';
  _fullname := new.raw_user_meta_data->>'full_name';
  _role := new.raw_user_meta_data->>'role';

  -- KőszegPass User (Client)
  if _role = 'koszegpass' then
    
    -- 1. Try to adopt existing KőszegPass profile (handle username conflict)
    update public.koszegpass_users 
    set id = new.id, full_name = _fullname
    where username = _username;

    if not found then
      -- Insert new if not found
      insert into public.koszegpass_users (id, username, full_name)
      values (new.id, _username, _fullname)
      on conflict (id) do update set -- Handle ID conflict if any
        full_name = excluded.full_name,
        username = excluded.username;
    end if;

    -- 2. Try to adopt existing Public Profile (handle username conflict)
    update public.profiles
    set id = new.id, full_name = _fullname, role = 'client'
    where username = _username;

    if not found then
      insert into public.profiles (id, username, full_name, role)
      values (new.id, _username, _fullname, 'client')
      on conflict (id) do update set
        full_name = excluded.full_name,
        role = 'client';
    end if;

  -- Restaurant Owner
  elsif _role = 'restaurant' then
    -- Adopt or Insert
    update public.profiles
    set id = new.id, full_name = _fullname, role = 'restaurant'
    where username = _username;

    if not found then
      insert into public.profiles (id, role, full_name, username)
      values (new.id, 'restaurant', _fullname, _username)
      on conflict (id) do update set
        full_name = excluded.full_name,
        role = 'restaurant';
    end if;

  -- Provider / Partner
  elsif _role = 'provider' then
     update public.profiles
     set id = new.id, full_name = _fullname, role = 'provider'
     where username = _username;

     if not found then
      insert into public.profiles (id, role, full_name, username)
      values (new.id, 'provider', _fullname, _username)
      on conflict (id) do update set
        full_name = excluded.full_name,
        role = 'provider';
     end if;

  -- Fallback (Generic Client)
  else
    update public.profiles
    set id = new.id, full_name = _fullname, role = 'client'
    where username = _username;

    if not found then
      insert into public.profiles (id, full_name, username, role)
      values (new.id, _fullname, _username, 'client')
      on conflict (id) do update set
        full_name = excluded.full_name;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Re-verify trigger existence
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
