'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInvoice(formData: FormData) {
    try {
        const supabase = await createClient()

        const client_id = formData.get('client_id') as string
        const project_id = formData.get('project_id') as string
        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const currency = formData.get('currency') as string
        const issue_date = formData.get('issue_date') as string
        const due_date = formData.get('due_date') as string
        const tax_rate = parseFloat(formData.get('tax_rate') as string) || 0
        const notes = formData.get('notes') as string
        const itemsRaw = formData.get('items') as string

        const advance_received = parseFloat(formData.get('advance_received') as string) || 0
        const discount_type = (formData.get('discount_type') as string) || 'fixed'
        const discount_value = parseFloat(formData.get('discount_value') as string) || 0

        if (!client_id || !title || !due_date) {
            return { error: 'Client, Title, and Due Date are required.' }
        }

        let items: { description: string; quantity: number; unit_price: number }[] = []
        try {
            items = JSON.parse(itemsRaw)
        } catch {
            return { error: 'Invalid items data.' }
        }
        if (items.length === 0) {
            return { error: 'At least one line item is required.' }
        }

        const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
        const discount_amount = discount_type === 'percentage'
            ? (subtotal * discount_value) / 100
            : discount_value
        const amount_after_discount = subtotal - discount_amount
        const tax_amount = (amount_after_discount * tax_rate) / 100
        const grand_total = amount_after_discount + tax_amount
        const balance_due = grand_total - advance_received

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const year = new Date().getFullYear().toString()
        const { data: invoice_number_res, error: seqError } = await supabase.rpc('generate_invoice_number', { p_year: year })
        if (seqError) return { error: 'Failed to generate invoice number: ' + seqError.message }
        const invoice_number = invoice_number_res

        const { data: invoice, error: invError } = await supabase
            .from('invoices')
            .insert({
                invoice_number,
                client_id,
                project_id: project_id || null,
                title,
                description: description || null,
                amount: subtotal,
                discount_type,
                discount_value,
                discount_amount,
                advance_received,
                tax_rate,
                tax_amount,
                grand_total,
                balance_due,
                currency: currency || 'NPR',
                issue_date: issue_date || new Date().toISOString().split('T')[0],
                due_date,
                notes: notes || null,
                created_by: user?.id || null,
            })
            .select()
            .single()

        if (invError) return { error: invError.message }

        const itemInserts = items.map(item => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.quantity * item.unit_price,
        }))

        const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(itemInserts)

        if (itemsError) {
            await supabase.from('invoices').update({ deleted_at: new Date().toISOString() }).eq('id', invoice.id)
            return { error: 'Failed to create invoice items: ' + itemsError.message }
        }

        revalidatePath('/admin/invoices')
        return { success: true, invoiceId: invoice.id }
    } catch (err: any) {
        console.error('Error in createInvoice:', err)
        return { error: err.message || 'An unexpected error occurred' }
    }
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const { error } = await supabase
            .from('invoices')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', invoiceId)

        if (error) return { error: error.message }
        revalidatePath('/admin/invoices')
        revalidatePath(`/admin/invoices/${invoiceId}`)
        return { success: true }
    } catch (err: any) {
        console.error('Error in updateInvoiceStatus:', err)
        return { error: err.message || 'An unexpected error occurred' }
    }
}

export async function recordPayment(formData: FormData) {
    try {
        const supabase = await createClient()
        const invoice_id = formData.get('invoice_id') as string
        const amount = parseFloat(formData.get('amount') as string) || 0
        const payment_date = formData.get('payment_date') as string
        const payment_method = formData.get('payment_method') as string
        const reference_number = formData.get('reference_number') as string
        const notes = formData.get('notes') as string

        if (!invoice_id || !amount || !payment_method) {
            return { error: 'Invoice, Amount, and Payment Method are required.' }
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const { error: payError } = await supabase
            .from('payments')
            .insert({
                invoice_id, amount,
                payment_date: payment_date || new Date().toISOString().split('T')[0],
                payment_method,
                reference_number: reference_number || null,
                notes: notes || null,
                received_by: user?.id || null,
            })

        if (payError) return { error: payError.message }

        const { data: invoice } = await supabase
            .from('invoices')
            .select('paid_amount, grand_total')
            .eq('id', invoice_id)
            .single()

        if (invoice) {
            const new_paid = (invoice.paid_amount || 0) + amount
            let new_status = 'partially_paid'
            if (new_paid >= invoice.grand_total) new_status = 'paid'

            const { error: updateError } = await supabase
                .from('invoices')
                .update({ paid_amount: new_paid, status: new_status, updated_at: new Date().toISOString() })
                .eq('id', invoice_id)
            if (updateError) return { error: updateError.message }
        }

        revalidatePath('/admin/invoices')
        revalidatePath(`/admin/invoices/${invoice_id}`)
        return { success: true }
    } catch (err: any) {
        console.error('Error in recordPayment:', err)
        return { error: err.message || 'An unexpected error occurred' }
    }
}

export async function sendInvoice(invoiceId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const { error } = await supabase
            .from('invoices')
            .update({ status: 'sent', updated_at: new Date().toISOString() })
            .eq('id', invoiceId)
            .eq('status', 'draft')

        if (error) return { error: error.message }
        revalidatePath('/admin/invoices')
        revalidatePath(`/admin/invoices/${invoiceId}`)
        return { success: true }
    } catch (err: any) {
        console.error('Error in sendInvoice:', err)
        return { error: err.message || 'An unexpected error occurred' }
    }
}

