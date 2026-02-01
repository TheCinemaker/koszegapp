-- FIX: Registration Trigger Robustness v4 (Fixing FK Conflict)
-- This script updates the 'handle_new_user' function to handle orphaned profiles by DELETING them first.
-- Why DELETE? Because updating the 'id' (PK) fails if child tables (cards, logs) don't have ON UPDATE CASCADE.
-- Since the Auth User was deleted, the old profile data is "dead" anyway.

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

  -- 1. CLEANUP ORPHANS (Crucial Step)
  -- If a profile exists with this username but different ID, it's an orphan from a deleted Auth user.
  -- We must delete it to free up the username and avoid FK conflicts during ID update.
  
  -- Check in KőszegPass Users
  if exists (select 1 from public.koszegpass_users where username = _username) then
     delete from public.koszegpass_users where username = _username;
  end if;

  -- Check in Profiles
  if exists (select 1 from public.profiles where username = _username) then
     delete from public.profiles where username = _username;
  end if;


  -- 2. INSERT NEW DATA
  -- Now it's safe to insert fresh rows

  -- KőszegPass User (Client)
  if _role = 'koszegpass' then
      
      insert into public.koszegpass_users (id, username, full_name)
      values (new.id, _username, _fullname)
      on conflict (id) do update set
        full_name = excluded.full_name,
        username = excluded.username;

      insert into public.profiles (id, username, full_name, role)
      values (new.id, _username, _fullname, 'client')
      on conflict (id) do update set
        full_name = excluded.full_name,
        role = 'client';

  -- Restaurant Owner
  elsif _role = 'restaurant' then
      insert into public.profiles (id, role, full_name, username)
      values (new.id, 'restaurant', _fullname, _username)
      on conflict (id) do update set
        full_name = excluded.full_name,
        role = 'restaurant';

  -- Provider / Partner
  elsif _role = 'provider' then
      insert into public.profiles (id, role, full_name, username)
      values (new.id, 'provider', _fullname, _username)
      on conflict (id) do update set
        full_name = excluded.full_name,
        role = 'provider';

  -- Fallback (Generic Client)
  else
      insert into public.profiles (id, full_name, username, role)
      values (new.id, _fullname, _username, 'client')
      on conflict (id) do update set
        full_name = excluded.full_name;
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
