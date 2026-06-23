'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addTalentType(name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const { error } = await supabase.from('talent_types').insert({ name })
    if (error) return { error: error.message }
    return { success: true }
}

export async function createTalent(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const full_name = formData.get('full_name') as string
    const stage_name = formData.get('stage_name') as string
    const talent_type = formData.get('talent_type') as string
    const phone_number = formData.get('phone_number') as string
    const email = formData.get('email') as string
    const gender = formData.get('gender') as string
    const date_of_birth = formData.get('date_of_birth') as string
    const location = formData.get('location') as string
    const height_cm = formData.get('height_cm') ? Number(formData.get('height_cm')) : null
    const languages = formData.get('languages') ? (formData.get('languages') as string).split(',').map(s => s.trim()).filter(Boolean) : []
    const skills = formData.get('skills') ? (formData.get('skills') as string).split(',').map(s => s.trim()).filter(Boolean) : []
    const rate_type = formData.get('rate_type') as string || 'per_project'
    const rate_amount = formData.get('rate_amount') ? Number(formData.get('rate_amount')) : null
    const notes = formData.get('notes') as string

    let photo_url = null
    const photo = formData.get('photo') as File | null
    if (photo && photo.size > 0) {
        const fileName = `${Date.now()}_${Math.random()}.${photo.name.split('.').pop()}`
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('talent-photos')
            .upload(fileName, photo)
        if (uploadError) return { error: 'Failed to upload photo: ' + uploadError.message }
        photo_url = uploadData.path
    }

    const { error } = await supabase.from('talents').insert({
        full_name,
        stage_name: stage_name || null,
        talent_type,
        phone_number: phone_number || null,
        email: email || null,
        gender: gender || null,
        date_of_birth: date_of_birth || null,
        location: location || null,
        height_cm,
        languages,
        skills,
        rate_type,
        rate_amount,
        notes: notes || null,
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
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const full_name = formData.get('full_name') as string
    const stage_name = formData.get('stage_name') as string
    const talent_type = formData.get('talent_type') as string
    const phone_number = formData.get('phone_number') as string
    const email = formData.get('email') as string
    const gender = formData.get('gender') as string
    const date_of_birth = formData.get('date_of_birth') as string
    const location = formData.get('location') as string
    const height_cm = formData.get('height_cm') ? Number(formData.get('height_cm')) : null
    const languages = formData.get('languages') ? (formData.get('languages') as string).split(',').map(s => s.trim()).filter(Boolean) : []
    const skills = formData.get('skills') ? (formData.get('skills') as string).split(',').map(s => s.trim()).filter(Boolean) : []
    const rate_type = formData.get('rate_type') as string || 'per_project'
    const rate_amount = formData.get('rate_amount') ? Number(formData.get('rate_amount')) : null
    const notes = formData.get('notes') as string

    const updates: Record<string, any> = {
        full_name,
        stage_name: stage_name || null,
        talent_type,
        phone_number: phone_number || null,
        email: email || null,
        gender: gender || null,
        date_of_birth: date_of_birth || null,
        location: location || null,
        height_cm,
        languages,
        skills,
        rate_type,
        rate_amount,
        notes: notes || null,
        updated_at: new Date().toISOString(),
    }

    const photo = formData.get('photo') as File | null
    if (photo && photo.size > 0) {
        const fileName = `${Date.now()}_${Math.random()}.${photo.name.split('.').pop()}`
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
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const { error } = await supabase.from('talents').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/talents')
    return { success: true }
}

export async function restoreTalent(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const { error } = await supabase.from('talents').update({ is_active: true, deleted_at: null }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/talents')
    revalidatePath(`/admin/talents/${id}`)
    return { success: true }
}

export async function archiveTalent(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const { error } = await supabase.from('talents').update({ is_active: false, deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/talents')
    revalidatePath(`/admin/talents/${id}`)
    return { success: true }
}

export async function createBooking(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const talent_id = formData.get('talent_id') as string
    const project_id = formData.get('project_id') as string
    const booking_date = formData.get('booking_date') as string
    const end_date = formData.get('end_date') as string
    const rate_type = formData.get('rate_type') as string
    const rate_amount = Number(formData.get('rate_amount')) || 0
    const description = formData.get('description') as string
    const location = formData.get('location') as string
    const notes = formData.get('notes') as string

    if (!talent_id || !booking_date || !rate_type || !rate_amount) {
        return { error: 'Talent, booking date, rate type, and rate amount are required' }
    }

    // Check availability
    const { data: existing } = await supabase
        .from('talent_bookings')
        .select('id')
        .eq('talent_id', talent_id)
        .in('status', ['proposed', 'confirmed'])
        .lte('booking_date', end_date || booking_date)
        .gte('end_date', booking_date)

    if (existing && existing.length > 0) {
        return { error: 'Talent is already booked for these dates' }
    }

    // Calculate total compensation
    let total_compensation = rate_amount
    if (rate_type === 'per_day' && end_date) {
        const start = new Date(booking_date)
        const end = new Date(end_date)
        const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
        total_compensation = rate_amount * days
    }

    const { error } = await supabase.from('talent_bookings').insert({
        talent_id,
        project_id: project_id || null,
        booking_date,
        end_date: end_date || null,
        rate_type,
        rate_amount,
        total_compensation,
        description: description || null,
        location: location || null,
        notes: notes || null,
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
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const { error } = await supabase.from('talent_bookings').update({ status }).eq('id', bookingId)
    if (error) return { error: error.message }

    revalidatePath('/admin/talents')
    revalidatePath('/admin/talents/bookings')
    return { success: true }
}
