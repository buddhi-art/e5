'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { TalentSchema, TalentBookingSchema, UuidParamSchema } from '@/lib/validations'
import { verifyAdminOrFounder } from '@/lib/auth-utils'
import { validateFileUpload, generateStorageFilename, ALLOWED_IMAGE_TYPES } from '@/lib/supabase/storage'

export async function addTalentType(name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    if (!name || name.trim().length === 0) return { error: 'Type name is required' }

    const { error } = await supabase.from('talent_types').insert({ name: name.trim() })
    if (error) return { error: error.message }
    return { success: true }
}

export async function createTalent(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = TalentSchema.safeParse({
        full_name: formData.get('full_name'),
        stage_name: formData.get('stage_name'),
        talent_type: formData.get('talent_type'),
        phone_number: formData.get('phone_number'),
        email: formData.get('email'),
        gender: formData.get('gender'),
        date_of_birth: formData.get('date_of_birth'),
        location: formData.get('location'),
        height_cm: formData.get('height_cm') ? Number(formData.get('height_cm')) : null,
        languages: formData.get('languages') ? (formData.get('languages') as string).split(',').map(s => s.trim()).filter(Boolean) : [],
        skills: formData.get('skills') ? (formData.get('skills') as string).split(',').map(s => s.trim()).filter(Boolean) : [],
        rate_type: (formData.get('rate_type') as string) || 'per_project',
        rate_amount: formData.get('rate_amount') ? Number(formData.get('rate_amount')) : null,
        notes: formData.get('notes'),
    })

    if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message }
    const data = parsed.data

    let photo_url = null
    const photo = formData.get('photo') as File | null
    if (photo && photo.size > 0) {
        const validationError = validateFileUpload(photo, ALLOWED_IMAGE_TYPES)
        if (validationError) return { error: validationError }
        const fileName = generateStorageFilename(photo.name)
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('talent-photos')
            .upload(fileName, photo)
        if (uploadError) return { error: 'Failed to upload photo: ' + uploadError.message }
        photo_url = uploadData.path
    }

    const { error } = await supabase.from('talents').insert({
        full_name: data.full_name,
        stage_name: data.stage_name || null,
        talent_type: data.talent_type,
        phone_number: data.phone_number || null,
        email: data.email || null,
        gender: data.gender || null,
        date_of_birth: data.date_of_birth || null,
        location: data.location || null,
        height_cm: data.height_cm,
        languages: data.languages,
        skills: data.skills,
        rate_type: data.rate_type,
        rate_amount: data.rate_amount,
        notes: data.notes || null,
        photo_url,
    })

    if (error) return { error: error.message }
    revalidatePath('/admin/talents')
    return { success: true }
}

export async function updateTalent(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = TalentSchema.safeParse({
        full_name: formData.get('full_name'),
        stage_name: formData.get('stage_name'),
        talent_type: formData.get('talent_type'),
        phone_number: formData.get('phone_number'),
        email: formData.get('email'),
        gender: formData.get('gender'),
        date_of_birth: formData.get('date_of_birth'),
        location: formData.get('location'),
        height_cm: formData.get('height_cm') ? Number(formData.get('height_cm')) : null,
        languages: formData.get('languages') ? (formData.get('languages') as string).split(',').map(s => s.trim()).filter(Boolean) : [],
        skills: formData.get('skills') ? (formData.get('skills') as string).split(',').map(s => s.trim()).filter(Boolean) : [],
        rate_type: (formData.get('rate_type') as string) || 'per_project',
        rate_amount: formData.get('rate_amount') ? Number(formData.get('rate_amount')) : null,
        notes: formData.get('notes'),
    })

    if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message }
    const data = parsed.data

    const updates: Record<string, any> = {
        full_name: data.full_name,
        stage_name: data.stage_name || null,
        talent_type: data.talent_type,
        phone_number: data.phone_number || null,
        email: data.email || null,
        gender: data.gender || null,
        date_of_birth: data.date_of_birth || null,
        location: data.location || null,
        height_cm: data.height_cm,
        languages: data.languages,
        skills: data.skills,
        rate_type: data.rate_type,
        rate_amount: data.rate_amount,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
    }

    const photo = formData.get('photo') as File | null
    if (photo && photo.size > 0) {
        const validationError = validateFileUpload(photo, ALLOWED_IMAGE_TYPES)
        if (validationError) return { error: validationError }
        const fileName = generateStorageFilename(photo.name)
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('talent-photos')
            .upload(fileName, photo)
        if (uploadError) return { error: 'Failed to upload photo: ' + uploadError.message }
        updates.photo_url = uploadData.path
    }

    const { error } = await supabase.from('talents').update(updates).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/talents')
    revalidatePath(`/admin/talents/${id}`)
    return { success: true }
}

