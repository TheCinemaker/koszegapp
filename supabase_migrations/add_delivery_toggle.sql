-- Add 'has_delivery' column to restaurants
-- Run this in SQL Editor

ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS has_delivery boolean DEFAULT true;

SELECT '✅ has_delivery column added' as status;
