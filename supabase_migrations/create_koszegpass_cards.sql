-- Create koszegpass_cards table
CREATE TABLE IF NOT EXISTS koszegpass_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES koszegpass_users(id) ON DELETE CASCADE,
    qr_token TEXT NOT NULL UNIQUE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ
);

-- RLS Policies
ALTER TABLE koszegpass_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cards" ON koszegpass_cards
    FOR SELECT USING (auth.uid() = user_id);

-- Function to generate random token (Simple secure version)
CREATE OR REPLACE FUNCTION generate_koszegpass_token()
RETURNS TEXT AS $$
BEGIN
  -- Generates "KP-" + 12 hex characters (e.g., KP-a1b2c3d4e5f6)
  RETURN 'KP-' || encode(gen_random_bytes(6), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Trigger function to create card automatically
CREATE OR REPLACE FUNCTION public.handle_new_koszegpass_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.koszegpass_cards (user_id, qr_token)
  VALUES (NEW.id, generate_koszegpass_token());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition (Idempotent)
DROP TRIGGER IF EXISTS on_koszegpass_user_created ON koszegpass_users;
CREATE TRIGGER on_koszegpass_user_created
  AFTER INSERT ON koszegpass_users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_koszegpass_user();

-- Backfill: Create cards for existing users who don't have one
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM koszegpass_users WHERE id NOT IN (SELECT user_id FROM koszegpass_cards) LOOP
    INSERT INTO koszegpass_cards (user_id, qr_token)
    VALUES (r.id, generate_koszegpass_token());
  END LOOP;
END;
$$;
