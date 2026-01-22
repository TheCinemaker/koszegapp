-- SAFE FIX FOR MENU ITEMS COLUMN
-- Only renames the column. Does NOT touch storage permissions.

DO $$
BEGIN
  -- Check if 'available' exists and 'is_available' does not
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'available') THEN
    ALTER TABLE menu_items RENAME COLUMN available TO is_available;
  END IF;
END $$;
