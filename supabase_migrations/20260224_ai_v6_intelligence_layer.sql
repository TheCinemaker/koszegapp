-- KőszegAI v6 – Intelligence Layer SQL Migration
-- Run in Supabase SQL Editor

-- ─── conversation_state ───────────────────────────────────────────────────────
create table if not exists public.conversation_state (
    user_id    uuid primary key references auth.users(id) on delete cascade,
    phase      text not null default 'idle',
    temp_data  jsonb default '{}'::jsonb,
    mobility   text,
    updated_at timestamp with time zone default now()
);

alter table public.conversation_state enable row level security;

create policy "Users can access own state"
on public.conversation_state
for all
using (auth.uid() = user_id);

-- ─── user_profiles ────────────────────────────────────────────────────────────
create table if not exists public.user_profiles (
    user_id            uuid primary key references auth.users(id) on delete cascade,
    indoor_preference  numeric default 0.5,
    cuisine_preference text[],
    romantic_score     numeric default 0,
    family_score       numeric default 0,
    budget_level       numeric default 0.5,
    visit_frequency    integer default 0,
    updated_at         timestamp with time zone default now()
);

alter table public.user_profiles enable row level security;

create policy "Users can access own profile"
on public.user_profiles
for all
using (auth.uid() = user_id);
