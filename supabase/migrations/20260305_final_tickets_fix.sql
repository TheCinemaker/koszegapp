-- 1. Események típusának kezelése
ALTER TABLE ticket_events ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'paid';
UPDATE ticket_events SET payment_type = 'paid' WHERE payment_type IS NULL;

-- 2. Jegytábla bővítése a foglalási adatokkal
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS zip text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS address text;

-- 3. Ha esetleg hiányozna a tracking oszlop (a webhook ezt használja)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS stripe_session_id text;
