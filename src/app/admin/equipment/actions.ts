'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addEquipmentCategory(name: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('equipment_categories').insert({ name })
  if (error) return { error: error.message }
  return { success: true }
}

export async function createEquipment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }



  const name = formData.get('name') as string
  const brand = formData.get('brand') as string
  const model = formData.get('model') as string
  const serial_number = formData.get('serial_number') as string
  const category = formData.get('category') as string
  const purchase_date = formData.get('purchase_date') as string
  const purchase_price = formData.get('purchase_price') ? Number(formData.get('purchase_price')) : null
  const current_value = formData.get('current_value') ? Number(formData.get('current_value')) : null
  const location = formData.get('location') as string
  const notes = formData.get('notes') as string
  const vendor_name = formData.get('vendor_name') as string
  const vendor_phone = formData.get('vendor_phone') as string
  const vendor_location = formData.get('vendor_location') as string
  const file = formData.get('photo') as File | null

  let image_url = null
  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random()}.${fileExt}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('equipment-photos')
      .upload(fileName, file)
    if (uploadError) return { error: 'Failed to upload photo: ' + uploadError.message }
    image_url = uploadData.path
  }

  const { error } = await supabase.from('equipment').insert({
    name, brand: brand || null, model: model || null, serial_number: serial_number || null,
    category, purchase_date: purchase_date || null, purchase_price, current_value,
    location: location || null, notes: notes || null,
    vendor_name: vendor_name || null, vendor_phone: vendor_phone || null, vendor_location: vendor_location || null,
    image_url,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function updateEquipment(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }



  const name = formData.get('name') as string
  const brand = formData.get('brand') as string
  const model = formData.get('model') as string
  const serial_number = formData.get('serial_number') as string
  const category = formData.get('category') as string
  const purchase_date = formData.get('purchase_date') as string
  const purchase_price = formData.get('purchase_price') ? Number(formData.get('purchase_price')) : null
  const current_value = formData.get('current_value') ? Number(formData.get('current_value')) : null
  const location = formData.get('location') as string
  const notes = formData.get('notes') as string
  const vendor_name = formData.get('vendor_name') as string
  const vendor_phone = formData.get('vendor_phone') as string
  const vendor_location = formData.get('vendor_location') as string
  const file = formData.get('photo') as File | null

  const updates: any = {
    name, brand: brand || null, model: model || null, serial_number: serial_number || null,
    category, purchase_date: purchase_date || null, purchase_price, current_value,
    location: location || null, notes: notes || null,
    vendor_name: vendor_name || null, vendor_phone: vendor_phone || null, vendor_location: vendor_location || null,
    updated_at: new Date().toISOString(),
  }

  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random()}.${fileExt}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('equipment-photos')
      .upload(fileName, file)
    if (uploadError) return { error: 'Failed to upload photo: ' + uploadError.message }
    updates.image_url = uploadData.path
  }

  const { error } = await supabase.from('equipment').update(updates).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/equipment')
  revalidatePath(`/admin/equipment/${id}`)
  return { success: true }
}

export async function deleteEquipment(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }


  const { error } = await supabase.from('equipment').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function restoreEquipment(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }


  const { error } = await supabase.from('equipment').update({ status: 'available', deleted_at: null }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/equipment')
  revalidatePath(`/admin/equipment/${id}`)
  return { success: true }
}

export async function archiveEquipment(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }


  const { error } = await supabase.from('equipment').update({ status: 'retired', deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/equipment')
  revalidatePath(`/admin/equipment/${id}`)
  return { success: true }
}

export async function checkOutEquipment(data: { equipment_id: string, checked_out_by: string, expected_return_at?: string, project_id?: string, condition_at_checkout?: string, notes?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }


  const { error } = await supabase.rpc('checkout_equipment', {
    p_equipment_id: data.equipment_id,
    p_checked_out_by: data.checked_out_by,
    p_expected_return_at: data.expected_return_at || null,
    p_project_id: data.project_id || null,
    p_condition: data.condition_at_checkout || null,
    p_notes: data.notes || null
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/equipment')
  revalidatePath(`/admin/equipment/${data.equipment_id}`)
  return { success: true }
}

export async function checkInEquipment(data: { checkout_id: string, condition_at_checkin?: string, notes?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }


  const { data: checkout } = await supabase.from('equipment_checkouts').select('*').eq('id', data.checkout_id).single()
  if (!checkout) return { error: 'Checkout record not found' }

  await supabase.from('equipment_checkouts').update({
    checked_in_at: new Date().toISOString(), condition_at_checkin: data.condition_at_checkin || null, notes: data.notes || null,
  }).eq('id', data.checkout_id)

  await supabase.from('equipment').update({ status: 'available' }).eq('id', checkout.equipment_id)

  revalidatePath('/admin/equipment')
  revalidatePath(`/admin/equipment/${checkout.equipment_id}`)
  return { success: true }
}

export async function scheduleMaintenance(data: {
  equipment_id: string, description: string, scheduled_date: string,
  vendor?: string, vendor_phone?: string, vendor_location?: string, cost?: number, notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }


  const { error: insertError } = await supabase.from('equipment_maintenance').insert({
    equipment_id: data.equipment_id, description: data.description, scheduled_date: data.scheduled_date,
    vendor: data.vendor || null, vendor_phone: data.vendor_phone || null, vendor_location: data.vendor_location || null,
    cost: data.cost || null, notes: data.notes || null, status: 'scheduled',
  })

  if (insertError) return { error: insertError.message }

  const today = new Date().toISOString().split('T')[0]
  if (data.scheduled_date <= today) {
    await supabase.from('equipment').update({ status: 'maintenance' }).eq('id', data.equipment_id)
  }

  revalidatePath('/admin/equipment')
  revalidatePath(`/admin/equipment/${data.equipment_id}`)
  return { success: true }
}

export async function updateMaintenanceStatus(maintenanceId: string, status: 'scheduled' | 'in_progress' | 'completed', completed_date?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }


  const { data: maintenance } = await supabase.from('equipment_maintenance').select('equipment_id').eq('id', maintenanceId).single()
  if (!maintenance) return { error: 'Not found' }

  await supabase.from('equipment_maintenance').update({
    status, completed_date: status === 'completed' ? (completed_date || new Date().toISOString().split('T')[0]) : null,
  }).eq('id', maintenanceId)

  if (status === 'completed') {
    await supabase.from('equipment').update({ status: 'available' }).eq('id', maintenance.equipment_id)
  } else if (status === 'in_progress') {
    await supabase.from('equipment').update({ status: 'maintenance' }).eq('id', maintenance.equipment_id)
  }

  revalidatePath('/admin/equipment')
  revalidatePath(`/admin/equipment/${maintenance.equipment_id}`)
  return { success: true }
}
