-- Schedule daily cleanup of visitor wall entries older than 10 days.
-- This calls the cleanup-visitor-wall Edge Function every day at 03:00 AM.
--
-- BEFORE running this:
--   1. Deploy the Edge Function:  supabase functions deploy cleanup-visitor-wall
--   2. Replace YOUR_PROJECT_REF below with your actual Supabase project ref
--      (visible in: Settings → General → Reference ID, e.g. "abcdefghijklmnop")
--   3. Replace YOUR_ANON_KEY with your project's anon/public key
--      (visible in: Settings → API → Project API keys → anon public)

SELECT cron.schedule(
  'cleanup-visitor-wall-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-visitor-wall',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body    := '{}'::jsonb
  )
  $$
);
