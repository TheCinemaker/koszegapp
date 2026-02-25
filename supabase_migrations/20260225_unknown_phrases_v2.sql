-- Patch: add corrected_intent and reviewed columns to unknown_phrases
-- Run AFTER 20260225_unknown_phrases.sql

ALTER TABLE unknown_phrases
    ADD COLUMN IF NOT EXISTS corrected_intent TEXT,
    ADD COLUMN IF NOT EXISTS reviewed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_unknown_phrases_unreviewed
    ON unknown_phrases (frequency DESC)
    WHERE reviewed = FALSE AND corrected_intent IS NOT NULL;
