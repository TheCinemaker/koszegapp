-- Migration: Unknown phrase logging for AI training
-- Run this in Supabase SQL Editor

-- 1. Table
CREATE TABLE IF NOT EXISTS unknown_phrases (
    id          BIGSERIAL PRIMARY KEY,
    query       TEXT NOT NULL,
    context     JSONB,
    user_id     TEXT,
    session_id  TEXT,
    frequency   INT NOT NULL DEFAULT 1,
    first_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_unknown_phrases_query ON unknown_phrases (query);
CREATE INDEX IF NOT EXISTS idx_unknown_phrases_freq ON unknown_phrases (frequency DESC);

-- 2. RPC: upsert + increment frequency
CREATE OR REPLACE FUNCTION increment_unknown_phrase(
    p_query      TEXT,
    p_context    JSONB DEFAULT NULL,
    p_user_id    TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO unknown_phrases (query, context, user_id, session_id, frequency, first_seen, last_seen)
    VALUES (p_query, p_context, p_user_id, p_session_id, 1, NOW(), NOW())
    ON CONFLICT (query) DO UPDATE
        SET frequency  = unknown_phrases.frequency + 1,
            last_seen  = NOW(),
            context    = COALESCE(EXCLUDED.context, unknown_phrases.context),
            user_id    = COALESCE(EXCLUDED.user_id, unknown_phrases.user_id),
            session_id = COALESCE(EXCLUDED.session_id, unknown_phrases.session_id);
END;
$$;

-- 3. RLS: only service role can read (admin only)
ALTER TABLE unknown_phrases ENABLE ROW LEVEL SECURITY;
-- No insert policy needed: function uses SECURITY DEFINER
