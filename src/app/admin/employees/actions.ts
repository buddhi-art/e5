'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { CreateEmployeeSchema, UpdateEmployeeSchema, UuidParamSchema } from '@/lib/validations'
import { verifyAdminOrFounder } from '@/lib/auth-utils'

export async function createEmployee(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = CreateEmployeeSchema.safeParse({
      loginId: formData.get('loginId'),
      password: formData.get('password'),
      fullName: formData.get('fullName'),
      designation: formData.get('designation'),
      newDesignation: formData.get('newDesignation'),
      contactEmail: formData.get('contactEmail'),
      phone: formData.get('phone'),
      location: formData.get('location'),
      joiningDate: formData.get('joiningDate'),
      dob: formData.get('dob'),
      cvUrl: formData.get('cvUrl'),
      tiktok: formData.get('tiktok'),
      facebook: formData.get('facebook'),
      instagram: formData.get('instagram'),
      threads: formData.get('threads'),
      vehicle: formData.get('vehicle'),
    })

    if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message }
    const data = parsed.data

    let loginId = data.loginId
    if (loginId && !loginId.includes('@')) {
      loginId = `${loginId}@e5chronicles.com`
    }

    let designation = data.designation
    if (designation === 'ADD_NEW' && data.newDesignation) {
      designation = data.newDesignation
      await supabaseAdmin.from('designations').insert({ name: designation }).select()
    }

    const socialUrls = {
      tiktok: data.tiktok || '',
      facebook: data.facebook || '',
      instagram: data.instagram || '',
      threads: data.threads || '',
      vehicle: data.vehicle || 'no',
    }

    // Use the admin API to create the user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: loginId,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
      }
    })

    if (authError) {
      return { error: authError.message }
    }

    if (authData.user) {
      // Retry up to 3 times with backoff to handle trigger timing
      const updateData: Record<string, any> = {
        email: loginId,
        contact_email: data.contactEmail || null,
        designation,
        phone_number: data.phone || null,
        location: data.location || null,
        joining_date: data.joiningDate || null,
        dob: data.dob || null,
        cv_url: data.cvUrl || null,
        social_urls: socialUrls,
      }

      let profileError: any = null
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await supabaseAdmin
          .from('profiles')
          .update(updateData)
          .eq('id', authData.user.id)

        if (!result.error) {
          profileError = null
          break
        }
        profileError = result.error
        // Exponential backoff: 200ms, 400ms, 800ms
        await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, attempt)))
      }

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = UuidParamSchema.safeParse({ id: employeeId });
    if (!parsed.success) return { error: 'Invalid employee ID' };

    // First, nullify all non-completed task assignments for this employee
    const { error: taskError } = await supabaseAdmin
      .from('tasks')
      .update({ assigned_to: null })
      .eq('assigned_to', parsed.data.id)
      .neq('status', 'completed')

    if (taskError) {
      console.error("Failed to nullify tasks:", taskError)
      // Continue with archive even if task nullification fails
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', parsed.data.id)

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = UuidParamSchema.safeParse({ id: employeeId });
    if (!parsed.success) return { error: 'Invalid employee ID' };

    const { error } = await supabaseAdmin.auth.admin.deleteUser(parsed.data.id)
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = UuidParamSchema.safeParse({ id: employeeId });
    if (!parsed.success) return { error: 'Invalid employee ID' };

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ deleted_at: null })
      .eq('id', parsed.data.id)

    if (error) {
      return {
        error: error.message
      }
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = UpdateEmployeeSchema.safeParse(data)
    if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message }
    const validData = parsed.data

    let formattedLoginId = validData.login_id
    if (formattedLoginId && !formattedLoginId.includes('@')) {
      formattedLoginId = `${formattedLoginId}@e5chronicles.com`
    }

    // If this designation doesn't exist yet in the lookup table, insert it
    await supabaseAdmin
      .from('designations')
      .upsert({ name: validData.designation }, { onConflict: 'name' })

    // Update the profile in the profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: validData.full_name,
        email: formattedLoginId,
        contact_email: validData.contact_email || null,
        designation: validData.designation,
        phone_number: validData.phone_number || null,
        location: validData.location || null,
        joining_date: validData.joining_date || null,
        dob: validData.dob || null,
        cv_url: validData.cv_url || null,
        social_urls: validData.social_urls,
      })
      .eq('id', employeeId)

    if (profileError) {
      return { error: profileError.message }
    }

    // Update auth user - email, password, metadata
    const authUpdate: Record<string, any> = {
      email: formattedLoginId,
      user_metadata: { full_name: validData.full_name },
    }

    // Only update password if a new one was provided
    if (validData.password) {
      authUpdate.password = validData.password
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
