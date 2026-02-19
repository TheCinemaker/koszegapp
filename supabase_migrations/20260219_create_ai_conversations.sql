-- AI Conversations Table (Simplified chat history logging)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    user_message TEXT,
    assistant_message TEXT,
    action_type TEXT,
    action_params JSONB,
    intent TEXT,
    mode TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    weather JSONB,
    movement TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own conversations" 
ON ai_conversations FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL); -- Allow anonymous logging if configured

CREATE POLICY "Users can read their own conversations" 
ON ai_conversations FOR SELECT 
USING (auth.uid() = user_id);
