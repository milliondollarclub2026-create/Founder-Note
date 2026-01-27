import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client bound to the current user's session cookies.
 * This client uses the ANON key and respects RLS policies.
 */
export function createAuthenticatedClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll is called from Server Components where cookies cannot be set.
            // This is safe to ignore if middleware is refreshing sessions.
          }
        },
      },
    }
  )
}

/**
 * Verifies the user session from cookies and returns the authenticated user
 * along with an RLS-enforcing Supabase client.
 *
 * Usage:
 *   const { user, supabase } = await getAuthenticatedUser()
 *   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 */
export async function getAuthenticatedUser() {
  const supabase = createAuthenticatedClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, supabase: null }
  }

  return { user, supabase }
}
