'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function changePasscode(newPasscode: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: newPasscode
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
