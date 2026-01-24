-- Generic Auth Trigger to handle multiple roles (client, provider, restaurant, koszegpass)
-- This replaces any restrictive triggers that might be causing 500 errors on SignUp.

-- 1. Create a robust handler function
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  -- KőszegPass User (Client)
  if new.raw_user_meta_data->>'role' = 'koszegpass' then
    insert into public.koszegpass_users (id, username, full_name)
    values (
      new.id, 
      new.raw_user_meta_data->>'nickname',  -- We store username in 'nickname' metadata usually
      new.raw_user_meta_data->>'full_name'
    );
    
    -- Also create a public profile for backward compatibility (Time Gate / Appointments)
    insert into public.profiles (id, username, full_name, role)
    values (
      new.id, 
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'full_name',
      'client' -- Treat as standard client in the legacy system
    ) on conflict (id) do nothing; -- Prevent duplicates
    
  -- Restaurant Owner
  elsif new.raw_user_meta_data->>'role' = 'restaurant' then
    insert into public.profiles (id, role, full_name, username)
    values (
      new.id, 
      'restaurant',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nickname'
    );
    
  -- Provider / Partner
  elsif new.raw_user_meta_data->>'role' = 'provider' then
     insert into public.profiles (id, role, full_name, username)
    values (
      new.id, 
      'provider',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nickname'
    );
    
  -- Fallback (Default Client)
  else
    insert into public.profiles (id, full_name, username, role)
    values (
      new.id, 
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nickname',
      'client'
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- 2. Recreate the trigger
-- Drop existing trigger if it exists (names may vary, so we try common ones)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
