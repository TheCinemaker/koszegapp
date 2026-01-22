-- FORCE FIX MENU ITEMS COLUMN
-- This script ONLY renames the column. It contains no other operations.
-- Run this to fix the "Bad Request" error when saving items.

DO $$
BEGIN
  -- 1. Check if 'available' exists (Old Name)
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'available') THEN
    -- Rename it to 'is_available' (New Name used by code)
    ALTER TABLE menu_items RENAME COLUMN available TO is_available;
  END IF;

  -- 2. Verify 'is_available' exists now
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'is_available') THEN
    RAISE NOTICE 'WARNING: is_available column is still missing!';
  END IF;
END $$;