export async function deleteInvoice(invoiceId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const { error } = await supabase
            .from('invoices')
            .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', invoiceId)

        if (error) return { error: error.message }
        revalidatePath('/admin/invoices')
        return { success: true }
    } catch (err: any) {
        console.error('Error in deleteInvoice:', err)
        return { error: err.message || 'An unexpected error occurred' }
    }
}

export async function updateInvoice(invoiceId: string, formData: FormData) {
    try {
        const supabase = await createClient()
        const client_id = formData.get('client_id') as string
        const project_id = formData.get('project_id') as string
        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const currency = formData.get('currency') as string
        const issue_date = formData.get('issue_date') as string
        const due_date = formData.get('due_date') as string
        const tax_rate = parseFloat(formData.get('tax_rate') as string) || 0
        const notes = formData.get('notes') as string
        const itemsRaw = formData.get('items') as string

        const advance_received = parseFloat(formData.get('advance_received') as string) || 0
        const discount_type = (formData.get('discount_type') as string) || 'fixed'
        const discount_value = parseFloat(formData.get('discount_value') as string) || 0

        if (!client_id || !title || !due_date) {
            return { error: 'Client, Title, and Due Date are required.' }
        }

        let items: { description: string; quantity: number; unit_price: number }[] = []
        try {
            items = JSON.parse(itemsRaw)
        } catch {
            return { error: 'Invalid items data.' }
        }
        if (items.length === 0) return { error: 'At least one line item is required.' }

        const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
        const discount_amount = discount_type === 'percentage'
            ? (subtotal * discount_value) / 100
            : discount_value
        const amount_after_discount = subtotal - discount_amount
        const tax_amount = (amount_after_discount * tax_rate) / 100
        const grand_total = amount_after_discount + tax_amount
        const balance_due = grand_total - advance_received

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const { data: currentInvoice } = await supabase.from('invoices').select('status').eq('id', invoiceId).single()
        if (currentInvoice?.status !== 'draft') return { error: 'Only draft invoices can be edited.' }

        const { error: invError } = await supabase
            .from('invoices')
            .update({
                client_id, project_id: project_id || null, title,
                description: description || null, amount: subtotal,
                discount_type, discount_value, discount_amount, advance_received,
                tax_rate, tax_amount, grand_total, balance_due,
                currency: currency || 'NPR',
                issue_date: issue_date || new Date().toISOString().split('T')[0],
                due_date, notes: notes || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', invoiceId)

        if (invError) return { error: invError.message }

        await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)

        const itemInserts = items.map(item => ({
            invoice_id: invoiceId,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.quantity * item.unit_price,
        }))

        const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(itemInserts)

        if (itemsError) return { error: 'Failed to create new invoice items: ' + itemsError.message }

        revalidatePath('/admin/invoices')
        revalidatePath(`/admin/invoices/${invoiceId}`)
        return { success: true }
    } catch (err: any) {
        console.error('Error in updateInvoice:', err)
        return { error: err.message || 'An unexpected error occurred' }
    }
}

export async function getProjectDates(projectId: string) {
    try {
        const supabase = await createClient()
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

export async function updateOverdueInvoices() {
    try {
        const supabase = await createClient()
        const today = new Date().toISOString().split('T')[0]
        const { error } = await supabase
            .from('invoices')
            .update({ status: 'overdue', updated_at: new Date().toISOString() })
            .lt('due_date', today)
            .in('status', ['sent', 'partially_paid'])
            .is('deleted_at', null)

        if (error) {
            console.error('Error updating overdue invoices:', error)
            return { error: error.message }
        }

        revalidatePath('/admin/invoices')
        revalidatePath('/admin')
        return { success: true }
    } catch (err: any) {
        console.error('Exception in updateOverdueInvoices:', err)
        return { error: err.message }
    }
}
