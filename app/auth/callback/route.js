import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description)
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
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
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
      }
    )

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Auth callback error:', exchangeError)
      return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(exchangeError.message)}`)
    }

    if (data.session) {
      const user = data.session.user
      
      // Check if profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const isGoogleUser = user.app_metadata?.provider === 'google'
        
        await supabase.from('user_profiles').insert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
          email: user.email,
          onboarding_completed: false,
          subscription_status: 'inactive',
          auth_provider: isGoogleUser ? 'google' : 'email',
        })
        
        return NextResponse.redirect(`${origin}/onboarding`)
      } else if (existingProfile) {
        // Profile exists, check status
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
  }

  // Return to auth page if something went wrong
  return NextResponse.redirect(`${origin}/auth?error=callback_failed`)
}
