-- Create koszegpass_points_log table
CREATE TABLE IF NOT EXISTS koszegpass_points_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES koszegpass_users(id) ON DELETE CASCADE,
    amount INTEGER DEFAULT 0, -- Transaction value in HUF
    points INTEGER NOT NULL,
    source TEXT NOT NULL, -- e.g. "Scanner App", "Bella Pizzeria"
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE koszegpass_points_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
CREATE POLICY "Users can view their own points log" ON koszegpass_points_log
    FOR SELECT USING (auth.uid() = user_id);

-- Service role (API) can insert
-- (Implicitly allowed for service role, but explicit policy for specific roles might be needed later)
