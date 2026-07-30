'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChangePasscodeSchema } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function changePasscode(currentPasscode: string, newPasscode: string) {
  const parsed = ChangePasscodeSchema.safeParse({ currentPasscode, newPasscode })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Not authenticated' }

  const rateLimit = await checkRateLimit(`change-passcode:${user.id}`, 5, 15 * 60 * 1000)
  if (!rateLimit.success) return { error: 'Too many attempts. Try again later.' }

  // Verify the current passcode via signInWithPassword.
  // Note: This rotates the session's refresh token as a side-effect —
  // the new session is sent back via Set-Cookie so the caller stays
  // authenticated. A dedicated password-verification API (RPC or
  // admin-auth check) would avoid the rotation but is not exposed by
  // Supabase's JS SDK. The trade-off is acceptable here because:
  //   1. Fresh cookies replace the old ones in the response.
  //   2. The 5-attempt rate limit prevents abuse.
  //   3. The SAQ (same-as-current) guard below prevents downgrade.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPasscode,
  })
  if (verifyError) return { error: 'Current passcode is incorrect.' }

  // Prevent trivial "change" to the same value — avoids unnecessary
  // session rotation and the false impression of a change.
  if (parsed.data.currentPasscode === parsed.data.newPasscode) {
    return { error: 'New passcode must be different from the current one.' }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPasscode,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
