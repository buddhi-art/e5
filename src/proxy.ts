import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
    // Skip proxy for static files, API routes that don't need auth,
    // and login/register pages to avoid auth-fetch loops
    const url = request.nextUrl.clone()
    const { pathname } = url

    // Always allow login page and static assets through without auth checks
    if (
        pathname === '/login' ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api/cron') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next()
    }

    try {
        return await updateSession(request)
    } catch (error: any) {
        // Any auth/network failure: redirect to login safely
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        return NextResponse.redirect(loginUrl)
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
