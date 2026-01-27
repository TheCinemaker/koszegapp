-- Enable Realtime for the users table
-- This is required for the client to receive updates via .on('postgres_changes')
begin;
  -- Remove if already exists to avoid errors (optional safety)
  -- alter publication supabase_realtime drop table koszegpass_users;
  
  -- Add table to publication
  alter publication supabase_realtime add table koszegpass_users;
commit;
