import { notFound } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { ClientReviewClient, type ClientReviewDeliverable, type ClientReview } from './client-review-client'

export const dynamic = 'force-dynamic'

export default async function ClientReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: token } = await params

  if (!token) notFound()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) notFound()
  const supabase = createSupabaseClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.rpc('get_client_review_page', {
    p_review_token: token,
  })
  if (error || !data) notFound()

  const payload = data as {
    client_name: string | null
    deliverable: ClientReviewDeliverable
    reviews: ClientReview[]
  }
  const { client_name: clientName, deliverable, reviews } = payload

  return (
    <div className="min-h-screen bg-surface-container-lowest py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {clientName || 'Client'} - Deliverable Review
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
