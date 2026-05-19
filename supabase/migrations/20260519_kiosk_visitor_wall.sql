-- Kiosk Visitor Wall: stores selfie photos with explicit user consent
-- Only created when the visitor taps "Igen" on the consent card in the selfie booth

CREATE TABLE IF NOT EXISTS kiosk_visitor_messages (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_url    TEXT        NOT NULL,
  visitor_name TEXT,                          -- optional, e.g. "Marco, Olaszország"
  message      TEXT,                          -- optional short message, max ~80 chars
  lang         TEXT        DEFAULT 'hu',      -- language the terminal was set to
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE kiosk_visitor_messages ENABLE ROW LEVEL SECURITY;

-- Kiosk terminal (anon key) can insert rows
CREATE POLICY "kiosk_insert" ON kiosk_visitor_messages
  FOR INSERT TO anon WITH CHECK (true);

-- Screensaver can read all rows (public display)
CREATE POLICY "kiosk_select" ON kiosk_visitor_messages
  FOR SELECT TO anon USING (true);
