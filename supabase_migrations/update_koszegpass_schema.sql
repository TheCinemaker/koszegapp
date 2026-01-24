-- Add Phone and Address to koszegpass_users
-- Run this in Supabase SQL Editor

-- 1. Add columns if they don't exist
alter table public.koszegpass_users 
add column if not exists phone text,
add column if not exists address text;

-- 2. Ensure they are updatable (Policies already exist for UPDATE, so this should be fine)
-- If we need to sync these to public.profiles (for legacy reasons):
-- We can update the handle_new_user function or just treat koszegpass_users as the source of truth for these fields.
-- Given "Unique KőszegPass", we should prefer koszegpass_users.

-- 3. Verify
select column_name, data_type 
from information_schema.columns 
where table_name = 'koszegpass_users';
