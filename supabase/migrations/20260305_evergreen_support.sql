-- Migration: Add Evergreen and Combined Ticket support
-- Run this in Supabase SQL Editor

-- 1. Update ticket_events table
ALTER TABLE ticket_events 
ADD COLUMN IF NOT EXISTS is_evergreen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS entries_allowed INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS valid_days INTEGER DEFAULT 365;

-- 2. Update tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS entries_used INTEGER DEFAULT 0;

-- Comment to verify
COMMENT ON COLUMN ticket_events.is_evergreen IS 'If true, the event does not expire based on date.';
COMMENT ON COLUMN ticket_events.entries_allowed IS 'Number of times this ticket can be validated.';
COMMENT ON COLUMN tickets.entries_used IS 'Counter for how many times the ticket has been validated.';
