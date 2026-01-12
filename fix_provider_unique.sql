-- FIX: Add UNIQUE constraint to user_id to allow UPSERT
-- Futtasd ezt a Supabase SQL Editor-ban!

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'providers_user_id_key'
    ) THEN
        ALTER TABLE public.providers 
        ADD CONSTRAINT providers_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Ha esetleg hiányoznának a policy-k (biztos, ami biztos):
DROP POLICY IF EXISTS "Users can insert their own provider profile" ON public.providers;
CREATE POLICY "Users can insert their own provider profile" 
ON public.providers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own provider profile" ON public.providers;
CREATE POLICY "Users can update their own provider profile" 
ON public.providers FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own provider profile" ON public.providers;
CREATE POLICY "Users can view their own provider profile" 
ON public.providers FOR SELECT 
USING (auth.uid() = user_id);
