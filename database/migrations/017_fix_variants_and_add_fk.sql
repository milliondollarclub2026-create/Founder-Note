-- Migration: Fix variant IDs and add foreign key constraint
-- Run this in Supabase SQL Editor
--
-- CORRECT MAPPING:
-- PRO  = variant 1267877 (existing users are on this, $14.99)
-- PLUS = variant 1236225 (no users yet, $24.99)
--
-- This migration:
-- 1. Corrects the variant_id mapping
-- 2. Updates existing active subscribers to plan_name='pro'
-- 3. Adds foreign key constraint from user_profiles.plan_name to plan_tiers.name

BEGIN;

-- ============================================
-- STEP 1: Fix variant IDs in plan_tiers
-- ============================================

-- Pro tier gets variant 1267877 (existing users are subscribed to this)
UPDATE public.plan_tiers
SET
  variant_id = '1267877',
  is_default = TRUE,  -- Pro is the default for active subscribers
  updated_at = NOW()
WHERE name = 'pro';

-- Plus tier gets variant 1236225 (new variant, no users yet)
UPDATE public.plan_tiers
SET
  variant_id = '1236225',
  is_default = FALSE,
  updated_at = NOW()
WHERE name = 'plus';

-- Free tier has no variant
UPDATE public.plan_tiers
SET
  variant_id = NULL,
  is_default = FALSE,
  updated_at = NOW()
WHERE name = 'free';

-- ============================================
-- STEP 2: Migrate existing users to 'pro'
-- ============================================

-- All active subscribers get plan_name = 'pro'
-- (They're on variant 1267877 which maps to Pro)
UPDATE public.user_profiles
SET plan_name = 'pro'
WHERE subscription_status = 'active';

-- Inactive/cancelled/null users get 'free'
UPDATE public.user_profiles
SET plan_name = 'free'
WHERE subscription_status IS NULL
   OR subscription_status IN ('inactive', 'cancelled', 'expired')
   OR plan_name IS NULL;

-- ============================================
-- STEP 3: Add foreign key constraint
-- ============================================

-- First verify no invalid plan_names exist
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM public.user_profiles up
  WHERE up.plan_name IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.plan_tiers pt WHERE pt.name = up.plan_name
    );

  IF invalid_count > 0 THEN
    RAISE NOTICE 'Found % users with invalid plan_name, fixing...', invalid_count;

    -- Fix invalid plan_names by setting to 'free'
    UPDATE public.user_profiles
    SET plan_name = 'free'
    WHERE plan_name IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.plan_tiers pt WHERE pt.name = plan_name
      );
  END IF;
END $$;

-- Drop existing FK if it exists (in case of re-run)
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS fk_user_profiles_plan_name;

-- Add the foreign key constraint
ALTER TABLE public.user_profiles
ADD CONSTRAINT fk_user_profiles_plan_name
FOREIGN KEY (plan_name) REFERENCES public.plan_tiers(name)
ON UPDATE CASCADE
ON DELETE SET DEFAULT;

-- ============================================
-- STEP 4: Verification queries
-- ============================================

-- Show plan_tiers configuration
SELECT 'Plan tiers configuration:' as info;
SELECT name, display_name, variant_id, price_monthly, note_limit, transcription_minutes, is_default
FROM public.plan_tiers
ORDER BY price_monthly;

-- Show user distribution
SELECT 'User distribution by plan:' as info;
SELECT
  plan_name,
  subscription_status,
  COUNT(*) as user_count
FROM public.user_profiles
GROUP BY plan_name, subscription_status
ORDER BY plan_name, subscription_status;

-- Verify FK constraint exists
SELECT 'Foreign key constraints on user_profiles:' as info;
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'user_profiles'
  AND tc.constraint_type = 'FOREIGN KEY';

COMMIT;
