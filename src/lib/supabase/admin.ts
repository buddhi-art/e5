import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Note: This client uses the service role key and bypasses Row Level Security.
// ONLY use this in server actions / API routes and NEVER pass it to the client.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
