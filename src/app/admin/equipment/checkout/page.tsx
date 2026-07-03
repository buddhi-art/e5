import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CheckoutForm } from './checkout-form'

export default async function CheckoutEquipmentPage({ searchParams }: { searchParams: Promise<{ equipment_id?: string }> }) {
  const supabase = await createClient()
  const resolvedParams = await searchParams

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/employee/dashboard')

  // Fetch available equipment
  const { data: equipment } = await supabase
    .from('equipment')
    .select('id, name, serial_number, category')
    .eq('status', 'available')
    .is('deleted_at', null)
    .order('name')

  // Fetch employees
  const { data: employees } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('full_name')

  // Fetch active projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title')
    .not('status', 'eq', 'completed')
    .is('deleted_at', null)
    .order('title')

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/equipment" className="inline-flex items-center gap-2 text-sm text-outline hover:text-on-surface transition-colors -ml-2 px-2 py-1 rounded-md hover:bg-surface-container-high">
          <ArrowLeft className="w-4 h-4" />
          Back to Equipment
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Check Out Equipment</h1>
        <p className="text-sm text-outline">Assign gear to an employee or project.</p>
      </div>

      <div className="p-6 rounded-xl border border-outline-variant/50 bg-surface-container-lowest elevation-1 shape-large">
        <CheckoutForm 
          equipment={equipment || []} 
          employees={employees || []} 
          projects={projects || []}
          initialEquipmentId={resolvedParams.equipment_id}
        />
      </div>
    </div>
  )
}
