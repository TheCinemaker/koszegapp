-- Add missing columns to koszegpass_users table if they don't exist
ALTER TABLE koszegpass_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE koszegpass_users ADD COLUMN IF NOT EXISTS card_type TEXT DEFAULT 'bronze';
ALTER TABLE koszegpass_users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Ensure RLS is enabled
ALTER TABLE koszegpass_users ENABLE ROW LEVEL SECURITY;

-- Policy for reading own data (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'koszegpass_users' AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile" ON koszegpass_users
            FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

-- Policy for updating own data
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'koszegpass_users' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" ON koszegpass_users
            FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;
