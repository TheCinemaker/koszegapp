-- Partneri adatbekérő (Adatbekero.jsx) beküldéseinek tárolása.
-- A tábla eddig NEM létezett, ezért a beküldés némán elveszett.

create table if not exists public.partner_submissions (
  id            bigserial primary key,
  name          text,
  category_type text,
  sub_type      text,
  address       text,
  phone         text,
  email         text,
  website       text,
  json_data     jsonb not null,
  status        text default 'pending_review',
  created_at    timestamptz default now()
);

alter table public.partner_submissions enable row level security;

-- Bárki (bejelentkezés nélküli partner) beküldhet adatlapot.
drop policy if exists "anon can submit" on public.partner_submissions;
create policy "anon can submit"
  on public.partner_submissions
  for insert
  to anon, authenticated
  with check (true);

-- Csak bejelentkezett (admin) felhasználó olvashatja / kukázhatja.
drop policy if exists "authenticated can read" on public.partner_submissions;
create policy "authenticated can read"
  on public.partner_submissions
  for select
  to authenticated
  using (true);

drop policy if exists "authenticated can delete" on public.partner_submissions;
create policy "authenticated can delete"
  on public.partner_submissions
  for delete
  to authenticated
  using (true);

create index if not exists partner_submissions_created_at_idx
  on public.partner_submissions (created_at desc);
