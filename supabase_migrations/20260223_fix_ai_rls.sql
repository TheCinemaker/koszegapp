-- Fix RLS for AI related tables to allow anonymous logging and background updates
-- This is critical for the AI Assistant to work for non-logged-in users

-- 1. ai_logs: Allow anonymous insertion
DROP POLICY IF EXISTS "Users can insert their own logs" ON ai_logs;
CREATE POLICY "Anyone can insert logs" 
ON ai_logs FOR INSERT 
WITH CHECK (true); -- Allow anonymous logging

-- 2. user_interests: Allow anonymous insertion/update for tracking
-- Note: In a production environment, you might want more restriction, 
-- but for KőszegAI, we want to learn from everyone.
DROP POLICY IF EXISTS "Users can insert own interests" ON user_interests;
CREATE POLICY "Anyone can insert interests" 
ON user_interests FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own interests" ON user_interests;
CREATE POLICY "Anyone can update interests" 
ON user_interests FOR UPDATE 
USING (true);

-- 3. ai_conversations: Ensure anonymous is explicitly allowed (already was, but let's be sure)
DROP POLICY IF EXISTS "Users can insert their own conversations" ON ai_conversations;
CREATE POLICY "Anyone can insert conversations" 
ON ai_conversations FOR INSERT 
WITH CHECK (true);
