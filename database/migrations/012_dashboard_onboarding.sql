-- Migration: Add dashboard_onboarding_completed column to user_profiles
-- This column tracks whether a user has completed the dashboard onboarding tour

-- Add the column with default false for new users
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS dashboard_onboarding_completed BOOLEAN DEFAULT false;

-- Mark existing users as having completed onboarding (they've already used the app)
-- ONLY run this update if no users have dashboard_onboarding_completed = true yet
-- This makes the migration idempotent - safe to run multiple times
DO $$
BEGIN
  -- Check if this is the first run (no users marked as completed yet)
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE dashboard_onboarding_completed = true LIMIT 1) THEN
    -- First run: Mark all existing users as completed
    UPDATE user_profiles
    SET dashboard_onboarding_completed = true
    WHERE dashboard_onboarding_completed = false;

    RAISE NOTICE 'Dashboard onboarding: Marked all existing users as completed';
  ELSE
    RAISE NOTICE 'Dashboard onboarding: Migration already applied, skipping update';
  END IF;
END $$;

-- Set NOT NULL constraint after backfilling (safe to run multiple times)
ALTER TABLE user_profiles
ALTER COLUMN dashboard_onboarding_completed SET NOT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN user_profiles.dashboard_onboarding_completed IS 'Whether the user has completed the dashboard spotlight tour';
