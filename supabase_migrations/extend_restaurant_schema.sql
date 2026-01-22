-- Add extended profile fields to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS delivery_time text DEFAULT '30-40 perc',
ADD COLUMN IF NOT EXISTS min_order_value integer DEFAULT 2000,
ADD COLUMN IF NOT EXISTS opening_hours text DEFAULT 'H-V: 11:00 - 22:00',
ADD COLUMN IF NOT EXISTS news text,
ADD COLUMN IF NOT EXISTS promotions text,
ADD COLUMN IF NOT EXISTS display_settings jsonb DEFAULT '{"show_news": true, "show_promotions": true, "show_delivery_time": true}';

-- Ensure owners can update these new columns (covered by existing policy, but good to verify)
-- Existing policy: "Owners can update their own restaurant" USING (auth.uid() = owner_id) -> Covers all columns.
