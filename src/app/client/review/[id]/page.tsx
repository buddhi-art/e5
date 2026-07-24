import { notFound } from 'next/navigation'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { ClientReviewClient } from './client-review-client'

export const dynamic = 'force-dynamic'

export default async function ClientReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  if (!id) notFound()

  // Use the admin service role client because clients are NOT logged in
  const supabase = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Actually, we'll need to fetch the deliverable by ID (UUID).
  const { data: deliverable, error } = await supabase
    .from('package_deliverables')
    .select(`
      *,
      packages ( package_number, title, clients ( company_name ) )
    `)
    .eq('id', id)
    .single()

  if (error || !deliverable) {
    notFound()
  }

  // Fetch existing client reviews for this deliverable
  const { data: reviews } = await supabase
    .from('client_reviews')
    .select('*')
    .eq('deliverable_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-surface-container-lowest py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {deliverable.packages?.clients?.company_name || 'Client'} - Deliverable Review
          </h1>
          <p className="text-on-surface-variant mt-2 text-lg">
            {deliverable.title}
          </p>
        </div>

        <ClientReviewClient deliverable={deliverable} reviews={reviews || []} />
      </div>
    </div>
  )
}
