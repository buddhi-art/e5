'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createEmployee(formData: FormData) {
  try {
    let loginId = formData.get('loginId') as string
    if (loginId && !loginId.includes('@')) {
      loginId = `${loginId}@e5chronicles.com`
    }
    const password = formData.get('password') as string
    const contactEmail = formData.get('contactEmail') as string
    const fullName = formData.get('fullName') as string
    let designation = formData.get('designation') as string
    if (designation === 'ADD_NEW') {
      designation = formData.get('newDesignation') as string
      if (designation) {
        await supabaseAdmin.from('designations').insert({ name: designation }).select()
      }
    }

    const phone = formData.get('phone') as string
    const location = formData.get('location') as string
    const joiningDate = formData.get('joiningDate') as string
    const dob = formData.get('dob') as string
    const cvUrl = formData.get('cvUrl') as string

    // Social Links
    const socialUrls = {
      tiktok: formData.get('tiktok') as string || '',
      facebook: formData.get('facebook') as string || '',
      instagram: formData.get('instagram') as string || '',
      threads: formData.get('threads') as string || '',
    }

    if (!loginId || !password || !fullName || !designation) {
      return { error: 'Full Name, Login ID, Password and Designation are required' }
    }

    // Use the admin API to create the user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: loginId,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      }
    })

    if (authError) {
      return { error: authError.message }
    }

    if (authData.user) {
      // Small delay to let the trigger fire
      await new Promise(resolve => setTimeout(resolve, 500))

      const updateData: Record<string, any> = {
        email: loginId,
        contact_email: contactEmail || null,
        designation,
        phone_number: phone || null,
        location: location || null,
        joining_date: joiningDate || null,
        dob: dob || null,
        cv_url: cvUrl || null,
        social_urls: socialUrls,
      }

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', authData.user.id)

      if (profileError) {
        return { error: 'User created but failed to set profile details: ' + profileError.message }
      }
    }

    revalidatePath('/admin/employees')
    return { success: true }
  } catch (err: any) {
    console.error('Error in createEmployee:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function archiveEmployee(employeeId: string) {
  try {
    // First, nullify all non-completed task assignments for this employee
    const { error: taskError } = await supabaseAdmin
      .from('tasks')
      .update({ assigned_to: null })
      .eq('assigned_to', employeeId)
      .neq('status', 'completed')

    if (taskError) {
      console.error("Failed to nullify tasks:", taskError)
      // Continue with archive even if task nullification fails
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', employeeId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/employees')
    revalidatePath('/admin/tasks')
    revalidatePath('/admin/calendar')
    return { success: true }
  } catch (err: any) {
    console.error("Failed to archive employee:", err)
    return { error: err.message || "An unexpected error occurred" }
  }
}

export async function deleteEmployee(employeeId: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(employeeId)
    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/employees')
    revalidatePath('/admin/tasks')
    revalidatePath('/admin/calendar')
    return { success: true }
  } catch (err: any) {
    console.error("Failed to delete employee:", err)
    return { error: err.message || "An unexpected error occurred" }
  }
}

export async function restoreEmployee(employeeId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ deleted_at: null })
      .eq('id', employeeId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/employees')
    return { success: true }
  } catch (err: any) {
    console.error("Failed to restore employee:", err)
    return { error: err.message || "An unexpected error occurred" }
  }
}

export async function updateEmployee(employeeId: string, data: {
  full_name: string
  login_id: string
  contact_email: string | null
  password: string | null
  designation: string
  phone_number: string | null
  location: string | null
  joining_date: string | null
  dob: string | null
  cv_url: string | null
  social_urls: Record<string, string> | null
}) {
  try {
    if (!data.full_name || !data.designation || !data.login_id) {
      return { error: 'Full Name, Login ID and Designation are required' }
    }

    let formattedLoginId = data.login_id
    if (formattedLoginId && !formattedLoginId.includes('@')) {
      formattedLoginId = `${formattedLoginId}@e5chronicles.com`
    }

    // If this designation doesn't exist yet in the lookup table, insert it
    await supabaseAdmin
      .from('designations')
      .upsert({ name: data.designation }, { onConflict: 'name' })

    // Update the profile in the profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: data.full_name,
        email: formattedLoginId,
        contact_email: data.contact_email || null,
        designation: data.designation,
        phone_number: data.phone_number || null,
        location: data.location || null,
        joining_date: data.joining_date || null,
        dob: data.dob || null,
        cv_url: data.cv_url || null,
        social_urls: data.social_urls,
      })
      .eq('id', employeeId)

    if (profileError) {
      return { error: profileError.message }
    }

    // Update auth user - email, password, metadata
    const authUpdate: Record<string, any> = {
      email: formattedLoginId,
      user_metadata: { full_name: data.full_name },
    }

    // Only update password if a new one was provided
    if (data.password) {
      authUpdate.password = data.password
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(employeeId, authUpdate)

    if (authError) {
      return { error: 'Profile updated but failed to update auth: ' + authError.message }
    }

    revalidatePath('/admin/employees')
    return { success: true }
  } catch (err: any) {
    console.error('Error in updateEmployee:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}
