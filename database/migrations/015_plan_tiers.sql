-- Migration: Create plan_tiers table for dynamic tier-based limits
-- This enables server-side limit enforcement that can be changed from Supabase
-- Run this in Supabase SQL Editor

BEGIN;

-- Create plan_tiers table to map variant_id -> plan limits
CREATE TABLE IF NOT EXISTS public.plan_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,                    -- 'free', 'pro', 'plus'
  display_name TEXT NOT NULL,                   -- 'Free', 'Pro', 'Plus'
  variant_id TEXT,                              -- Lemon Squeezy variant ID (NULL for free tier)
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  note_limit INTEGER NOT NULL,
  transcription_minutes INTEGER NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,           -- Array of feature strings for display
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,             -- Default tier for active subscribers without match
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_plan_tiers_variant_id ON public.plan_tiers(variant_id);
CREATE INDEX IF NOT EXISTS idx_plan_tiers_name ON public.plan_tiers(name);
CREATE INDEX IF NOT EXISTS idx_plan_tiers_is_default ON public.plan_tiers(is_default) WHERE is_default = TRUE;

-- Enable RLS
ALTER TABLE public.plan_tiers ENABLE ROW LEVEL SECURITY;

-- Read-only for all users (tiers are public information)
CREATE POLICY "Anyone can read plan tiers"
ON public.plan_tiers FOR SELECT
USING (true);

-- Grant permissions
GRANT SELECT ON public.plan_tiers TO authenticated, anon;
GRANT ALL ON public.plan_tiers TO service_role;

-- Insert the three tiers
-- IMPORTANT: The Pro tier uses the EXISTING variant ID (1236225) so all current subscribers
-- are automatically mapped to Pro with no disruption
INSERT INTO public.plan_tiers (name, display_name, variant_id, price_monthly, note_limit, transcription_minutes, features, is_default) VALUES
  (
    'free',
    'Free',
    NULL,
    0,
    5,
    15,
    '["5 notes per month", "15 minutes transcription", "AI transcription", "Basic summaries"]'::jsonb,
    FALSE
  ),
  (
    'pro',
    'Pro',
    '1236225',  -- Current LEMON_SQUEEZY_VARIANT_ID - existing subscribers auto-mapped here
    14.99,
    15,
    150,
    '["15 notes per month", "150 minutes transcription", "AI summaries", "Brain Dump synthesis", "Remy AI assistant", "Tags & folders", "Full search", "Action items"]'::jsonb,
    TRUE  -- is_default=TRUE: fallback for any active subscriber without a matching variant
  ),
  (
    'plus',
    'Plus',
    NULL,  -- Update this with the Plus variant ID after creating in Lemon Squeezy
    24.99,
    30,
    300,
    '["30 notes per month", "300 minutes transcription", "Everything in Pro", "Advanced Remy AI", "Google Calendar integration", "Priority support"]'::jsonb,
    FALSE
  )
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  variant_id = EXCLUDED.variant_id,
  price_monthly = EXCLUDED.price_monthly,
  note_limit = EXCLUDED.note_limit,
  transcription_minutes = EXCLUDED.transcription_minutes,
  features = EXCLUDED.features,
  is_default = EXCLUDED.is_default,
  updated_at = NOW();

-- Add plan_name column to user_profiles for explicit tier tracking
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'free';

-- Create index for plan_name lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan_name ON public.user_profiles(plan_name);

-- Migrate existing users:
-- Active subscribers -> 'pro' (they're getting an upgrade from 10/100 to 15/150!)
UPDATE public.user_profiles
SET plan_name = 'pro'
WHERE subscription_status = 'active';

-- Inactive/cancelled/null -> 'free'
UPDATE public.user_profiles
SET plan_name = 'free'
WHERE subscription_status IS NULL
   OR subscription_status IN ('inactive', 'cancelled')
   OR plan_name IS NULL;

-- Add trigger for updated_at on plan_tiers
CREATE OR REPLACE FUNCTION public.set_plan_tiers_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_plan_tiers_updated_at ON public.plan_tiers;
CREATE TRIGGER trg_plan_tiers_updated_at
BEFORE UPDATE ON public.plan_tiers
FOR EACH ROW EXECUTE FUNCTION public.set_plan_tiers_updated_at();

COMMIT;
