
-- 1. Ensure updated_at column exists
alter table public.providers 
add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- 2. Enable RLS on providers
alter table public.providers enable row level security;

-- 3. Create Permissive Policies (since we want users to be able to create their own provider profiles)

-- Allow insert if user is authenticated (users handle their own rows)
create policy "Users can insert their own provider profile"
on public.providers for insert
to authenticated
with check ( auth.uid() = user_id );

-- Allow update if user owns the record
create policy "Users can update their own provider profile"
on public.providers for update
to authenticated
using ( auth.uid() = user_id );

-- Allow select for everyone (public profiles)
create policy "Public can view providers"
on public.providers for select
to anon, authenticated
using ( true );

-- 4. Grant access to authenticated users to use the sequence (if strictly needed, usually auto-handled)
grant all on public.providers to authenticated;
grant all on public.providers to anon;

