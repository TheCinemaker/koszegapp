-- ==========================================
-- KOZEGAPP DATABASE FIX SCRIPT
-- ==========================================
-- Run this script in the Supabase SQL Editor
-- to fix the 400 Bad Request and Missing Column errors.

-- 1. ADD owner_id TO restaurants TABLE
-- Without this, the app cannot link a restaurant to a user.
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

-- 2. ENABLE ROW LEVEL SECURITY (RLS) FOR RESTAURANTS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- 3. ADD RLS POLICIES FOR RESTAURANTS
-- Allow everyone to read
DROP POLICY IF EXISTS "Public restaurants are viewable by everyone" ON restaurants;
CREATE POLICY "Public restaurants are viewable by everyone" 
ON restaurants FOR SELECT 
USING (true);

-- Allow owners to insert their own restaurant
DROP POLICY IF EXISTS "Owners can insert their own restaurant" ON restaurants;
CREATE POLICY "Owners can insert their own restaurant" 
ON restaurants FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Allow owners to update their own restaurant
DROP POLICY IF EXISTS "Owners can update their own restaurant" ON restaurants;
CREATE POLICY "Owners can update their own restaurant" 
ON restaurants FOR UPDATE 
USING (auth.uid() = owner_id);

-- Allow owners to delete their own restaurant
DROP POLICY IF EXISTS "Owners can delete their own restaurant" ON restaurants;
CREATE POLICY "Owners can delete their own restaurant" 
ON restaurants FOR DELETE 
USING (auth.uid() = owner_id);


-- 4. FIX PROFILES ROLE ENUM (If 'restaurant' is not allowed)
-- First, checking if there is a constraint. If there is, we drop it.
-- Then we add a check constraint that allows 'restaurant'.

-- Attempt to drop common check constraints if they exist (names vary)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_fkey; -- unlikely but safe to try

-- Add a flexible check constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('client', 'provider', 'admin', 'restaurant', 'tourinform', 'partner', 'varos', 'var'));


-- 5. RELOAD SCHEMA CACHE
-- This is often automatic, but good to know the script completed.
SELECT 'Database Fixed Successfully' as status;
