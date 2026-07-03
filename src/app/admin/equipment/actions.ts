'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { EquipmentSchema, MaintenanceSchema, UuidParamSchema, EquipmentCheckInSchema, MaintenanceStatusSchema } from '@/lib/validations'
import { verifyAdminOrFounder } from '@/lib/auth-utils'
import { validateFileUpload, generateStorageFilename, ALLOWED_IMAGE_TYPES } from '@/lib/supabase/storage'
import { createNotification } from '@/lib/notifications'

export async function addEquipmentCategory(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
  if (!isAuthorized) return { error: 'Permission denied.' }

  if (!name || name.trim().length === 0) return { error: 'Category name is required' }

  const { error } = await supabase.from('equipment_categories').insert({ name: name.trim() })
  if (error) return { error: error.message }
  return { success: true }
}

export async function createEquipment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
  if (!isAuthorized) return { error: 'Permission denied.' }

  const parsed = EquipmentSchema.safeParse({
    name: formData.get('name'),
    brand: formData.get('brand'),
    model: formData.get('model'),
    serial_number: formData.get('serial_number'),
    category: formData.get('category'),
    purchase_date: formData.get('purchase_date'),
    purchase_price: formData.get('purchase_price') ? Number(formData.get('purchase_price')) : null,
    current_value: formData.get('current_value') ? Number(formData.get('current_value')) : null,
    location: formData.get('location'),
    notes: formData.get('notes'),
    vendor_name: formData.get('vendor_name'),
    vendor_phone: formData.get('vendor_phone'),
    vendor_location: formData.get('vendor_location'),
  })

  if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message }
  const data = parsed.data

  const file = formData.get('photo') as File | null
  let image_url = null
  if (file && file.size > 0) {
    // Validate file type and size
    const validationError = validateFileUpload(file, ALLOWED_IMAGE_TYPES)
    if (validationError) return { error: validationError }
    const fileName = generateStorageFilename(file.name)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('equipment-photos')
      .upload(fileName, file)
    if (uploadError) return { error: 'Failed to upload photo: ' + uploadError.message }
    image_url = uploadData.path
  }

  const { error } = await supabase.from('equipment').insert({
    name: data.name, brand: data.brand || null, model: data.model || null, serial_number: data.serial_number || null,
    category: data.category, purchase_date: data.purchase_date || null, purchase_price: data.purchase_price, current_value: data.current_value,
    location: data.location || null, notes: data.notes || null,
    vendor_name: data.vendor_name || null, vendor_phone: data.vendor_phone || null, vendor_location: data.vendor_location || null,
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
  const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
  if (!isAuthorized) return { error: 'Permission denied.' }

  const parsed = EquipmentSchema.safeParse({
    name: formData.get('name'),
    brand: formData.get('brand'),
    model: formData.get('model'),
    serial_number: formData.get('serial_number'),
    category: formData.get('category'),
    purchase_date: formData.get('purchase_date'),
    purchase_price: formData.get('purchase_price') ? Number(formData.get('purchase_price')) : null,
    current_value: formData.get('current_value') ? Number(formData.get('current_value')) : null,
    location: formData.get('location'),
    notes: formData.get('notes'),
    vendor_name: formData.get('vendor_name'),
    vendor_phone: formData.get('vendor_phone'),
    vendor_location: formData.get('vendor_location'),
  })

  if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message }
  const data = parsed.data

  const updates: any = {
    name: data.name, brand: data.brand || null, model: data.model || null, serial_number: data.serial_number || null,
    category: data.category, purchase_date: data.purchase_date || null, purchase_price: data.purchase_price, current_value: data.current_value,
    location: data.location || null, notes: data.notes || null,
    vendor_name: data.vendor_name || null, vendor_phone: data.vendor_phone || null, vendor_location: data.vendor_location || null,
    updated_at: new Date().toISOString(),
  }

  const file = formData.get('photo') as File | null
  if (file && file.size > 0) {
    // Validate file type and size
    const validationError = validateFileUpload(file, ALLOWED_IMAGE_TYPES)
    if (validationError) return { error: validationError }
    const fileName = generateStorageFilename(file.name)
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
  const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
  if (!isAuthorized) return { error: 'Permission denied.' }

  const parsed = UuidParamSchema.safeParse({ id });
  if (!parsed.success) return { error: 'Invalid equipment ID' };

  const { error } = await supabase.from('equipment').delete().eq('id', parsed.data.id)
  if (error) return { error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function restoreEquipment(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
  if (!isAuthorized) return { error: 'Permission denied.' }

  const parsed = UuidParamSchema.safeParse({ id });
  if (!parsed.success) return { error: 'Invalid equipment ID' };

  const { error } = await supabase.from('equipment').update({ status: 'available', deleted_at: null }).eq('id', parsed.data.id)
  if (error) return { error: error.message }

  revalidatePath('/admin/equipment')
  revalidatePath(`/admin/equipment/${id}`)
  return { success: true }
}

export async function archiveEquipment(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
  if (!isAuthorized) return { error: 'Permission denied.' }

  const parsed = UuidParamSchema.safeParse({ id });
  if (!parsed.success) return { error: 'Invalid equipment ID' };

  const { error } = await supabase.from('equipment').update({ status: 'retired', deleted_at: new Date().toISOString() }).eq('id', parsed.data.id)
  if (error) return { error: error.message }

  revalidatePath('/admin/equipment')
  revalidatePath(`/admin/equipment/${id}`)
  return { success: true }
}

const EquipmentCheckoutDataSchema = z.object({
  equipment_id: z.string().uuid(),
  checked_out_by: z.string().uuid(),
  expected_return_at: z.string().optional(),
  project_id: z.string().uuid().optional(),
  condition_at_checkout: z.string().optional(),
  notes: z.string().optional(),
});

export async function checkOutEquipment(data: { equipment_id: string, checked_out_by: string, expected_return_at?: string, project_id?: string, condition_at_checkout?: string, notes?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
  if (!isAuthorized) return { error: 'Permission denied.' }

  const parsed = EquipmentCheckoutDataSchema.safeParse(data);
  if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message };

  const validated = parsed.data;

  const { error } = await supabase.rpc('checkout_equipment', {
    p_equipment_id: validated.equipment_id,
    p_checked_out_by: validated.checked_out_by,
    p_expected_return_at: validated.expected_return_at || null,
    p_project_id: validated.project_id || null,
    p_condition: validated.condition_at_checkout || null,
    p_notes: validated.notes || null
  })

  if (error) return { error: error.message }

  // Notify the person the equipment was checked out to.
  if (validated.checked_out_by && validated.checked_out_by !== user.id) {
    const { data: equipment } = await supabase
      .from('equipment')
      .select('name')
      .eq('id', validated.equipment_id)
      .single()

    const dueLabel = validated.expected_return_at
      ? ` Please return it by ${new Date(validated.expected_return_at).toLocaleDateString()}.`
      : ''
    await createNotification(
      validated.checked_out_by,
      'equipment_checked_out',
      `Equipment Checked Out: ${equipment?.name || 'Item'}`,
      `${equipment?.name || 'A piece of equipment'} has been checked out to you.${dueLabel}`,
      '/employee/equipment',
      true,
    )
  }

  revalidatePath('/admin/equipment')
  revalidatePath(`/admin/equipment/${data.equipment_id}`)
  return { success: true }
}

const EquipmentCheckInDataSchema = z.object({
  checkout_id: z.string().uuid(),
  condition_at_checkin: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function checkInEquipment(data: { checkout_id: string, condition_at_checkin?: string, notes?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
  if (!isAuthorized) return { error: 'Permission denied.' }

  const parsed = EquipmentCheckInDataSchema.safeParse(data);
  if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message };

  const validated = parsed.data;

  // Use RPC for atomic check-in (single DB operation)
  const { error } = await supabase.rpc('checkin_equipment', {
    p_checkout_id: validated.checkout_id,
    p_condition: validated.condition_at_checkin || null,
    p_notes: validated.notes || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function scheduleMaintenance(data: {
  equipment_id: string, description: string, scheduled_date: string,
  vendor?: string, vendor_phone?: string, vendor_location?: string, cost?: number, notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
  if (!isAuthorized) return { error: 'Permission denied.' }

  const parsed = MaintenanceSchema.safeParse(data)
  if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message }
  const mData = parsed.data

  const { error: insertError } = await supabase.from('equipment_maintenance').insert({
    equipment_id: mData.equipment_id, description: mData.description, scheduled_date: mData.scheduled_date,
    vendor: mData.vendor || null, vendor_phone: mData.vendor_phone || null, vendor_location: mData.vendor_location || null,
    cost: mData.cost || null, notes: mData.notes || null, status: 'scheduled',
  })

  if (insertError) return { error: insertError.message }

  const today = new Date().toISOString().split('T')[0]
  if (mData.scheduled_date <= today) {
    await supabase.from('equipment').update({ status: 'maintenance' }).eq('id', mData.equipment_id)
  }

  revalidatePath('/admin/equipment')
  revalidatePath(`/admin/equipment/${mData.equipment_id}`)
  return { success: true }
}

export async function lookupByAssetId(assetId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
  if (!isAuthorized) return { error: 'Permission denied.' }

  // Validate and sanitize input
  if (!assetId || assetId.trim().length === 0) return { error: 'Asset ID is required' }
  const sanitized = assetId.trim().slice(0, 256)

  // Match on either column using fully parameterized .eq() queries — never build
  // PostgREST filter strings by concatenation (that allows filter injection).
  const columns = 'id, name, status, image_url, category'
  const { data: bySerial } = await supabase
    .from('equipment')
    .select(columns)
    .eq('serial_number', sanitized)
    .is('deleted_at', null)
    .maybeSingle()

  let data = bySerial
  if (!data) {
    const { data: byManualId } = await supabase
      .from('equipment')
      .select(columns)
      .eq('manual_asset_id', sanitized)
      .is('deleted_at', null)
      .maybeSingle()
    data = byManualId
  }

  if (!data) return { error: 'Equipment not found with that asset ID' }
  return { data }
}

export async function updateMaintenanceStatus(maintenanceId: string, status: 'scheduled' | 'in_progress' | 'completed', completed_date?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
  if (!isAuthorized) return { error: 'Permission denied.' }

  const parsed = UuidParamSchema.safeParse({ id: maintenanceId });
  if (!parsed.success) return { error: 'Invalid maintenance ID' };

  const { data: maintenance } = await supabase.from('equipment_maintenance').select('equipment_id').eq('id', parsed.data.id).single()
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
