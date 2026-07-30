'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import 'server-only'
import { UuidParamSchema } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('Supabase client configuration is missing')
  return createSupabaseClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function submitClientReview(
  reviewToken: string,
  status: 'APPROVED' | 'REVISION_REQUESTED',
  feedback?: string
) {
  try {
    const parsedToken = UuidParamSchema.safeParse(reviewToken)
    if (!parsedToken.success) return { error: 'Invalid review link.' }
    if (status !== 'APPROVED' && status !== 'REVISION_REQUESTED') {
      return { error: 'Invalid review status.' }
    }

    const rateLimit = await checkRateLimit(`client-review:${parsedToken.data}`, 5, 60 * 60 * 1000)
    if (!rateLimit.success) return { error: 'Too many review submissions. Try again later.' }

    const trimmedFeedback = feedback?.trim() || null
    if (trimmedFeedback && trimmedFeedback.length > 5000) {
      return { error: 'Feedback must be 5,000 characters or fewer.' }
    }

    const supabase = getPublicClient()

    const { data: submission, error: submitErr } = await supabase.rpc('submit_client_review', {
      p_review_token: parsedToken.data,
      p_status: status,
      p_feedback: trimmedFeedback,
    })

    if (submitErr) return { error: submitErr.message }
    const del = Array.isArray(submission) ? submission[0] : submission
    if (!del) return { error: 'This review link is expired or no longer available.' }

    revalidatePath(`/client/review/${reviewToken}`)
    revalidatePath(`/admin/packages/${del.package_id}`)
    revalidatePath(`/founder/review-queue`)

    return { success: true }
  } catch (err: unknown) {
    return { error: (err instanceof Error ? err.message : String(err)) }
  }
}
