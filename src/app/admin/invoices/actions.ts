'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { InvoiceSchema, InvoicePaymentSchema, UuidParamSchema, InvoiceStatusUpdateSchema } from '@/lib/validations'
import { verifyAdminOrFounder } from '@/lib/auth-utils'
import { createNotification } from '@/lib/notifications'

export async function createInvoice(formData: FormData) {
    try {
        const supabase = await createClient()

        const parsed = InvoiceSchema.safeParse({
            client_id: formData.get('client_id'),
            project_id: formData.get('project_id'),
            title: formData.get('title'),
            description: formData.get('description'),
            currency: formData.get('currency'),
            issue_date: formData.get('issue_date'),
            due_date: formData.get('due_date'),
            tax_rate: parseFloat(formData.get('tax_rate') as string) || 0,
            notes: formData.get('notes'),
            advance_received: parseFloat(formData.get('advance_received') as string) || 0,
            discount_type: formData.get('discount_type'),
            discount_value: parseFloat(formData.get('discount_value') as string) || 0,
            itemsRaw: formData.get('items'),
        });

        if (!parsed.success) {
            return { error: 'Validation failed: ' + parsed.error.issues[0].message };
        }

        const data = parsed.data;
        if (!data.items || data.items.length === 0) {
            return { error: 'At least one line item is required.' };
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id);
        if (!isAuthorized) return { error: 'Permission denied. Only admins or founders can create invoices.' };

        const subtotal = data.items.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0)
        const discount_amount = data.discount_type === 'percentage'
            ? (subtotal * data.discount_value) / 100
            : data.discount_value
        const amount_after_discount = subtotal - discount_amount
        const tax_amount = (amount_after_discount * data.tax_rate) / 100
        const grand_total = amount_after_discount + tax_amount
        const balance_due = grand_total - data.advance_received

        const year = new Date().getFullYear().toString()
        const { data: invoice_number_res, error: seqError } = await supabase.rpc('generate_invoice_number', { p_year: year })
        if (seqError) return { error: 'Failed to generate invoice number: ' + seqError.message }
        const invoice_number = invoice_number_res

        const { data: invoice, error: invError } = await supabase
            .from('invoices')
            .insert({
                invoice_number,
                client_id: data.client_id,
                project_id: data.project_id || null,
                title: data.title,
                description: data.description || null,
                amount: subtotal,
                discount_type: data.discount_type,
                discount_value: data.discount_value,
                discount_amount,
                advance_received: data.advance_received,
                tax_rate: data.tax_rate,
                tax_amount,
                grand_total,
                balance_due,
                currency: data.currency || 'NPR',
                issue_date: data.issue_date || new Date().toISOString().split('T')[0],
                due_date: data.due_date,
                notes: data.notes || null,
                created_by: user?.id || null,
            })
            .select()
            .single()

        if (invError) return { error: invError.message }

        const itemInserts = data.items.map((item: any) => ({
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

        // FIX: Validate status with enum
        const parsed = InvoiceStatusUpdateSchema.safeParse({ invoiceId, status });
        if (!parsed.success) return { error: 'Invalid invoice status' };

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id);
        if (!isAuthorized) return { error: 'Permission denied.' };

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
        const parsed = InvoicePaymentSchema.safeParse({
            invoice_id: formData.get('invoice_id'),
            amount: parseFloat(formData.get('amount') as string) || 0,
            payment_date: formData.get('payment_date') || new Date().toISOString().split('T')[0],
            payment_method: formData.get('payment_method'),
            reference_number: formData.get('reference_number'),
            notes: formData.get('notes'),
        });

        if (!parsed.success) {
            return { error: 'Validation failed: ' + parsed.error.issues[0].message };
        }
        const data = parsed.data;

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id);
        if (!isAuthorized) return { error: 'Permission denied.' };

        const { error: payError } = await supabase
            .from('payments')
            .insert({
                invoice_id: data.invoice_id,
                amount: data.amount,
                payment_date: data.payment_date,
                payment_method: data.payment_method,
                reference_number: data.reference_number || null,
                notes: data.notes || null,
                received_by: user?.id || null,
            })

        if (payError) return { error: payError.message }

        // FIX: Check for overpayment
        const { data: invoice } = await supabase
            .from('invoices')
            .select('paid_amount, grand_total')
            .eq('id', data.invoice_id)
            .single()

        if (invoice) {
            const remaining = Number(invoice.grand_total) - Number(invoice.paid_amount || 0)
            if (data.amount > remaining + 0.01) {
                return { error: `Payment exceeds remaining balance (NPR ${remaining.toLocaleString()}).` }
            }

            const new_paid = (invoice.paid_amount || 0) + data.amount
            let new_status = 'partially_paid'
            if (new_paid >= invoice.grand_total) new_status = 'paid'

            const { error: updateError } = await supabase
                .from('invoices')
                .update({ paid_amount: new_paid, status: new_status, updated_at: new Date().toISOString() })
                .eq('id', data.invoice_id)
            if (updateError) return { error: updateError.message }
        }

        revalidatePath('/admin/invoices')
        revalidatePath(`/admin/invoices/${data.invoice_id}`)
        return { success: true }
    } catch (err: any) {
        console.error('Error in recordPayment:', err)
        return { error: err.message || 'An unexpected error occurred' }
    }
}

