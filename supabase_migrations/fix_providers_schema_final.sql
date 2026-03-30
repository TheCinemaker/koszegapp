-- Final Fix for Providers Table Schema
-- Addresses: Missing columns, unique constraints, and foreign key issues.

-- 1. Ensure the table exists with the correct base structure
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    business_name TEXT,
    category TEXT,
    location_address TEXT,
    description TEXT,
    phone TEXT,
    slot_duration_min INTEGER DEFAULT 30,
    opening_start TIME DEFAULT '09:00',
    opening_end TIME DEFAULT '17:00',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add missing columns if table already existed
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS slot_duration_min INTEGER DEFAULT 30;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS opening_start TIME DEFAULT '09:00';
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS opening_end TIME DEFAULT '17:00';
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 3. Ensure unique constraint on user_id for upsert operations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'providers_user_id_key'
    ) THEN
        ALTER TABLE public.providers ADD CONSTRAINT providers_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 4. Enable Row Level Security
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Providers can view their own data" ON public.providers;
CREATE POLICY "Providers can view their own data" ON public.providers
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Providers can update their own data" ON public.providers;
CREATE POLICY "Providers can update their own data" ON public.providers
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert a provider record during setup" ON public.providers;
CREATE POLICY "Anyone can insert a provider record during setup" ON public.providers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view active providers" ON public.providers;
CREATE POLICY "Public can view active providers" ON public.providers
    FOR SELECT USING (status = 'active');

-- 6. Helper for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_providers_updated_at ON public.providers;
CREATE TRIGGER update_providers_updated_at
    BEFORE UPDATE ON public.providers
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
