'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createClientRecord(formData: FormData) {
  try {
    const supabase = await createClient()

    const company_name = formData.get('companyName') as string
    let nature_of_company = formData.get('natureOfCompany') as string
    if (nature_of_company === 'ADD_NEW') {
      nature_of_company = formData.get('newNatureOfCompany') as string
      if (nature_of_company) {
        // Ignore errors if it already exists due to unique constraint
        await supabase.from('company_natures').insert({ name: nature_of_company })
      }
    }

    let referral_source = formData.get('referralSource') as string
    if (referral_source === 'ADD_NEW') {
      referral_source = formData.get('newReferralSource') as string
      if (referral_source) {
        await supabase.from('referral_sources').insert({ name: referral_source })
      }
    }

    const contact_person = formData.get('owner') as string
    const contact_email = formData.get('contactEmail') as string
    const phone_number = formData.get('phone') as string
    const logo_url = formData.get('logoUrl') as string
    const location = formData.get('location') as string
    const status = formData.get('status') as string

    // Social Links
    const social_urls = {
      tiktok: formData.get('tiktok') as string || '',
      facebook: formData.get('facebook') as string || '',
      instagram: formData.get('instagram') as string || '',
      threads: formData.get('threads') as string || '',
    }

    if (!company_name) {
      return { error: 'Company Name is required' }
    }

    const { error } = await supabase
      .from('clients')
      .insert({
        company_name,
        nature_of_company,
        contact_person,
        contact_email,
        phone_number,
        logo_url,
        location,
        status,
        referral_source,
        social_urls,
      })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/clients')
    return { success: true }
  } catch (err: any) {
    console.error('Error in createClientRecord:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function updateClientRecord(clientId: string, formData: FormData) {
  try {
    const supabase = await createClient()

    const company_name = formData.get('companyName') as string
    let nature_of_company = formData.get('natureOfCompany') as string
    if (nature_of_company === 'ADD_NEW') {
      nature_of_company = formData.get('newNatureOfCompany') as string
      if (nature_of_company) {
        await supabase.from('company_natures').insert({ name: nature_of_company })
      }
    }

    let referral_source = formData.get('referralSource') as string
    if (referral_source === 'ADD_NEW') {
      referral_source = formData.get('newReferralSource') as string
      if (referral_source) {
        await supabase.from('referral_sources').insert({ name: referral_source })
      }
    }

    const contact_person = formData.get('owner') as string
    const contact_email = formData.get('contactEmail') as string
    const phone_number = formData.get('phone') as string
    const logo_url = formData.get('logoUrl') as string
    const location = formData.get('location') as string
    const status = formData.get('status') as string

    const social_urls = {
      tiktok: formData.get('tiktok') as string || '',
      facebook: formData.get('facebook') as string || '',
      instagram: formData.get('instagram') as string || '',
      threads: formData.get('threads') as string || '',
    }

    if (!company_name) {
      return { error: 'Company Name is required' }
    }

    const { error } = await supabase
      .from('clients')
      .update({
        company_name,
        nature_of_company,
        contact_person,
        contact_email,
        phone_number,
        logo_url,
        location,
        status,
        referral_source,
        social_urls,
      })
      .eq('id', clientId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/clients')
    revalidatePath(`/admin/clients/${clientId}`)
    return { success: true }
  } catch (err: any) {
    console.error('Error in updateClientRecord:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function archiveClient(clientId: string) {
  try {
    const supabase = await createClient()

    // Soft-delete the client (archives it)
    const { error } = await supabase
      .from('clients')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', clientId)

    if (error) return { error: error.message }

    // Also archive all projects belonging to this client
    await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('client_id', clientId)
      .is('deleted_at', null)

    revalidatePath('/admin/clients')
    revalidatePath('/admin/projects')
    return { success: true }
  } catch (err: any) {
    console.error('Error in archiveClient:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function createClientMeeting(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const client_id = formData.get('client_id') as string
    const title = formData.get('title') as string
    const meeting_date = formData.get('meeting_date') as string
    const duration_minutes = formData.get('duration_minutes') ? parseInt(formData.get('duration_minutes') as string) : null
    const location = formData.get('location') as string
    const notes = formData.get('notes') as string

    if (!client_id || !title || !meeting_date) return { error: 'Client, title, and meeting date are required' }

    const { error } = await supabase.from('client_meetings').insert({
      client_id, title, meeting_date, duration_minutes, location: location || null, notes: notes || null, created_by: user.id,
    })
    if (error) return { error: error.message }

    revalidatePath('/admin/clients')
    revalidatePath(`/admin/clients/${client_id}`)
    revalidatePath('/admin/calendar')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteClient(clientId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)

    if (error) return { error: error.message }

    revalidatePath('/admin/clients')
    revalidatePath('/admin/projects')
    return { success: true }
  } catch (err: any) {
    console.error('Error in deleteClient:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function restoreClient(clientId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('clients')
      .update({ deleted_at: null })
      .eq('id', clientId)

    if (error) return { error: error.message }

    revalidatePath('/admin/clients')
    revalidatePath('/admin/projects')
    return { success: true }
  } catch (err: any) {
    console.error('Error in restoreClient:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}
