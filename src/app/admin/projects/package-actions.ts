'use server'

import { createClient } from '@/lib/supabase/server'
import { UuidParamSchema } from '@/lib/validations'
import { verifyAdminOrFounder } from '@/lib/auth-utils'

export type ProjectPackage = { id: string; name: string }

// List selectable packages. Readable by any authenticated user (the project
// forms need the options); RLS also enforces this at the database level.
export async function listPackages(): Promise<{ data: ProjectPackage[]; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('project_packages')
      .select('id, name')
      .order('name', { ascending: true })

    if (error) return { data: [], error: error.message }
    return { data: (data || []) as ProjectPackage[] }
  } catch (err: unknown) {
    console.error('Error in listPackages:', err)
    return { data: [], error: (err instanceof Error ? err.message : String(err)) || 'An unexpected error occurred' }
  }
}

export async function createPackage(name: string): Promise<{ data?: ProjectPackage; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const trimmed = (name || '').trim()
    if (!trimmed) return { error: 'Package name is required' }
    if (trimmed.length > 100) return { error: 'Package name is too long' }

    const { data, error } = await supabase
      .from('project_packages')
      .insert({ name: trimmed })
      .select('id, name')
      .single()

    if (error) {
      // Postgres unique_violation
      if (error.code === '23505') return { error: 'That package already exists' }
      return { error: error.message }
    }

    return { data: data as ProjectPackage }
  } catch (err: unknown) {
    console.error('Error in createPackage:', err)
    return { error: (err instanceof Error ? err.message : String(err)) || 'An unexpected error occurred' }
  }
}

export async function deletePackage(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = UuidParamSchema.safeParse({ id })
    if (!parsed.success) return { error: 'Invalid package ID' }

    const { error } = await supabase
      .from('project_packages')
      .delete()
      .eq('id', parsed.data.id)

    if (error) return { error: error.message }
    return { success: true }
  } catch (err: unknown) {
    console.error('Error in deletePackage:', err)
    return { error: (err instanceof Error ? err.message : String(err)) || 'An unexpected error occurred' }
  }
}
