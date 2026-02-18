-- AI Behavior Logs (Detailed interaction history)
CREATE TABLE IF NOT EXISTS ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    intent TEXT,
    action TEXT,
    context JSONB, -- { location, hour, speed }
    metadata JSONB, -- { accepted: true, dwellTime: 45s }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- User Interests (Aggregated score)
CREATE TABLE IF NOT EXISTS user_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    category TEXT NOT NULL, -- 'food_pizza', 'history', 'events'
    score FLOAT DEFAULT 0.5, -- 0.0 to 1.0 (normalized)
    interaction_count INT DEFAULT 1,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, category)
);

-- RLS Policies
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own logs" 
ON ai_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own logs" 
ON ai_logs FOR SELECT 
USING (auth.uid() = user_id);

ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own interests" 
ON user_interests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own interests" 
ON user_interests FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interests" 
ON user_interests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for interests (so app updates if changed elsewhere)
alter publication supabase_realtime add table user_interests;