export async function sendInvoice(invoiceId: string) {
    try {
        const supabase = await createClient()
        const parsed = UuidParamSchema.safeParse({ id: invoiceId });
        if (!parsed.success) return { error: 'Invalid invoice ID' };

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id);
        if (!isAuthorized) return { error: 'Permission denied.' };

        const { data, error } = await supabase
            .from('invoices')
            .update({ status: 'sent', updated_at: new Date().toISOString() })
            .eq('id', parsed.data.id)
            .eq('status', 'draft')
            .select('id')

        if (error) return { error: error.message }
        if (!data || data.length === 0) {
            return { error: 'Invoice could not be sent — it may not be in draft status.' }
        }
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
        const parsed = UuidParamSchema.safeParse({ id: invoiceId });
        if (!parsed.success) return { error: 'Invalid invoice ID' };

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id);
        if (!isAuthorized) return { error: 'Permission denied.' };

        const { error } = await supabase
            .from('invoices')
            .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', parsed.data.id)

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
        const idParsed = UuidParamSchema.safeParse({ id: invoiceId });
        if (!idParsed.success) return { error: 'Invalid invoice ID' };

        const parsed = InvoiceSchema.safeParse({
            client_id: formData.get('client_id'),
            project_id: formData.get('project_id'),
            title: formData.get('title'),
            description: formData.get('description'),
            currency: formData.get('currency'),
            issue_date: formData.get('issue_date'),
            due_date: formData.get('due_date'),
            tax_rate: parseFloat(formData.get('tax_rate') as string) || 0,
            notes: formData.get('notes'),
            advance_received: parseFloat(formData.get('advance_received') as string) || 0,
            discount_type: formData.get('discount_type'),
            discount_value: parseFloat(formData.get('discount_value') as string) || 0,
            itemsRaw: formData.get('items'),
        });

        if (!parsed.success) {
            return { error: 'Validation failed: ' + parsed.error.issues[0].message };
        }

        const data = parsed.data;
        if (!data.items || data.items.length === 0) return { error: 'At least one line item is required.' }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id);
        if (!isAuthorized) return { error: 'Permission denied.' };

        const subtotal = data.items.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0)
        const discount_amount = data.discount_type === 'percentage'
            ? (subtotal * data.discount_value) / 100
            : data.discount_value
        const amount_after_discount = subtotal - discount_amount
        const tax_amount = (amount_after_discount * data.tax_rate) / 100
        const grand_total = amount_after_discount + tax_amount
        const balance_due = grand_total - data.advance_received

        const { data: currentInvoice } = await supabase.from('invoices').select('status').eq('id', invoiceId).single()
        if (currentInvoice?.status !== 'draft') return { error: 'Only draft invoices can be edited.' }

        const { error: invError } = await supabase
            .from('invoices')
            .update({
                client_id: data.client_id,
                project_id: data.project_id || null,
                title: data.title,
                description: data.description || null,
                amount: subtotal,
                discount_type: data.discount_type,
                discount_value: data.discount_value,
                discount_amount,
                advance_received: data.advance_received,
                tax_rate: data.tax_rate,
                tax_amount,
                grand_total,
                balance_due,
                currency: data.currency || 'NPR',
                issue_date: data.issue_date || new Date().toISOString().split('T')[0],
                due_date: data.due_date,
                notes: data.notes || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', invoiceId)

        if (invError) return { error: invError.message }

        const itemInserts = data.items.map((item: any) => ({
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

        await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)

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
    } catch (err: any) {
        return { error: err.message }
    }
}

export async function updateOverdueInvoices() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id);
        if (!isAuthorized) return { error: 'Permission denied.' };

        const today = new Date().toISOString().split('T')[0]

        const { data: overdueInvoices } = await supabase
            .from('invoices')
            .select('id, invoice_number, title, clients(company_name)')
            .lt('due_date', today)
            .in('status', ['sent', 'partially_paid'])
            .is('deleted_at', null)

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

        if (overdueInvoices && overdueInvoices.length > 0) {
            const { data: adminUsers } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'admin')
                .is('deleted_at', null)

            for (const inv of overdueInvoices) {
                const companyName = typeof inv.clients === 'object' && inv.clients !== null
                    ? (inv.clients as any)?.company_name
                    : 'Unknown'
                for (const admin of adminUsers || []) {
                    await createNotification(
                        admin.id,
                        'overdue_invoice',
                        `Overdue Invoice: ${inv.invoice_number}`,
                        `${companyName} - ${inv.title || 'No title'}`,
                        `/admin/invoices/${inv.id}`,
                        false,
                    )
                }
            }
        }

        revalidatePath('/admin/invoices')
        revalidatePath('/admin')
        return { success: true }
    } catch (err: any) {
        console.error('Exception in updateOverdueInvoices:', err)
        return { error: err.message }
    }
}