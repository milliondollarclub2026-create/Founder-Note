import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') || 'email'

  if (!token_hash) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent('Invalid verification link')}`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Can be ignored in Server Components
          }
        },
      },
    }
  )

  // Verify the OTP token hash — this creates a session without PKCE
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash,
    type,
  })

  if (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent('Verification failed. Please try signing in or request a new link.')}`
    )
  }

  if (data.session) {
    const user = data.session.user

    // Check if profile exists (same logic as callback)
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist — create it
      await supabase.from('user_profiles').insert({
        user_id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
        email: user.email,
        onboarding_completed: false,
        subscription_status: 'inactive',
        auth_provider: 'email',
      })

      return NextResponse.redirect(`${origin}/onboarding`)
    } else if (existingProfile) {
      if (!existingProfile.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`)
      } else if (existingProfile.subscription_status !== 'active') {
        return NextResponse.redirect(`${origin}/subscribe`)
      } else {
        return NextResponse.redirect(`${origin}/dashboard`)
      }
    } else {
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Session wasn't created but no error — redirect to login with success message
  return NextResponse.redirect(`${origin}/auth?verified=true`)
}
