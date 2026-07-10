'use server'

import { createClient } from '@/lib/supabase/server'

export async function getStorageSignedUrl(bucket: string, filePath: string): Promise<string | null> {
    if (!filePath) return null
    try {
        const supabase = await createClient()
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, 3600)
        if (error || !data) {
            console.error(`Signed URL error for bucket "${bucket}":`, error?.message)
            // Fallback to public URL
            const { data: publicData } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath)
            return publicData?.publicUrl || null
        }
        return data.signedUrl
    } catch (err) {
        console.error('getSignedUrl error:', err instanceof Error ? err.message : err)
        return null
    }
}
