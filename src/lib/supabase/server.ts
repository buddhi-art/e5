import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates the request-scoped Supabase client used by Server Components and
 * Server Actions. Database types are intentionally omitted until they are
 * generated from the deployed schema (`supabase gen types typescript`); an
 * incomplete hand-written schema is less safe than the SDK's default types.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
