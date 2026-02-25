-- Migration: Extend user_profiles with advanced preferences
-- Run this in Supabase SQL Editor

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pizza_preference FLOAT DEFAULT 0.5;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS culture_score FLOAT DEFAULT 0.5;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS outdoor_score FLOAT DEFAULT 0.5;

COMMENT ON COLUMN user_profiles.pizza_preference IS 'Score for pizza interest (0.0 to 1.0)';
COMMENT ON COLUMN user_profiles.culture_score IS 'Score for museum and history interest (0.0 to 1.0)';
COMMENT ON COLUMN user_profiles.outdoor_score IS 'Score for hiking and nature interest (0.0 to 1.0)';
