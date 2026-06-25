'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateEmployeeProfile(formData: FormData) {
  try {
    // Authenticate the user via the session cookie
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // First, fetch the existing profile to preserve vehicle and other social_urls data
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('social_urls')
      .eq('id', user.id)
      .single()

    const existingSocial = existingProfile?.social_urls || {}

    const location = formData.get('location') as string
    const dob = formData.get('dob') as string
    const cvUrl = formData.get('cvUrl') as string

    // Social Links — merge with existing data to preserve vehicle etc.
    const socialUrls = {
      ...existingSocial,
      tiktok: formData.get('tiktok') as string || '',
      facebook: formData.get('facebook') as string || '',
      instagram: formData.get('instagram') as string || '',
      threads: formData.get('threads') as string || '',
    }

    // Only update fields the employee is allowed to change
    const updateData: Record<string, any> = {
      location: location || null,
      dob: dob || null,
      cv_url: cvUrl || null,
      social_urls: socialUrls,
    }

    // Use admin client to bypass RLS
    const { error: profileError } = await supabaseAdmin
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
  } catch (err: any) {
    console.error('Error in updateEmployeeProfile:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}
