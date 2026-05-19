import { type NextRequest, NextResponse } from 'next/server'

// TODO: Re-enable auth before production launch
const BYPASS_AUTH = true

export async function proxy(request: NextRequest) {
  if (BYPASS_AUTH) {
    return NextResponse.next()
  }

  const { updateSession } = await import('@/lib/supabase/middleware')
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}