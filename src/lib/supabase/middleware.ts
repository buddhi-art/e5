import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Lightweight auth check that avoids fetch calls from edge runtime.
 *
 * The Supabase JS client's `getUser()` triggers a network request to
 * the Supabase auth endpoint. In Turbopack's edge sandbox, `context.fetch`
 * can fail intermittently (AuthRetryableFetchError), crashing the entire
 * middleware pipeline.
 *
 * Instead we read the session directly from the cookie, which involves
 * zero network I/O. Real auth enforcement happens in server components
 * and server actions, where fetch() works reliably.
 *
 * See: https://supabase.com/docs/guides/auth/server-side/nextjs?queryGroups=router&router=app#cookie-based-auth
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Get session from cookies — this is local, no fetch involved
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData?.session
  const path = request.nextUrl.pathname

  // Not logged in → login page
  if (!session) {
    if (path !== '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // From here on, session exists

  // Logged in and on login page → redirect to portal (best-effort)
  if (path === '/login') {
    try {
      const portal = await getPortal(session.user.id, supabase)
      const url = request.nextUrl.clone()
      url.pathname = portal
      return NextResponse.redirect(url)
    } catch {
      // If profile fetch fails, still allow access — user is authenticated
      const url = request.nextUrl.clone()
      url.pathname = '/employee'
      return NextResponse.redirect(url)
    }
  }

  // Portal-based route protection (best-effort — network errors allow through)
  if (path !== '/login') {
    let portal: string
    try {
      portal = await getPortal(session.user.id, supabase)
    } catch {
      // Profile fetch failed (edge runtime network issue).
      // Allow request through rather than causing a redirect loop.
      return supabaseResponse
    }

    // Founder routes
    if (portal === '/founder') {
      if (path.startsWith('/admin') || path.startsWith('/employee')) {
        const url = request.nextUrl.clone()
        url.pathname = '/founder'
        return NextResponse.redirect(url)
      }
    }

    // Admin routes
    if (portal === '/admin') {
      if (path.startsWith('/founder') || path.startsWith('/employee')) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      }
    }

    // Employee routes
    if (portal === '/employee') {
      if (path.startsWith('/admin') || path.startsWith('/founder')) {
        const url = request.nextUrl.clone()
        url.pathname = '/employee'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

async function getPortal(
  userId: string,
  supabase: ReturnType<typeof createServerClient>,
): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, designation, deleted_at')
    .eq('id', userId)
    .single()

  if (profile?.deleted_at) {
    return '/login'
  }

  if (profile?.designation === 'Founder') {
    return '/founder'
  }

  if (profile?.role === 'admin') {
    return '/admin'
  }

  return '/employee'
}
