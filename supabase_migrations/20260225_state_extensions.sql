-- Migration: Extend conversation_state with last_intent and last_reply_type
-- Run this in Supabase SQL Editor

ALTER TABLE conversation_state ADD COLUMN IF NOT EXISTS last_intent TEXT[];
ALTER TABLE conversation_state ADD COLUMN IF NOT EXISTS last_reply_type TEXT;

COMMENT ON COLUMN conversation_state.last_intent IS 'Array of intents from the last turn';
COMMENT ON COLUMN conversation_state.last_reply_type IS 'The replyType used in the last turn';
