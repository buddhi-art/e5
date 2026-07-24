import { createClient } from '@/lib/supabase/server'
import { getPendingFounderReviews } from '@/app/admin/packages/actions'
import { ReviewQueueClient } from '@/components/founder/review-queue-client'

export default async function FounderReviewQueuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const pendingReviews = await getPendingFounderReviews()

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Founder Quality Assurance & Review Queue</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Review submitted package deliverables, approve completed work, or request revisions with specific feedback.
        </p>
      </div>

      <ReviewQueueClient initialReviews={pendingReviews} currentUserId={user.id} />
    </div>
  )
}
