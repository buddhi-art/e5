'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginSchema } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_WINDOW_MS = 60_000 // 1 minute

export async function login(formData: FormData) {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  let email = parsed.data.email
  if (email && !email.includes('@')) {
    email = `${email}@e5chronicles.com`
  }

  // Rate limit by email to prevent brute force
  const { success } = await checkRateLimit(
    `login:${email.toLowerCase()}`,
    MAX_LOGIN_ATTEMPTS,
    LOGIN_WINDOW_MS,
  )
  if (!success) {
    return { error: 'Too many login attempts. Please try again in a minute.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  })

  if (error) {
    // Use a generic message to prevent username enumeration
    // Supabase returns different errors for "user not found" vs "invalid password"
    return { error: 'Invalid login credentials. Please try again.' }
  }

  revalidatePath('/', 'layout')
  // Redirect to a neutral base path — proxy will route to the correct portal
  // based on the user's role, avoiding a double redirect flicker
  redirect('/')
}
