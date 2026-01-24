-- Create KőszegPass Users table (separate from profiles)
create table if not exists koszegpass_users (
  id uuid references auth.users not null primary key,
  username text unique,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table koszegpass_users enable row level security;

-- Policies
create policy "Users can view their own koszegpass profile."
  on koszegpass_users for select
  using ( auth.uid() = id );

create policy "Users can insert their own koszegpass profile."
  on koszegpass_users for insert
  with check ( auth.uid() = id );

create policy "Users can update their own koszegpass profile."
  on koszegpass_users for update
  using ( auth.uid() = id );
