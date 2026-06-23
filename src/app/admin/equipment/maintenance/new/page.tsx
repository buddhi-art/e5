import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MaintenanceForm } from './maintenance-form'

export default async function NewMaintenancePage({ searchParams }: { searchParams: Promise<{ equipment_id?: string }> }) {
  const supabase = await createClient()
  const resolvedParams = await searchParams

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/employee/dashboard')

  // Fetch equipment
  const { data: equipment } = await supabase
    .from('equipment')
    .select('id, name, serial_number')
    .is('deleted_at', null)
    .order('name')

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link href={resolvedParams.equipment_id ? `/admin/equipment/${resolvedParams.equipment_id}` : '/admin/equipment/maintenance'} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors -ml-2 px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Schedule Maintenance</h1>
        <p className="text-sm text-zinc-500">Log repairs, cleaning, or scheduled service for equipment.</p>
      </div>

      <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <MaintenanceForm 
          equipment={equipment || []}
          initialEquipmentId={resolvedParams.equipment_id}
        />
      </div>
    </div>
  )
}
