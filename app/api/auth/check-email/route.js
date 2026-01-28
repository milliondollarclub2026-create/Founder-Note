import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ exists: false })
    }

    const supabase = createAdminClient()
    const { data } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    return NextResponse.json({ exists: !!data })
  } catch {
    // On any error, fall back to generic behavior
    return NextResponse.json({ exists: true })
  }
}
