import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase-server'

const NOTE_LIMIT = 10
const TRANSCRIPTION_LIMIT_SECONDS = 6000 // 100 minutes

export async function GET() {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

    const notePercent = (notesUsed / NOTE_LIMIT) * 100
    const transPercent = (secondsUsed / TRANSCRIPTION_LIMIT_SECONDS) * 100

    return NextResponse.json({
      notes: {
        used: notesUsed,
        limit: NOTE_LIMIT,
        percent: Math.min(notePercent, 100),
      },
      transcription: {
        usedSeconds: secondsUsed,
        usedMinutes: minutesUsed,
        limitMinutes: 100,
        limitSeconds: TRANSCRIPTION_LIMIT_SECONDS,
        percent: Math.min(transPercent, 100),
      },
      aiTokens: {
        used: tokensUsed,
      },
      warnings: {
        notes80: notePercent >= 80 && notePercent < 90,
        notes90: notePercent >= 90 && notePercent < 100,
        notesMax: notesUsed >= NOTE_LIMIT,
        trans80: transPercent >= 80 && transPercent < 90,
        trans90: transPercent >= 90 && transPercent < 100,
        transMax: secondsUsed >= TRANSCRIPTION_LIMIT_SECONDS,
      },
    })
  } catch (error) {
    console.error('Usage API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
