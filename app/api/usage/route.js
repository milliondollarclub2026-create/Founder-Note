import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase-server'
import { getUserLimits } from '@/lib/plan-tiers'

export async function GET() {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get dynamic limits based on user's plan
    const limits = await getUserLimits(supabase, user.id)

    // Count user's notes
    const { count, error: countError } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('Note count error:', countError)
      return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 })
    }

    // Get transcription seconds and AI tokens used
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('transcription_seconds_used, ai_tokens_used')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 })
    }

    const notesUsed = count || 0
    const secondsUsed = profile?.transcription_seconds_used || 0
    const minutesUsed = Math.round(secondsUsed / 60)
    const tokensUsed = profile?.ai_tokens_used || 0

    const notePercent = (notesUsed / limits.note_limit) * 100
    const transPercent = (secondsUsed / limits.transcription_seconds) * 100

    // Calculate remaining time for recording UI
    const remainingSeconds = Math.max(0, limits.transcription_seconds - secondsUsed)
    const remainingMinutes = Math.floor(remainingSeconds / 60)

    return NextResponse.json({
      plan: {
        name: limits.name,
        displayName: limits.display_name,
      },
      notes: {
        used: notesUsed,
        limit: limits.note_limit,
        percent: Math.min(notePercent, 100),
      },
      transcription: {
        usedSeconds: secondsUsed,
        usedMinutes: minutesUsed,
        limitMinutes: limits.transcription_minutes,
        limitSeconds: limits.transcription_seconds,
        percent: Math.min(transPercent, 100),
        remainingSeconds,
        remainingMinutes,
      },
      aiTokens: {
        used: tokensUsed,
      },
      warnings: {
        notes80: notePercent >= 80 && notePercent < 90,
        notes90: notePercent >= 90 && notePercent < 100,
        notesMax: notesUsed >= limits.note_limit,
        trans80: transPercent >= 80 && transPercent < 90,
        trans90: transPercent >= 90 && transPercent < 100,
        transMax: secondsUsed >= limits.transcription_seconds,
      },
    })
  } catch (error) {
    console.error('Usage API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
