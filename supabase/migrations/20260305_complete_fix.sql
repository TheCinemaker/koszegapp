-- 1. Állapot-ellenőrzés frissítése (hogy elfogadja a 'reserved' státuszt)
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check 
CHECK (status IN ('paid', 'used', 'pending', 'cancelled', 'reserved'));

-- 2. Események típusának kezelése (Beállító oszlop - Stripe vagy Foglalás)
ALTER TABLE ticket_events ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'paid';
UPDATE ticket_events SET payment_type = 'paid' WHERE payment_type IS NULL;

-- 3. Jegytábla bővítése a foglalási adatokkal
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS zip text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS stripe_session_id text;
