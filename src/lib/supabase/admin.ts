import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

function getAdminClient(): SupabaseClient {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase server configuration is missing')
  }
  client = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return client
}

// Preserve the existing call sites while deferring secret-dependent client
// construction until an admin operation is actually invoked.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, property, receiver) {
    const value = Reflect.get(getAdminClient() as object, property, receiver)
    return typeof value === 'function' ? value.bind(getAdminClient()) : value
  },
})
