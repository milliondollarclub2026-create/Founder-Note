-- Add usage tracking to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS transcription_seconds_used INTEGER DEFAULT 0;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS ai_tokens_used INTEGER DEFAULT 0;
