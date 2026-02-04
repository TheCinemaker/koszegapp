-- Create Admin Whitelist Table
create table if not exists public.admin_whitelist (
  username text primary key,
  role text not null check (role in ('superadmin', 'editor', 'partner')), -- Simplified roles
  description text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.admin_whitelist enable row level security;

-- Policy: Everyone (authenticated or anon) can READ this table to check permissions
-- (We need this so the Login page can check if the user is allowed BEFORE fully letting them in)
create policy "Allow public read access"
  on public.admin_whitelist for select
  using (true);

-- Seed Data (The 4 authorized users)
insert into public.admin_whitelist (username, role, description)
values
  ('admin', 'superadmin', 'Teljes hozzáférés'),
  ('devteam', 'superadmin', 'Teljes hozzáférés (Fejlesztők)'),
  ('varos', 'editor', 'Teljes hozzáférés (Város)'),
  ('kulsos', 'partner', 'Csak új esemény felvétele')
on conflict (username) do update
set role = excluded.role;
