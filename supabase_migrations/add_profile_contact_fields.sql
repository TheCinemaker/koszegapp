-- Ensure contact fields exist in koszegpass_users
ALTER TABLE koszegpass_users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE koszegpass_users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE koszegpass_users ADD COLUMN IF NOT EXISTS email TEXT;
-- full_name is assumed to exist as it's core to the profile
