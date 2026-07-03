'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ClientRecordSchema, ClientMeetingSchema, UuidParamSchema } from '@/lib/validations'
import { verifyAdminOrFounder } from '@/lib/auth-utils'

export async function createClientRecord(formData: FormData) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id);
    if (!isAuthorized) return { error: 'Permission denied.' };

    const parsed = ClientRecordSchema.safeParse({
      companyName: formData.get('companyName'),
      natureOfCompany: formData.get('natureOfCompany'),
      newNatureOfCompany: formData.get('newNatureOfCompany'),
      referralSource: formData.get('referralSource'),
      newReferralSource: formData.get('newReferralSource'),
      owner: formData.get('owner'),
      contactEmail: formData.get('contactEmail'),
      phone: formData.get('phone'),
      logoUrl: formData.get('logoUrl'),
      location: formData.get('location'),
      status: formData.get('status'),
      panNumber: formData.get('panNumber'),
      vatId: formData.get('vatId'),
      tiktok: formData.get('tiktok'),
      facebook: formData.get('facebook'),
      instagram: formData.get('instagram'),
      threads: formData.get('threads'),
    });

    if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message };
    const data = parsed.data;

    let nature_of_company = data.natureOfCompany;
    if (nature_of_company === 'ADD_NEW' && data.newNatureOfCompany) {
      nature_of_company = data.newNatureOfCompany;
      await supabase.from('company_natures').insert({ name: nature_of_company })
    }

    let referral_source = data.referralSource;
    if (referral_source === 'ADD_NEW' && data.newReferralSource) {
      referral_source = data.newReferralSource;
      await supabase.from('referral_sources').insert({ name: referral_source })
    }

    const social_urls = {
      tiktok: data.tiktok || '',
      facebook: data.facebook || '',
      instagram: data.instagram || '',
      threads: data.threads || '',
    }

    const { error } = await supabase
      .from('clients')
      .insert({
        company_name: data.companyName,
        nature_of_company,
        contact_person: data.owner || null,
        contact_email: data.contactEmail || null,
        phone_number: data.phone || null,
        logo_url: data.logoUrl || null,
        location: data.location || null,
        status: data.status || null,
        referral_source,
        social_urls,
        pan_number: data.panNumber || null,
        vat_id: data.vatId || null,
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id);
    if (!isAuthorized) return { error: 'Permission denied.' };

    const parsed = ClientRecordSchema.safeParse({
      companyName: formData.get('companyName'),
      natureOfCompany: formData.get('natureOfCompany'),
      newNatureOfCompany: formData.get('newNatureOfCompany'),
      referralSource: formData.get('referralSource'),
      newReferralSource: formData.get('newReferralSource'),
      owner: formData.get('owner'),
      contactEmail: formData.get('contactEmail'),
      phone: formData.get('phone'),
      logoUrl: formData.get('logoUrl'),
      location: formData.get('location'),
      status: formData.get('status'),
      panNumber: formData.get('panNumber'),
      vatId: formData.get('vatId'),
      tiktok: formData.get('tiktok'),
      facebook: formData.get('facebook'),
      instagram: formData.get('instagram'),
      threads: formData.get('threads'),
    });

    if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message };
    const data = parsed.data;

    let nature_of_company = data.natureOfCompany;
    if (nature_of_company === 'ADD_NEW' && data.newNatureOfCompany) {
      nature_of_company = data.newNatureOfCompany;
      await supabase.from('company_natures').insert({ name: nature_of_company })
    }

    let referral_source = data.referralSource;
    if (referral_source === 'ADD_NEW' && data.newReferralSource) {
      referral_source = data.newReferralSource;
      await supabase.from('referral_sources').insert({ name: referral_source })
    }

    const social_urls = {
      tiktok: data.tiktok || '',
      facebook: data.facebook || '',
      instagram: data.instagram || '',
      threads: data.threads || '',
    }

    const { error } = await supabase
      .from('clients')
      .update({
        company_name: data.companyName,
        nature_of_company,
        contact_person: data.owner || null,
        contact_email: data.contactEmail || null,
        phone_number: data.phone || null,
        logo_url: data.logoUrl || null,
        location: data.location || null,
        status: data.status || null,
        referral_source,
        social_urls,
        pan_number: data.panNumber || null,
        vat_id: data.vatId || null,
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id);
    if (!isAuthorized) return { error: 'Permission denied.' };

    const parsed = UuidParamSchema.safeParse({ id: clientId });
    if (!parsed.success) return { error: 'Invalid client ID' };

    // Soft-delete the client (archives it)
    const { error } = await supabase
      .from('clients')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', parsed.data.id)

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
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id);
    if (!isAuthorized) return { error: 'Permission denied.' };

    const parsed = ClientMeetingSchema.safeParse({
      client_id: formData.get('client_id'),
      title: formData.get('title'),
      meeting_date: formData.get('meeting_date'),
      duration_minutes: formData.get('duration_minutes') ? parseInt(formData.get('duration_minutes') as string) : null,
      location: formData.get('location'),
      notes: formData.get('notes'),
    });

    if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message };
    const data = parsed.data;

    const { error } = await supabase.from('client_meetings').insert({
      client_id: data.client_id,
      title: data.title,
      meeting_date: data.meeting_date,
      duration_minutes: data.duration_minutes,
      location: data.location || null,
      notes: data.notes || null,
      created_by: user.id,
    })
    if (error) return { error: error.message }

    revalidatePath('/admin/clients')
    revalidatePath(`/admin/clients/${data.client_id}`)
    revalidatePath('/admin/calendar')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteClient(clientId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id);
    if (!isAuthorized) return { error: 'Permission denied.' };

    const parsed = UuidParamSchema.safeParse({ id: clientId });
    if (!parsed.success) return { error: 'Invalid client ID' };

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', parsed.data.id)

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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id);
    if (!isAuthorized) return { error: 'Permission denied.' };

    const parsed = UuidParamSchema.safeParse({ id: clientId });
    if (!parsed.success) return { error: 'Invalid client ID' };

    const { error } = await supabase
      .from('clients')
      .update({ deleted_at: null })
      .eq('id', parsed.data.id)

    if (error) return { error: error.message }

    revalidatePath('/admin/clients')
    revalidatePath('/admin/projects')
    return { success: true }
  } catch (err: any) {
    console.error('Error in restoreClient:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}
