/**
 * Tracks AI token usage for a user by incrementing their cumulative counter.
 * Call this after every OpenAI API call with the completion.usage.total_tokens value.
 *
 * @param {object} supabase - Authenticated Supabase client
 * @param {string} userId - The user's ID
 * @param {number} tokens - Number of tokens to add
 */
export async function trackTokens(supabase, userId, tokens) {
  if (!tokens || tokens <= 0) return

  try {
    // Fetch current count and increment
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('ai_tokens_used')
      .eq('user_id', userId)
      .single()

    const current = profile?.ai_tokens_used || 0
    await supabase
      .from('user_profiles')
      .update({ ai_tokens_used: current + tokens })
      .eq('user_id', userId)
  } catch (error) {
    // Non-fatal: don't break the API call if tracking fails
    console.error('Token tracking error:', error)
  }
}
