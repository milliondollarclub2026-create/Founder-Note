// Plan tiers utility - centralized plan lookup with caching
// Used by API routes to fetch dynamic limits from Supabase

// In-memory cache for plan tiers (refreshed every 5 minutes)
let tiersCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Default limits for free tier (fallback if database unavailable)
const FREE_TIER_DEFAULTS = {
  name: 'free',
  display_name: 'Free',
  note_limit: 5,
  transcription_minutes: 15,
  transcription_seconds: 15 * 60, // 900 seconds
  price_monthly: 0,
  features: ['5 notes per month', '15 minutes transcription', 'AI transcription', 'Basic summaries'],
};

// Default limits for pro tier (fallback)
const PRO_TIER_DEFAULTS = {
  name: 'pro',
  display_name: 'Pro',
  note_limit: 15,
  transcription_minutes: 150,
  transcription_seconds: 150 * 60, // 9000 seconds
  price_monthly: 14.99,
  features: ['15 notes per month', '150 minutes transcription', 'AI summaries', 'Brain Dump synthesis', 'Remy AI assistant', 'Tags & folders'],
};

/**
 * Fetch all active plan tiers from database
 * Results are cached for 5 minutes to reduce database queries
 */
export async function getAllTiers(supabase) {
  const now = Date.now();

  // Return cached data if still valid
  if (tiersCache && (now - cacheTimestamp) < CACHE_TTL) {
    return tiersCache;
  }

  try {
    const { data, error } = await supabase
      .from('plan_tiers')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) {
      console.error('Failed to fetch plan tiers:', error);
      // Return stale cache if available, otherwise return defaults
      return tiersCache || [FREE_TIER_DEFAULTS, PRO_TIER_DEFAULTS];
    }

    // Add computed transcription_seconds to each tier
    tiersCache = data.map(tier => ({
      ...tier,
      transcription_seconds: tier.transcription_minutes * 60,
    }));
    cacheTimestamp = now;

    return tiersCache;
  } catch (err) {
    console.error('Error fetching plan tiers:', err);
    return tiersCache || [FREE_TIER_DEFAULTS, PRO_TIER_DEFAULTS];
  }
}

/**
 * Get a specific tier by its Lemon Squeezy variant ID
 */
export async function getTierByVariantId(supabase, variantId) {
  const tiers = await getAllTiers(supabase);

  if (!variantId) {
    // No variant = free tier
    return tiers.find(t => t.name === 'free') || FREE_TIER_DEFAULTS;
  }

  const tier = tiers.find(t => t.variant_id === variantId);
  return tier || null;
}

/**
 * Get a specific tier by name ('free', 'pro', 'plus')
 */
export async function getTierByName(supabase, name) {
  const tiers = await getAllTiers(supabase);
  return tiers.find(t => t.name === name) || null;
}

/**
 * Get the default tier for active subscribers without a matching variant
 * This ensures existing users don't lose access if their variant isn't in the table
 */
export async function getDefaultTier(supabase) {
  const tiers = await getAllTiers(supabase);
  const defaultTier = tiers.find(t => t.is_default === true);
  return defaultTier || tiers.find(t => t.name === 'pro') || PRO_TIER_DEFAULTS;
}

/**
 * Get the free tier
 */
export async function getFreeTier(supabase) {
  const tiers = await getAllTiers(supabase);
  return tiers.find(t => t.name === 'free') || FREE_TIER_DEFAULTS;
}

/**
 * Get plan name by variant ID (for webhook updates)
 */
export async function getPlanNameByVariantId(supabase, variantId) {
  if (!variantId) return 'free';

  const tier = await getTierByVariantId(supabase, variantId);
  return tier?.name || 'pro'; // Default to pro for safety
}

/**
 * Get user's current plan limits based on their subscription status
 * This is the main function used by API routes
 *
 * @param {object} supabase - Supabase client
 * @param {string} userId - The user's ID
 * @returns {object} Plan tier with limits (note_limit, transcription_seconds, etc.)
 */
export async function getUserLimits(supabase, userId) {
  try {
    // Fetch user's subscription info from user_profiles
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('subscription_variant_id, subscription_status, plan_name')
      .eq('user_id', userId)
      .single();

    // Case 1: No profile found = Free tier
    if (error || !profile) {
      return await getFreeTier(supabase);
    }

    // Case 2: Inactive/Cancelled/No subscription = Free tier
    if (!profile.subscription_status ||
        profile.subscription_status === 'cancelled' ||
        profile.subscription_status === 'inactive') {
      return await getFreeTier(supabase);
    }

    // Case 3: Active subscription - look up by variant_id
    if (profile.subscription_status === 'active') {
      // Try exact variant match first
      if (profile.subscription_variant_id) {
        const tier = await getTierByVariantId(supabase, profile.subscription_variant_id);
        if (tier) return tier;
      }

      // Try by plan_name if variant didn't match
      if (profile.plan_name && profile.plan_name !== 'free') {
        const tier = await getTierByName(supabase, profile.plan_name);
        if (tier) return tier;
      }

      // Fallback: Get default tier (Pro) for active subscribers without matching variant
      // This handles existing users whose variant_id might not be in the table yet
      return await getDefaultTier(supabase);
    }

    // Ultimate fallback: Free tier
    return await getFreeTier(supabase);
  } catch (err) {
    console.error('Error getting user limits:', err);
    // On any error, return free tier to prevent blocking users
    return FREE_TIER_DEFAULTS;
  }
}

/**
 * Clear the tiers cache (useful for testing or after admin updates)
 */
export function clearTiersCache() {
  tiersCache = null;
  cacheTimestamp = 0;
}
