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
      // PKCE errors happen when email is opened in a different browser/context
      // Redirect with a friendly message instead of the raw error
      if (exchangeError.message?.includes('code verifier')) {
        return NextResponse.redirect(`${origin}/auth?verified=true`)
      }
      return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(exchangeError.message)}`)
    }

    if (data.session) {
      const user = data.session.user

      // Profile is auto-created by database trigger on signup.
      // Just check its status to decide where to route.
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed, subscription_status')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!profile || !profile.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`)
      } else if (profile.subscription_status !== 'active') {
        return NextResponse.redirect(`${origin}/subscribe`)
      } else {
        return NextResponse.redirect(`${origin}/dashboard`)
      }
    }
  }

  // Return to auth page if something went wrong
  return NextResponse.redirect(`${origin}/auth?error=callback_failed`)
}
