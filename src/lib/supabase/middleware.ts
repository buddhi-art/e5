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

  // Protect routes based on role and authentication
  const path = request.nextUrl.pathname

  if (!user && path !== '/login') {
    // If not logged in and not on login page, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && path === '/login') {
    // If logged in and on login page, check email and redirect
    const url = request.nextUrl.clone()
    if (user.email === 'admin@e5chronicles.com') {
      url.pathname = '/admin'
    } else {
      url.pathname = '/employee'
    }
    return NextResponse.redirect(url)
  }

  // Prevent employees from accessing admin routes
  if (user && path.startsWith('/admin')) {
    if (user.email !== 'admin@e5chronicles.com') {
      const url = request.nextUrl.clone()
      url.pathname = '/employee'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
