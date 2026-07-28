'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChangePasscodeSchema } from '@/lib/validations'

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

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPasscode,
  })
  if (verifyError) return { error: 'Current passcode is incorrect.' }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPasscode,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
