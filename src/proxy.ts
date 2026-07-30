import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname === '/login' ||
    pathname.startsWith('/client/review') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/cron') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  try {
    return await updateSession(request)
  } catch {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
