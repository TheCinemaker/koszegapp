-- ============================================================================
-- VisitKőszeg: Promo modal rendszer
-- Kampányok kód-deploy nélkül: insert a táblába, és a Home megjeleníti.
-- ============================================================================

create table if not exists public.promos (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,          -- pl. 'ostromnapok-2026'
  active      boolean not null default true,
  priority    int not null default 0,        -- több aktív promo esetén a legkisebb nyer
  start_at    timestamptz not null,
  end_at      timestamptz not null,
  image_url   text,                          -- opcionális fejléckép (public URL)
  cta_route   text not null default '/events',

  -- Többnyelvű tartalom. Kötelező a 'hu' kulcs, a többi opcionális.
  -- Szerkezet nyelvenkénti objektum: { badge, title, subtitle, body, highlight, cta }
  content     jsonb not null,

  created_at  timestamptz not null default now(),

  constraint promos_dates_valid check (end_at > start_at)
);

create index if not exists promos_active_window_idx
  on public.promos (active, start_at, end_at);

-- ----------------------------------------------------------------------------
-- RLS: bárki olvashatja az épp aktív promókat, írni csak service role tud
-- ----------------------------------------------------------------------------
alter table public.promos enable row level security;

drop policy if exists "Public can read live promos" on public.promos;
create policy "Public can read live promos"
  on public.promos
  for select
  using (
    active = true
    and start_at <= now()
    and end_at >= now()
  );

-- Írási policy szándékosan nincs: insert/update csak a Supabase dashboardról
-- vagy service role kulccsal (pl. egy későbbi admin felületről) megy.

-- ----------------------------------------------------------------------------
-- Példa: Ostromnapok 2026 (aug. 7-9.) - a rendezvény előtt egy héttel indul
-- ----------------------------------------------------------------------------
insert into public.promos (slug, priority, start_at, end_at, image_url, cta_route, content)
values (
  'ostromnapok-2026',
  0,
  '2026-07-31 00:00:00+02',
  '2026-08-09 23:59:59+02',
  '/images/ostrom_2026/ostromhero.png',
  '/ostrom',
  '{
    "hu": {
      "badge": "Kiemelt rendezvény",
      "title": "Ostromnapok 2026",
      "subtitle": "2026. augusztus 7-9.",
      "body": "Kőszeg legnagyobb rendezvénye: történelmi hagyományőrző programok, vásár és látványosságok a vár körül három napon át.",
      "highlight": "3 nap, több tucat program a történelmi belvárosban!",
      "cta": "Mutasd a részleteket"
    },
    "en": {
      "badge": "Featured event",
      "title": "Siege Days 2026",
      "subtitle": "7-9 August 2026",
      "body": "Kőszeg''s biggest event: historical reenactments, a fair and spectacles around the castle for three days.",
      "highlight": "3 days, dozens of programmes in the historic old town!",
      "cta": "Show me the details"
    },
    "de": {
      "badge": "Top-Veranstaltung",
      "title": "Belagerungstage 2026",
      "subtitle": "7.-9. August 2026",
      "body": "Die größte Veranstaltung in Kőszeg: historische Darbietungen, Markt und Spektakel rund um die Burg, drei Tage lang.",
      "highlight": "3 Tage, Dutzende Programme in der historischen Altstadt!",
      "cta": "Details anzeigen"
    }
  }'::jsonb
)
on conflict (slug) do nothing;