export async function deleteTalent(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = UuidParamSchema.safeParse({ id });
    if (!parsed.success) return { error: 'Invalid talent ID' };

    const { error } = await supabase.from('talents').delete().eq('id', parsed.data.id)
    if (error) return { error: error.message }

    revalidatePath('/admin/talents')
    return { success: true }
}

export async function restoreTalent(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = UuidParamSchema.safeParse({ id });
    if (!parsed.success) return { error: 'Invalid talent ID' };

    const { error } = await supabase.from('talents').update({ is_active: true, deleted_at: null }).eq('id', parsed.data.id)
    if (error) return { error: error.message }

    revalidatePath('/admin/talents')
    revalidatePath(`/admin/talents/${id}`)
    return { success: true }
}

export async function archiveTalent(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = UuidParamSchema.safeParse({ id });
    if (!parsed.success) return { error: 'Invalid talent ID' };

    const { error } = await supabase.from('talents').update({ is_active: false, deleted_at: new Date().toISOString() }).eq('id', parsed.data.id)
    if (error) return { error: error.message }

    revalidatePath('/admin/talents')
    revalidatePath(`/admin/talents/${id}`)
    return { success: true }
}

export async function createBooking(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = TalentBookingSchema.safeParse({
        talent_id: formData.get('talent_id'),
        project_id: formData.get('project_id'),
        booking_date: formData.get('booking_date'),
        end_date: formData.get('end_date'),
        rate_type: formData.get('rate_type'),
        rate_amount: Number(formData.get('rate_amount')) || 0,
        description: formData.get('description'),
        location: formData.get('location'),
        notes: formData.get('notes'),
    })

    if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message }
    const validated = parsed.data

    // NOTE: This availability check + insert is NOT atomic. Two concurrent bookings
    // can both pass this check before either inserts, causing a double-booking.
    // The reliable fix is a DB-level guard — add to talent_bookings one of:
    //   (a) an exclusion constraint over (talent_id, daterange(booking_date, end_date))
    //       using btree_gist:  EXCLUDE USING gist (talent_id WITH =, daterange(...) WITH &&)
    //   (b) a SECURITY DEFINER function that SELECT ... FOR UPDATE locks the talent row.
    // Until then this check is best-effort only.
    const { data: existing } = await supabase
        .from('talent_bookings')
        .select('id')
        .eq('talent_id', validated.talent_id)
        .in('status', ['proposed', 'confirmed'])
        .lte('booking_date', validated.end_date || validated.booking_date)
        .gte('end_date', validated.booking_date)

    if (existing && existing.length > 0) {
        return { error: 'Talent is already booked for these dates' }
    }

    // Calculate total compensation
    let total_compensation = validated.rate_amount
    if (validated.rate_type === 'per_day' && validated.end_date) {
        const start = new Date(validated.booking_date)
        const end = new Date(validated.end_date)
        const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
        total_compensation = validated.rate_amount * days
    }

    const { error } = await supabase.from('talent_bookings').insert({
        talent_id: validated.talent_id,
        project_id: validated.project_id || null,
        booking_date: validated.booking_date,
        end_date: validated.end_date || null,
        rate_type: validated.rate_type,
        rate_amount: validated.rate_amount,
        total_compensation,
        description: validated.description || null,
        location: validated.location || null,
        notes: validated.notes || null,
        booked_by: user.id,
    })

    if (error) return { error: error.message }
    revalidatePath('/admin/talents')
    revalidatePath('/admin/talents/bookings')
    return { success: true }
}

export async function updateBookingStatus(bookingId: string, status: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = UuidParamSchema.safeParse({ id: bookingId });
    if (!parsed.success) return { error: 'Invalid booking ID' };

    const { error } = await supabase.from('talent_bookings').update({ status }).eq('id', parsed.data.id)
    if (error) return { error: error.message }

    revalidatePath('/admin/talents')
    revalidatePath('/admin/talents/bookings')
    return { success: true }
}
