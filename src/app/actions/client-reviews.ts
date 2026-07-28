'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { UuidParamSchema } from '@/lib/validations'

// Use admin client since clients are not authenticated
function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
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

    const trimmedFeedback = feedback?.trim() || null
    if (trimmedFeedback && trimmedFeedback.length > 5000) {
      return { error: 'Feedback must be 5,000 characters or fewer.' }
    }

    const supabase = getAdminClient()

    const { data: submission, error: submitErr } = await supabase.rpc('submit_client_review', {
      p_review_token: parsedToken.data,
      p_status: status,
      p_feedback: trimmedFeedback,
    })

    if (submitErr) return { error: submitErr.message }
    const del = Array.isArray(submission) ? submission[0] : submission
    if (!del) return { error: 'This review link is expired or no longer available.' }

    // Optionally, insert a notification to the admin/founder/employee
    // Since we're using admin client, we can query profiles
    const { data: staff } = await supabase.from('profiles').select('id').in('role', ['admin', 'founder'])
    if (staff) {
      const notifications = staff.map(s => ({
        user_id: s.id,
        title: `Client Review: ${status}`,
        message: `The client has ${status === 'APPROVED' ? 'approved' : 'requested a revision for'} deliverable "${del.title}".`,
        link_url: `/admin/packages/${del.package_id}`,
        is_read: false
      }))
      await supabase.from('notifications').insert(notifications)
    }

    revalidatePath(`/client/review/${reviewToken}`)
    revalidatePath(`/admin/packages/${del.package_id}`)
    revalidatePath(`/founder/review-queue`)

    return { success: true }
  } catch (err: unknown) {
    return { error: (err instanceof Error ? err.message : String(err)) }
  }
}
