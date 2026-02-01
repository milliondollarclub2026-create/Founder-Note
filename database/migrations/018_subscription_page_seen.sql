-- Migration: Add subscription_page_seen tracking
-- Run this in Supabase SQL Editor
--
-- This field tracks whether a user has seen the subscription/plan selection page
-- and made a choice (including choosing the free tier).
--
-- Needed because plan_name defaults to 'free', so we can't use it to determine
-- if the user has actually made a conscious plan choice.

-- Add subscription_page_seen column (defaults to FALSE for new users)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS subscription_page_seen BOOLEAN DEFAULT FALSE;

-- For existing users who have an active subscription, they've obviously made a choice
UPDATE public.user_profiles
SET subscription_page_seen = TRUE
WHERE subscription_status = 'active';

-- For existing users who have been using the app (have notes), mark as seen
-- This prevents existing users from being forced to see the subscribe page again
UPDATE public.user_profiles up
SET subscription_page_seen = TRUE
WHERE EXISTS (
  SELECT 1 FROM public.notes n WHERE n.user_id = up.user_id
);

-- Verification
SELECT 'Subscription page seen distribution:' as info;
SELECT
  subscription_page_seen,
  COUNT(*) as user_count
FROM public.user_profiles
GROUP BY subscription_page_seen;
