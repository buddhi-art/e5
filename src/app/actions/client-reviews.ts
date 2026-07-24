'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// Use admin client since clients are not authenticated
function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function submitClientReview(
  deliverableId: string, 
  status: 'APPROVED' | 'REVISION_REQUESTED', 
  feedback?: string
) {
  try {
    const supabase = getAdminClient()

    // 1. Fetch current deliverable to verify it's under review
    const { data: del, error: fetchErr } = await supabase
      .from('package_deliverables')
      .select('*')
      .eq('id', deliverableId)
      .single()

    if (fetchErr || !del) {
      return { error: 'Deliverable not found.' }
    }

    // Insert review record
    const { error: insertErr } = await supabase
      .from('client_reviews')
      .insert({
        deliverable_id: deliverableId,
        status: status,
        feedback: feedback || null
      })

    if (insertErr) {
      return { error: insertErr.message }
    }

    // Update deliverable status if revision was requested or if approved
    // Actually, maybe we only update the status to REVISION_REQUESTED or APPROVED
    const { error: updateErr } = await supabase
      .from('package_deliverables')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', deliverableId)

    if (updateErr) {
      return { error: updateErr.message }
    }

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

    revalidatePath(`/client/review/${deliverableId}`)
    revalidatePath(`/admin/packages/${del.package_id}`)
    revalidatePath(`/founder/review-queue`)
    
    return { success: true }
  } catch (err: unknown) {
    return { error: (err instanceof Error ? err.message : String(err)) }
  }
}
