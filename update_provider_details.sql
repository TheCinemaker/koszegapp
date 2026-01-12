-- Add missing columns to providers table
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS slot_duration_min integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS opening_start time DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS opening_end time DEFAULT '17:00';

-- Force refresh of the cache/schema permissions if needed
GRANT ALL ON TABLE public.providers TO authenticated;
GRANT ALL ON TABLE public.providers TO service_role;
