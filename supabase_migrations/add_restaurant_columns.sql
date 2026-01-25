-- Add missing columns to restaurants table to support Admin features
-- Run this in SQL Editor to fix 400 Bad Request error.

ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS news text,
ADD COLUMN IF NOT EXISTS promotions text,
ADD COLUMN IF NOT EXISTS daily_menu text,
ADD COLUMN IF NOT EXISTS opening_hours text,
ADD COLUMN IF NOT EXISTS min_order_value integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS display_settings jsonb DEFAULT '{"show_news": true, "show_promotions": true, "show_daily_menu": true, "show_delivery_time": true}'::jsonb;

SELECT '✅ Restaurant columns added successfully' as status;
