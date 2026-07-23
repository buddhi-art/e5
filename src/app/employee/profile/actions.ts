/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { EmployeeProfileSchema } from '@/lib/validations'

export async function updateEmployeeProfile(formData: FormData) {
  try {
    // Authenticate the user via the session cookie
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // First, fetch the existing profile to preserve vehicle and other social_urls data.
    // Uses the RLS-enforced session client (not the service-role client) — the user is
    // only ever reading/writing their own row (eq id = user.id), so RLS is sufficient.
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('social_urls')
      .eq('id', user.id)
      .single()

    const existingSocial = existingProfile?.social_urls || {}

    const parsed = EmployeeProfileSchema.safeParse({
      location: formData.get('location'),
      dob: formData.get('dob'),
      cvUrl: formData.get('cvUrl'),
      tiktok: formData.get('tiktok'),
      facebook: formData.get('facebook'),
      instagram: formData.get('instagram'),
      threads: formData.get('threads'),
    });

    if (!parsed.success) {
      return { error: 'Validation failed: ' + parsed.error.issues[0].message };
    }
    const data = parsed.data;

    // Social Links — merge with existing data to preserve vehicle etc.
    const socialUrls = {
      ...existingSocial,
      tiktok: data.tiktok || '',
      facebook: data.facebook || '',
      instagram: data.instagram || '',
      threads: data.threads || '',
    }

    // Only update fields the employee is allowed to change
    const updateData: Record<string, any> = {
      location: data.location || null,
      dob: data.dob || null,
      cv_url: data.cvUrl || null,
      social_urls: socialUrls,
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (profileError) {
      return { error: profileError.message }
    }

    revalidatePath('/employee/profile')
    revalidatePath('/employee')
    revalidatePath('/admin/employees')
    return { success: true }
  } catch (err: unknown) {
    console.error('Error in updateEmployeeProfile:', err)
    return { error: (err instanceof Error ? err.message : String(err)) || 'An unexpected error occurred' }
  }
}
