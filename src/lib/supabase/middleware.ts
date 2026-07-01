import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Not logged in → login page
  if (!user && path !== '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Protect routes based on portal
  if (user) {
    const portal = await getPortal(user.id, supabase)

    if (path === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = portal
      return NextResponse.redirect(url)
    }

    // Founder trying to access admin or employee routes
    if (portal === '/founder') {
      if (path.startsWith('/admin') || path.startsWith('/employee')) {
        const url = request.nextUrl.clone()
        url.pathname = '/founder'
        return NextResponse.redirect(url)
      }
    }

    // Admin trying to access founder or employee routes
    if (portal === '/admin') {
      if (path.startsWith('/founder') || path.startsWith('/employee')) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      }
    }

    // Employee trying to access admin or founder routes
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
  // Try to get profile for this user
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, designation')
    .eq('id', userId)
    .single()

  // Founder designation — founder portal
  if (profile?.designation === 'Founder') {
    return '/founder'
  }

  // Admin role — admin portal
  if (profile?.role === 'admin') {
    return '/admin'
  }

  // Fallback — employee portal
  return '/employee'
}
