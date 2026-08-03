'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CreateProjectSchema, ProjectBudgetSchema, ProjectStatusSchema, UuidParamSchema } from '@/lib/validations'
import { verifyAdminOrFounder } from '@/lib/auth-utils'
import { captureActionError } from '@/lib/action-error'

export async function createProject(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = CreateProjectSchema.safeParse({
      client_id: formData.get('client_id'),
      title: formData.get('title'),
      package: formData.get('package'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
    })

    if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message }
    const data = parsed.data

    const { error } = await supabase.from('projects').insert({
      client_id: data.client_id,
      title: data.title,
      status: 'not_started',
      package: data.package || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/projects')
    revalidatePath('/founder/projects')
    revalidatePath(`/admin/clients/${data.client_id}`)
    return { success: true }
  } catch (err: unknown) {
    return { error: await captureActionError('createProject', err) }
  }
}

export async function updateProject(projectId: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = CreateProjectSchema.safeParse({
      client_id: formData.get('client_id'),
      title: formData.get('title'),
      package: formData.get('package'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
    })

    if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message }
    const data = parsed.data

    const { error } = await supabase
      .from('projects')
      .update({
        title: data.title,
        client_id: data.client_id,
        package: data.package || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
      })
      .eq('id', projectId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/projects')
    revalidatePath('/founder/projects')
    return { success: true }
  } catch (err: unknown) {
    return { error: await captureActionError('updateProject', err) }
  }
}

export async function updateProjectAssets(projectId: string, data: { raw_footage_link?: string, brand_assets_link?: string, client_brief_notes?: string }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const { error } = await supabase
      .from('projects')
      .update({
        raw_footage_link: data.raw_footage_link || null,
        brand_assets_link: data.brand_assets_link || null,
        client_brief_notes: data.client_brief_notes || null,
      })
      .eq('id', projectId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath(`/admin/projects/${projectId}`)
    revalidatePath(`/founder/projects/${projectId}`)
    revalidatePath(`/employee/projects/${projectId}`)
    return { success: true }
  } catch (err: unknown) {
    return { error: await captureActionError('updateProjectAssets', err) }
  }
}

export async function archiveProject(projectId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = UuidParamSchema.safeParse({ id: projectId });
    if (!parsed.success) return { error: 'Invalid project ID' };

    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', parsed.data.id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/projects')
    revalidatePath('/founder/projects')
    return { success: true }
  } catch (err: unknown) {
    return { error: await captureActionError('archiveProject', err) }
  }
}

export async function deleteProject(projectId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = UuidParamSchema.safeParse({ id: projectId });
    if (!parsed.success) return { error: 'Invalid project ID' };

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', parsed.data.id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/projects')
    revalidatePath('/founder/projects')
    return { success: true }
  } catch (err: unknown) {
    return { error: await captureActionError('deleteProject', err) }
  }
}

export async function restoreProject(projectId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = UuidParamSchema.safeParse({ id: projectId });
    if (!parsed.success) return { error: 'Invalid project ID' };

    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: null })
      .eq('id', parsed.data.id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/projects')
    revalidatePath('/founder/projects')
    return { success: true }
  } catch (err: unknown) {
    return { error: await captureActionError('restoreProject', err) }
  }
}

export async function setProjectBudget(projectId: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = ProjectBudgetSchema.safeParse({
      budget_amount: parseFloat(formData.get('budget_amount') as string) || 0,
      contingency_percent: parseFloat(formData.get('contingency_percent') as string) || 10,
      notes: formData.get('notes'),
    })

    if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message }
    const data = parsed.data

    const { error } = await supabase
      .from('project_budgets')
      .upsert({
        project_id: projectId,
        budget_amount: data.budget_amount,
        contingency_percent: data.contingency_percent,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'project_id' })

    if (error) return { error: error.message }

    revalidatePath(`/admin/projects/${projectId}/budget`)
    revalidatePath(`/admin/projects`)
    return { success: true }
  } catch (err: unknown) {
    return { error: await captureActionError('setProjectBudget', err) }
  }
}



export async function updateProjectStatus(projectId: string, status: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = ProjectStatusSchema.safeParse({ projectId, status })
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { error } = await supabase
      .from('projects')
      .update({ status: parsed.data.status })
      .eq('id', parsed.data.projectId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/projects')
    revalidatePath('/founder/projects')
    return { success: true }
  } catch (err: unknown) {
    return { error: await captureActionError('updateProjectStatus', err) }
  }
}

export async function getProjectDates(projectId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const { data } = await supabase
      .from('projects')
      .select('start_date, end_date')
      .eq('id', projectId)
      .single()
    return { data }
  } catch (err: unknown) {
    return { error: (err instanceof Error ? err.message : String(err)) }
  }
}
