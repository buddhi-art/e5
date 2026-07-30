'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyAdminOrFounder } from '@/lib/auth-utils'

const SIGNABLE_BUCKETS = new Set(['receipts', 'equipment-photos', 'talent-photos'])
const PUBLIC_BUCKETS = new Set(['equipment-photos', 'talent-photos'])

function isSafeStoragePath(filePath: string): boolean {
    return !!filePath &&
        !filePath.startsWith('/') &&
        !filePath.split('/').some((segment) => segment === '..')
}

export async function getStorageSignedUrl(bucket: string, filePath: string): Promise<string | null> {
    if (!SIGNABLE_BUCKETS.has(bucket) || !isSafeStoragePath(filePath)) return null

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        if (bucket === 'receipts') {
            const { data: expense, error: expenseError } = await supabase
                .from('expenses')
                .select('submitted_by')
                .eq('receipt_url', filePath)
                .is('deleted_at', null)
                .maybeSingle()

            if (expenseError || !expense) return null

            const isAdminOrFounder = await verifyAdminOrFounder(supabase, user.id)
            if (!isAdminOrFounder && expense.submitted_by !== user.id) return null
        } else if (!PUBLIC_BUCKETS.has(bucket)) {
            return null
        }

        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, 3600)
        if (error || !data) {
            console.error(`Signed URL error for bucket "${bucket}":`, error?.message)
            return null
        }

        return data.signedUrl
    } catch (err) {
        console.error('getSignedUrl error:', err instanceof Error ? err.message : err)
        return null
    }
}
