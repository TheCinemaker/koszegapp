-- Provider Setup: Database Schema Updates
-- Run this in Supabase SQL Editor

-- 1. Add new columns to providers table
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS welcome_message TEXT,
ADD COLUMN IF NOT EXISTS working_days JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}',
ADD COLUMN IF NOT EXISTS slot_duration INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- 2. Update existing providers with default values (if any exist)
UPDATE providers 
SET 
  working_days = '["monday", "tuesday", "wednesday", "thursday", "friday"]'::jsonb,
  working_hours = '{"start": "09:00", "end": "17:00"}'::jsonb,
  slot_duration = 30
WHERE working_days IS NULL OR working_days::text = '[]';

-- 3. Verify changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'providers'
ORDER BY ordinal_position;
