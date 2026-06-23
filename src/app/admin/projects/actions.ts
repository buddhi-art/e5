'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProject(formData: FormData) {
  try {
    const client_id = formData.get('client_id') as string
    const title = formData.get('title') as string
    const start_date = formData.get('start_date') as string
    const end_date = formData.get('end_date') as string

    if (!client_id || !title) {
      return { error: 'Client and Project Title are required' }
    }

    const supabase = await createClient()

    const { error } = await supabase.from('projects').insert({
      client_id,
      title,
      status: 'not_started',
      start_date: start_date || null,
      end_date: end_date || null,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/projects')
    revalidatePath(`/admin/clients/${client_id}`)
    return { success: true }
  } catch (err: any) {
    console.error('Error in createProject:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function updateProject(projectId: string, formData: FormData) {
  try {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const client_id = formData.get('client_id') as string

    if (!title || !client_id) {
      return { error: 'Title and Client are required' }
    }

    const start_date = formData.get('start_date') as string
    const end_date = formData.get('end_date') as string

    const { error } = await supabase
      .from('projects')
      .update({
        title,
        client_id,
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .eq('id', projectId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/projects')
    return { success: true }
  } catch (err: any) {
    console.error('Error in updateProject:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function archiveProject(projectId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', projectId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/projects')
    return { success: true }
  } catch (err: any) {
    console.error('Error in archiveProject:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function deleteProject(projectId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/projects')
    return { success: true }
  } catch (err: any) {
    console.error('Error in deleteProject:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function restoreProject(projectId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: null })
      .eq('id', projectId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/projects')
    return { success: true }
  } catch (err: any) {
    console.error('Error in restoreProject:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function setProjectBudget(projectId: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const budget_amount = parseFloat(formData.get('budget_amount') as string) || 0
    const contingency_percent = parseFloat(formData.get('contingency_percent') as string) || 10
    const notes = formData.get('notes') as string

    if (!budget_amount) {
      return { error: 'Budget amount is required' }
    }

    const { error } = await supabase
      .from('project_budgets')
      .upsert({
        project_id: projectId,
        budget_amount,
        contingency_percent,
        notes: notes || null,
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

    const { error } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', projectId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/admin/projects')
    return { success: true }
  } catch (err: any) {
    console.error('Error in updateProjectStatus:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}
