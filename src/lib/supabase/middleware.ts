import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  if (!supabaseUrl.startsWith('http')) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublicPath = path === '/' || path === '/login' || path === '/signup'
    || path === '/forgot-password' || path === '/reset-password'
  const isApiRoute = path.startsWith('/api/')
  const isOnboarding = path === '/onboarding'

  // Not logged in — send to login for any protected route
  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logged in — check onboarding completion for all non-API routes
  if (user && !isPublicPath && !isApiRoute) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    const completedOnboarding = profile?.onboarding_completed ?? false

    // On login/signup while already authenticated
    if (path === '/login' || path === '/signup') {
      return NextResponse.redirect(
        new URL(completedOnboarding ? '/home' : '/onboarding', request.url)
      )
    }

    // Not completed onboarding — gate all dashboard routes
    if (!completedOnboarding && !isOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return supabaseResponse
}
