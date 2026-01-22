-- Add owner_id to restaurants to link with auth users
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

-- Enable RLS on restaurants if not already
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- 1. Everyone can read restaurants
CREATE POLICY "Public restaurants are viewable by everyone" 
ON restaurants FOR SELECT 
USING (true);

-- 2. Owners can update their own restaurant
CREATE POLICY "Owners can update their own restaurant" 
ON restaurants FOR UPDATE 
USING (auth.uid() = owner_id);

-- 3. Owners can insert their own restaurant
CREATE POLICY "Owners can insert their own restaurant" 
ON restaurants FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- 4. Owners can delete their own restaurant
CREATE POLICY "Owners can delete their own restaurant" 
ON restaurants FOR DELETE 
USING (auth.uid() = owner_id);
