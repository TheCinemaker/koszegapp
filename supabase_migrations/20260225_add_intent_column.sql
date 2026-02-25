-- Migration: Add intent column to ai_conversations
-- Run this in Supabase SQL Editor

ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS intent TEXT[];
CREATE INDEX IF NOT EXISTS idx_conversations_intent ON ai_conversations USING GIN (intent);

COMMENT ON COLUMN ai_conversations.intent IS 'Array of intents detected for this query';
