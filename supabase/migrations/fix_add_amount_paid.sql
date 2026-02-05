-- Add missing amount_paid column to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0;

-- Refresh schema cache instruction (handled automatically by Supabase usually)
COMMENT ON COLUMN tickets.amount_paid IS 'Amount paid in currency units (e.g. HUF)';
