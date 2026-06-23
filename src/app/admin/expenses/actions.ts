'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addExpenseCategory(name: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase.from('expense_categories').insert({ name })
        if (error) return { error: error.message }
        return { success: true }
    } catch (err: any) {
        return { error: err.message }
    }
}

export async function createExpense(formData: FormData) {
    try {
        const supabase = await createClient()

        const project_id = formData.get('project_id') as string
        const client_id = formData.get('client_id') as string
        const category = formData.get('category') as string
        const amount = parseFloat(formData.get('amount') as string) || 0
        const description = formData.get('description') as string
        const expense_date = formData.get('expense_date') as string
        const is_billable = formData.get('is_billable') === 'on'
        const notes = formData.get('notes') as string

        if (!category || !amount || !description) {
            return { error: 'Category, Amount, and Description are required.' }
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        let receipt_url: string | null = null
        const receipt = formData.get('receipt') as File | null
        if (receipt && receipt.size > 0) {
            const fileExt = receipt.name.split('.').pop()
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            const filePath = `${project_id || 'general'}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(filePath, receipt)

            if (uploadError) {
                console.error('Upload error:', uploadError)
                return { error: 'Failed to upload receipt image.' }
            }

            // Store the storage path, not the public URL (receipts bucket is private)
            receipt_url = filePath
        }

        const { error } = await supabase
            .from('expenses')
            .insert({
                project_id: project_id || null,
                client_id: client_id || null,
                category,
                amount,
                description,
                expense_date: expense_date || new Date().toISOString().split('T')[0],
                is_billable,
                receipt_url,
                notes: notes || null,
                submitted_by: user.id,
                status: 'pending',
            })

        if (error) return { error: error.message }

        revalidatePath('/admin/expenses')
        revalidatePath('/employee/expenses')
        return { success: true }
    } catch (err: any) {
        console.error('Error in createExpense:', err)
        return { error: err.message || 'An unexpected error occurred' }
    }
}

export async function updateExpenseStatus(expenseId: string, status: string) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()

        const updateData: Record<string, any> = { status }
        if (status === 'approved' || status === 'reimbursed') {
            updateData.approved_by = user?.id
        }

        const { error } = await supabase
            .from('expenses')
            .update(updateData)
            .eq('id', expenseId)

        if (error) return { error: error.message }

        revalidatePath('/admin/expenses')
        revalidatePath(`/admin/expenses/${expenseId}`)
        revalidatePath('/employee/expenses')
        return { success: true }
    } catch (err: any) {
        console.error('Error in updateExpenseStatus:', err)
        return { error: err.message || 'An unexpected error occurred' }
    }
}

export async function deleteExpense(expenseId: string) {
    try {
        const supabase = await createClient()

        const { data: expense } = await supabase
            .from('expenses')
            .select('status')
            .eq('id', expenseId)
            .single()

        if (!expense) return { error: 'Expense not found' }
        if (expense.status !== 'pending') {
            return { error: 'Only pending expenses can be deleted' }
        }

        const { error } = await supabase
            .from('expenses')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', expenseId)

        if (error) return { error: error.message }

        revalidatePath('/admin/expenses')
        revalidatePath('/employee/expenses')
        return { success: true }
    } catch (err: any) {
        console.error('Error in deleteExpense:', err)
        return { error: err.message || 'An unexpected error occurred' }
    }
}
