-- FIX: Use correct column name 'client_id' (not user_id)
-- Allow manual bookings where client_id is NULL
ALTER TABLE public.bookings 
ALTER COLUMN client_id DROP NOT NULL;

-- Add column for manual client name
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS manual_client_name text;

-- Add column for notes if not exists
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS notes text;
