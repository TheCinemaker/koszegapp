-- Add marketing fields to restaurants table

-- Flash Sale (JSONB to store: active, discount, message, end_time)
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS flash_sale JSONB DEFAULT '{"active": false, "discount": "20%", "message": "", "end_time": ""}';

-- Mystery Box (JSONB Array to store list of boxes)
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS mystery_box JSONB DEFAULT '[]';

-- Add Tier (Standard, Silver, Gold)
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'standard';
