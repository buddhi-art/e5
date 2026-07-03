import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from './server'

/**
 * Maximum upload size for storage files (5MB)
 */
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024

/**
 * Allowed MIME types for equipment photos
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/**
 * Allowed MIME types for receipt uploads
 */
export const ALLOWED_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

/**
 * Validate file MIME type and size. Returns null if valid, error string if invalid.
 */
export function validateFileUpload(
    file: { name: string; size: number; type: string },
    allowedTypes: string[],
    maxSize: number = MAX_UPLOAD_SIZE,
): string | null {
    if (!allowedTypes.includes(file.type)) {
        return `File type "${file.type}" is not allowed. Allowed: ${allowedTypes.join(', ')}`
    }
    if (file.size > maxSize) {
        return `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: ${(maxSize / 1024 / 1024).toFixed(0)}MB`
    }
    if (file.size === 0) {
        return 'File is empty'
    }
    return null
}

/**
 * Generate a safe, unique filename for storage uploads.
 * Uses UUID-like format to prevent path traversal and name collisions.
 */
export function generateStorageFilename(originalName: string): string {
    const ext = originalName.split('.').pop()?.toLowerCase() || 'bin'
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 10)
    return `${timestamp}-${random}.${ext}`
}

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
 * NOTE: Only use this for PUBLIC buckets. Private bucket files must use getSignedUrl.
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
