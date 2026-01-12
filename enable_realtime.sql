-- Enable Realtime for the bookings table
-- This allows the dashboard to update automatically when a booking is created/modified
begin;
  -- Check if publication exists, if not it usually means we use the default 'supabase_realtime'
  -- We add the tables to the publication
  alter publication supabase_realtime add table public.bookings;
  alter publication supabase_realtime add table public.providers;
  alter publication supabase_realtime add table public.services;
commit;
