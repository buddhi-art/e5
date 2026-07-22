/**
 * Transaction Management System for Supabase
 *
 * Provides atomic transaction support for complex operations that modify
 * multiple related records. Handles deadlocks with retry logic.
 */

import { createClient } from './server'

/**
 * Transaction options
 */
export interface TransactionOptions {
    maxRetries?: number
    retryDelay?: number
}

/**
 * Transaction result
 */
export interface TransactionResult<T> {
    success: boolean
    data?: T
    error?: string
    attempts?: number
}

/**
 * Execute a transaction with retry logic for deadlock handling
 *
 * @param operation - The transaction operation to execute
 * @param options - Transaction options
 * @returns Transaction result
 */
export async function executeTransaction<T>(
    operation: (supabase: any) => Promise<T>,
    options: TransactionOptions = {}
): Promise<TransactionResult<T>> {
    const { maxRetries = 3, retryDelay = 100 } = options
    let attempts = 0
    let lastError: any

    while (attempts < maxRetries) {
        attempts++
        try {
            // Start a new transaction
            const supabase = await createClient()

            // Execute the operation within a transaction
            const result = await operation(supabase)

            return {
                success: true,
                data: result,
                attempts
            }
        } catch (error) {
            lastError = error
            console.error(`Transaction attempt ${attempts} failed:`, error)

            // Check if this is a deadlock error (PostgreSQL error code 40P01)
            if (error && typeof error === 'object' && 'code' in error && error.code === '40P01') {
                // Deadlock detected, wait before retrying
                if (attempts < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay))
                    continue
                }
            }

            // For non-deadlock errors, don't retry
            break
        }
    }

    console.error(`Transaction failed after ${attempts} attempts:`, lastError)
    return {
        success: false,
        error: lastError?.message || 'Transaction failed',
        attempts
    }
}

/**
 * Create a transaction wrapper for Supabase RPC calls
 *
 * @param rpcName - The RPC function name
 * @param params - The RPC parameters
 * @param options - Transaction options
 * @returns Transaction result
 */
export async function executeRpcTransaction<T>(
    rpcName: string,
    params: Record<string, any>,
    options: TransactionOptions = {}
): Promise<TransactionResult<T>> {
    return executeTransaction(async (supabase) => {
        const { data, error } = await supabase.rpc(rpcName, params)

        if (error) {
            throw new Error(error.message)
        }

        return data
    }, options)
}

/**
 * Transaction wrapper for equipment checkout operations
 */
export async function executeEquipmentCheckout(
    equipmentId: string,
    employeeId: string,
    checkoutDate: string,
    returnDate: string | null,
    notes: string | null,
    userId: string
): Promise<TransactionResult<string>> {
    return executeRpcTransaction('atomic_equipment_checkout', {
        p_equipment_id: equipmentId,
        p_employee_id: employeeId,
        p_checkout_date: checkoutDate,
        p_return_date: returnDate,
        p_notes: notes,
        p_checked_out_by: userId
    })
}

/**
 * Transaction wrapper for invoice creation with items
 */
export async function executeInvoiceCreation(
    invoiceData: {
        client_id: string
        project_id: string | null
        invoice_number: string
        title: string
        issue_date: string
        due_date: string
        status: string
        notes: string | null
    },
    items: Array<{
        description: string
        quantity: number
        unit_price: number
        tax_rate: number
        discount_rate: number
    }>,
    userId: string
): Promise<TransactionResult<string>> {
    return executeRpcTransaction('atomic_create_invoice_with_items', {
        p_invoice: {
            client_id: invoiceData.client_id,
            project_id: invoiceData.project_id,
            invoice_number: invoiceData.invoice_number,
            title: invoiceData.title,
            issue_date: invoiceData.issue_date,
            due_date: invoiceData.due_date,
            status: invoiceData.status,
            notes: invoiceData.notes,
            created_by: userId
        },
        p_items: items
    })
}

/**
 * Transaction wrapper for talent booking
 */
export async function executeTalentBooking(
    talentId: string,
    projectId: string | null,
    bookingDate: string,
    endDate: string | null,
    rateType: string,
    rateAmount: number,
    description: string | null,
    location: string | null,
    notes: string | null,
    userId: string
): Promise<TransactionResult<string>> {
    return executeRpcTransaction('atomic_talent_booking', {
        p_talent_id: talentId,
        p_project_id: projectId,
        p_booking_date: bookingDate,
        p_end_date: endDate,
        p_rate_type: rateType,
        p_rate_amount: rateAmount,
        p_description: description,
        p_location: location,
        p_notes: notes,
        p_booked_by: userId
    })
}