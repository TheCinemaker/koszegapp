-- LIGHTWEIGHT UPDATE: Points System & Realtime Fixes
-- Run this in SQL Editor to apply changes WITHOUT resetting data.

-- 1. Ensure 'points' column exists in koszegpass_users
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'koszegpass_users' AND column_name = 'points') THEN
        ALTER TABLE public.koszegpass_users ADD COLUMN points integer DEFAULT 0;
    END IF;
END $$;

-- 2. Ensure Realtime is enabled for core tables (Restaurants, Menu, Orders)
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.restaurants REPLICA IDENTITY FULL;
ALTER TABLE public.menu_items REPLICA IDENTITY FULL;

DO $$ 
BEGIN 
  -- Remove tables from publication first to avoid errors if they exist (optional, but cleaner)
  -- ALTER PUBLICATION supabase_realtime DROP TABLE public.orders, public.restaurants, public.menu_items; 
  -- Add them back ensuring they are present
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders, public.restaurants, public.menu_items; 
EXCEPTION WHEN OTHERS THEN 
  NULL; -- Ignore if already added
END; $$;

-- 3. Create Points Trigger Function
CREATE OR REPLACE FUNCTION public.update_points_on_delivery()
RETURNS trigger AS $$
DECLARE
  earned_points integer;
BEGIN
  -- Only run if status changed to 'delivered' FROM something else
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Calculate: 1 Point per 1000 HUF
    earned_points := floor(NEW.total_price / 1000);
    
    -- Update KőszegPass User points if they exist
    IF earned_points > 0 THEN
      UPDATE public.koszegpass_users
      SET points = points + earned_points
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach Trigger to Orders Table
DROP TRIGGER IF EXISTS on_order_delivered_reward ON public.orders;
CREATE TRIGGER on_order_delivered_reward
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.update_points_on_delivery();

SELECT '✅ Points System & Realtime Fixes Applied Successfully' as status;
