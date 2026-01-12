-- Allow manual bookings where user_id is NULL
ALTER TABLE public.bookings 
ALTER COLUMN user_id DROP NOT NULL;

-- Add column for manual client name
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS manual_client_name text;

-- Add column for notes if not exists
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS notes text;
