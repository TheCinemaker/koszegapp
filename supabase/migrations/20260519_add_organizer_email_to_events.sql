-- Add organizer_email to ticket_events table
ALTER TABLE ticket_events ADD COLUMN IF NOT EXISTS organizer_email text;

-- Add comment for documentation
COMMENT ON COLUMN ticket_events.organizer_email IS 'The email address of the event organizer to receive booking notifications.';
