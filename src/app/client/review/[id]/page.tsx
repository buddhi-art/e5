import { notFound } from 'next/navigation'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { ClientReviewClient } from './client-review-client'

export const dynamic = 'force-dynamic'

export default async function ClientReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: token } = await params

  if (!token) notFound()

  // Use the admin service role client because clients are NOT logged in
  const supabase = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: reviewLink, error: linkError } = await supabase
    .from('client_reviews')
    .select('token, package_deliverable_id, is_active')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (linkError || !reviewLink) {
    notFound()
  }

  const { data: deliverable, error: deliverableError } = await supabase
    .from('package_deliverables')
    .select(`
      id, title, status, drive_link, revision_history,
      packages ( package_number, title, clients ( company_name ) )
    `)
    .eq('id', reviewLink.package_deliverable_id)
    .single()

  if (deliverableError || !deliverable) notFound()

  const packageRelation = Array.isArray(deliverable.packages)
    ? deliverable.packages[0]
    : deliverable.packages
  const clientRelation = Array.isArray(packageRelation?.clients)
    ? packageRelation.clients[0]
    : packageRelation?.clients

  // Fetch existing client reviews for this deliverable
  const { data: reviews } = await supabase
    .from('client_reviews')
    .select('id, status, feedback, created_at')
    .eq('package_deliverable_id', reviewLink.package_deliverable_id)
    .not('status', 'is', null)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-surface-container-lowest py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {clientRelation?.company_name || 'Client'} - Deliverable Review
          </h1>
          <p className="text-on-surface-variant mt-2 text-lg">
            {deliverable.title}
          </p>
        </div>

        <ClientReviewClient reviewToken={token} deliverable={deliverable} reviews={reviews || []} />
      </div>
    </div>
  )
}
