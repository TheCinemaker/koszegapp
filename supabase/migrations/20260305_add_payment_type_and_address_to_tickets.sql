-- 1. Események típusának kezelése
ALTER TABLE ticket_events ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'paid';
UPDATE ticket_events SET payment_type = 'paid' WHERE payment_type IS NULL;

-- 2. Jegytábla bővítése a foglalási adatokkal
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS zip text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS address text;

-- 3. Státuszok kiterjesztése (ha létezik check constraint, akkor érdemes ellenőrizni, de text esetén mehet)
-- A 'reserved' státuszt a kódunk már kezeli, így az adatbázisnak is el kell fogadnia.
