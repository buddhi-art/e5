'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CreateProjectSchema, ProjectBudgetSchema, ProjectStatusSchema, UuidParamSchema } from '@/lib/validations'
import { verifyAdminOrFounder } from '@/lib/auth-utils'

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
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
    })

    if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message }
    const data = parsed.data

    const { error } = await supabase.from('projects').insert({
      client_id: data.client_id,
      title: data.title,
      status: 'not_started',
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
  } catch (err: any) {
    console.error('Error in createProject:', err)
    return { error: err.message || 'An unexpected error occurred' }
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
  } catch (err: any) {
    console.error('Error in updateProject:', err)
    return { error: err.message || 'An unexpected error occurred' }
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
  } catch (err: any) {
    console.error('Error in archiveProject:', err)
    return { error: err.message || 'An unexpected error occurred' }
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
  } catch (err: any) {
    console.error('Error in deleteProject:', err)
    return { error: err.message || 'An unexpected error occurred' }
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
  } catch (err: any) {
    console.error('Error in restoreProject:', err)
    return { error: err.message || 'An unexpected error occurred' }
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
  } catch (err: any) {
    console.error('Error in setProjectBudget:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function getProjectFinancials(projectId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    // Get budget
    const { data: budget } = await supabase
      .from('project_budgets')
      .select('*')
      .eq('project_id', projectId)
      .single()

    // Sum approved expenses for project
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('project_id', projectId)
      .in('status', ['approved', 'reimbursed'])
      .is('deleted_at', null)

    const total_expenses = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

    // Sum invoice grand_totals for project
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('grand_total, paid_amount')
      .eq('project_id', projectId)
      .is('deleted_at', null)

    const total_invoiced = invoiceData?.reduce((sum, inv) => sum + Number(inv.grand_total), 0) || 0
    const total_paid = invoiceData?.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0) || 0

    // Calculate profit/margin
    const profit = total_invoiced - total_expenses
    const margin = total_invoiced > 0 ? (profit / total_invoiced) * 100 : 0

    return {
      budget,
      total_expenses,
      total_invoiced,
      total_paid,
      profit,
      margin,
    }
  } catch (err: any) {
    console.error('Error in getProjectFinancials:', err)
    return { error: err.message || 'An unexpected error occurred' }
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
  } catch (err: any) {
    console.error('Error in updateProjectStatus:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function getProjectDates(projectId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data } = await supabase
      .from('projects')
      .select('start_date, end_date')
      .eq('id', projectId)
      .single()
    return { data }
  } catch (err: any) {
    return { error: err.message }
  }
}
