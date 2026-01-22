-- Add extended profile fields to restaurants table if they don't exist
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS delivery_time text DEFAULT '30-40 perc',
ADD COLUMN IF NOT EXISTS min_order_value integer DEFAULT 2000,
ADD COLUMN IF NOT EXISTS opening_hours text DEFAULT 'H-V: 11:00 - 22:00',
ADD COLUMN IF NOT EXISTS news text,
ADD COLUMN IF NOT EXISTS promotions text,
ADD COLUMN IF NOT EXISTS display_settings jsonb DEFAULT '{"show_news": true, "show_promotions": true, "show_delivery_time": true}';

-- Fix column name mismatch in menu_categories
-- The reset script created 'order_index', but the code expects 'sort_order'
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'menu_categories' AND column_name = 'order_index') THEN
    ALTER TABLE menu_categories RENAME COLUMN order_index TO sort_order;
  END IF;
END $$;

-- Verify everything is correct
SELECT column_name FROM information_schema.columns WHERE table_name = 'restaurants';
