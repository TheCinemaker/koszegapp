-- Migration: Add session_id support for AI conversation tracking and state persistence
-- Run this in Supabase SQL Editor

-- 1. Add session_id to ai_conversations table
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS session_id TEXT;
CREATE INDEX IF NOT EXISTS idx_conversations_session ON ai_conversations(session_id);

-- 2. Add session_id to conversation_state table (for future: server-side guest state)
ALTER TABLE conversation_state ADD COLUMN IF NOT EXISTS session_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_state_session ON conversation_state(session_id) WHERE session_id IS NOT NULL;
