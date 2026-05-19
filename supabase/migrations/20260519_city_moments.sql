-- City Moments: ephemeral 24-hour photo feed from visitors
-- Photos auto-expire after 24 hours (filtered in SELECT policy + pg_cron cleanup)
--
-- BEFORE USE: Create a public storage bucket named "moments" in the Supabase dashboard
-- (Storage → New bucket → name: moments → Public: ON)

CREATE TABLE IF NOT EXISTS city_moments (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_url  TEXT        NOT NULL,
  caption    TEXT,
  lat        FLOAT,
  lng        FLOAT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '24 hours'
);

ALTER TABLE city_moments ENABLE ROW LEVEL SECURITY;

-- Anyone can post a moment
CREATE POLICY "moments_insert" ON city_moments
  FOR INSERT TO anon WITH CHECK (true);

-- Only show non-expired moments
CREATE POLICY "moments_select" ON city_moments
  FOR SELECT TO anon USING (expires_at > now());

-- Daily cleanup at 4am (lazy hard-delete of expired rows)
SELECT cron.schedule(
  'cleanup-city-moments',
  '0 4 * * *',
  $$DELETE FROM city_moments WHERE expires_at < now()$$
);
