import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from './server'

/**
 * Generate a signed URL for a private storage bucket file.
 * Falls back to a public URL if signed URL generation fails.
 */
export async function getSignedUrl(bucket: string, filePath: string, expiresIn = 3600): Promise<string | null> {
    if (!filePath) return null

    try {
        const supabase = await createClient()
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, expiresIn)

        if (error || !data) {
            console.error(`Signed URL error for ${bucket}/${filePath}:`, error)
            // Fallback to public URL
            const { data: publicData } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath)
            return publicData?.publicUrl || null
        }

        return data.signedUrl
    } catch (err) {
        console.error(`getSignedUrl error:`, err)
        return null
    }
}

/**
 * Get a public URL for a storage file (for public buckets).
 */
export function getPublicUrl(bucket: string, filePath: string): string | null {
    if (!filePath) return null
    const supabaseClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(filePath)
    return data?.publicUrl || null
}
