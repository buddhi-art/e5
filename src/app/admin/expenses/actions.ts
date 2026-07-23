/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CreateExpenseSchema, ExpenseStatusSchema } from '@/lib/validations'
import { verifyAdminOrFounder } from '@/lib/auth-utils'
import { validateFileUpload, generateStorageFilename, ALLOWED_DOCUMENT_TYPES } from '@/lib/supabase/storage'
import { createNotification } from '@/lib/notifications'

export async function addExpenseCategory(name: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }
        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return { error: 'Permission denied.' }

        if (!name || name.trim().length === 0) return { error: 'Category name is required' }

        const { error } = await supabase.from('expense_categories').insert({ name: name.trim() })
        if (error) return { error: error.message }
        return { success: true }
    } catch (err: unknown) {
        return { error: (err instanceof Error ? err.message : String(err)) }
    }
}

export async function createExpense(formData: FormData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const parsed = CreateExpenseSchema.safeParse({
            project_id: formData.get('project_id') as string,
            client_id: formData.get('client_id') as string,
            category: formData.get('category') as string,
            amount: parseFloat(formData.get('amount') as string) || 0,
            description: formData.get('description') as string,
            expense_date: formData.get('expense_date') as string,
            is_billable: formData.get('is_billable') === 'on',
            notes: formData.get('notes') as string,
        })

        if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message }
        const data = parsed.data

        let receipt_url: string | null = null
        const receipt = formData.get('receipt') as File | null
        if (receipt && receipt.size > 0) {
            // Validate file type and size before uploading
            const validationError = validateFileUpload(receipt, ALLOWED_DOCUMENT_TYPES)
            if (validationError) return { error: validationError }
            const safeName = generateStorageFilename(receipt.name)
            const filePath = `${data.project_id || 'general'}/${safeName}`

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
                project_id: data.project_id || null,
                client_id: data.client_id || null,
                category: data.category,
                amount: data.amount,
                description: data.description,
                expense_date: data.expense_date || new Date().toISOString().split('T')[0],
                is_billable: data.is_billable,
                receipt_url,
                notes: data.notes || null,
                submitted_by: user.id,
                status: 'pending',
            })

        if (error) return { error: error.message }

        revalidatePath('/admin/expenses')
        revalidatePath('/employee/expenses')
        return { success: true }
    } catch (err: unknown) {
        console.error('Error in createExpense:', err)
        return { error: (err instanceof Error ? err.message : String(err)) || 'An unexpected error occurred' }
    }
}

export async function updateExpenseStatus(expenseId: string, status: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }
        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return { error: 'Permission denied.' }

        const parsed = ExpenseStatusSchema.safeParse({ expenseId, status })
        if (!parsed.success) return { error: parsed.error.issues[0].message }

        const updateData: Record<string, any> = { status: parsed.data.status }
        if (parsed.data.status === 'approved' || parsed.data.status === 'reimbursed') {
            updateData.approved_by = user.id
        }

        // Fetch the submitter and expense summary so we can notify them of the change.
        const { data: expense } = await supabase
            .from('expenses')
            .select('submitted_by, amount')
            .eq('id', parsed.data.expenseId)
            .single()

        const { error } = await supabase
            .from('expenses')
            .update(updateData)
            .eq('id', parsed.data.expenseId)

        if (error) return { error: error.message }

        // Notify the employee who submitted the expense of its new status.
        if (expense?.submitted_by && expense.submitted_by !== user.id) {
            const status = parsed.data.status
            const amountLabel = expense.amount != null ? `${Number(expense.amount).toLocaleString()} NPR ` : ''
            await createNotification(
                expense.submitted_by,
                `expense_${status}`,
                `Expense ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                `Your ${amountLabel}expense has been ${status}.`,
                '/employee/expenses',
                true,
            )
        }

        revalidatePath('/admin/expenses')
        revalidatePath(`/admin/expenses/${expenseId}`)
        revalidatePath('/employee/expenses')
        return { success: true }
    } catch (err: unknown) {
        console.error('Error in updateExpenseStatus:', err)
        return { error: (err instanceof Error ? err.message : String(err)) || 'An unexpected error occurred' }
    }
}

export async function deleteExpense(expenseId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const { data: expense } = await supabase
            .from('expenses')
            .select('status, submitted_by')
            .eq('id', expenseId)
            .single()

        if (!expense) return { error: 'Expense not found' }
        if (expense.status !== 'pending') {
            return { error: 'Only pending expenses can be deleted' }
        }

        // Allow deletion by the submitter or admin/founder
        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (expense.submitted_by !== user.id && !isAuthorized) {
            return { error: 'Permission denied.' }
        }

        const { error } = await supabase
            .from('expenses')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', expenseId)

        if (error) return { error: error.message }

        revalidatePath('/admin/expenses')
        revalidatePath('/employee/expenses')
        return { success: true }
    } catch (err: unknown) {
        console.error('Error in deleteExpense:', err)
        return { error: (err instanceof Error ? err.message : String(err)) || 'An unexpected error occurred' }
    }
}
