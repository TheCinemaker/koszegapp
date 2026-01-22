-- Add daily_menu to restaurants
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS daily_menu text;

-- Update display_settings default to include show_daily_menu
-- Note: existing rows won't auto-update the json default, but code handles missing keys gracefully.
