-- FIX: Allow manual bookings without a specific service ID
ALTER TABLE public.bookings 
ALTER COLUMN service_id DROP NOT NULL;
