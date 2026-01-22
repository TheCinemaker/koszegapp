-- Add delivery_time column to restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS delivery_time text DEFAULT '30 perc';

-- Update existing restaurants with default values if needed
UPDATE restaurants SET delivery_time = '30 perc' WHERE delivery_time IS NULL;
