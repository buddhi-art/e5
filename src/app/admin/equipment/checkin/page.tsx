import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CheckinForm } from './checkin-form'

export default async function CheckinEquipmentPage({ searchParams }: { searchParams: Promise<{ equipment_id?: string }> }) {
  const supabase = await createClient()
  const resolvedParams = await searchParams

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/employee/dashboard')

  // Fetch currently checked out equipment
  const { data: checkouts } = await supabase
    .from('equipment_checkouts')
    .select(`
      id, 
      equipment_id,
      equipment(name, serial_number),
      checked_out_by_profile:profiles!equipment_checkouts_checked_out_by_fkey(full_name)
    `)
    .is('checked_in_at', null)
    .order('checked_out_at', { ascending: true })

  // Find the specific checkout ID if an equipment_id was passed
  let initialCheckoutId = undefined
  if (resolvedParams.equipment_id && checkouts) {
    const match = checkouts.find(c => c.equipment_id === resolvedParams.equipment_id)
    if (match) initialCheckoutId = match.id
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/equipment" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors -ml-2 px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <ArrowLeft className="w-4 h-4" />
          Back to Equipment
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Check In Equipment</h1>
        <p className="text-sm text-zinc-500">Record returned gear and note its condition.</p>
      </div>

      <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <CheckinForm 
          activeCheckouts={checkouts || []} 
          initialCheckoutId={initialCheckoutId}
        />
      </div>
    </div>
  )
}
