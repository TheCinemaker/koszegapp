-- Update ticket_events to support reservation mode
ALTER TABLE ticket_events ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'paid';

-- Ensure existing rows are set to 'paid' (already handled by DEFAULT, but just in case)
UPDATE ticket_events SET payment_type = 'paid' WHERE payment_type IS NULL;

-- Optionally: Add check constraint
-- ALTER TABLE ticket_events ADD CONSTRAINT check_payment_type CHECK (payment_type IN ('paid', 'on_site_reservation'));
