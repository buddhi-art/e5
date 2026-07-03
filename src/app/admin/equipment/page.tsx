import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EquipmentList } from './equipment-list'

export default async function EquipmentPage() {
  const supabase = await createClient()

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/employee/dashboard')

  // Fetch equipment
  const { data: equipment, error } = await supabase
    .from('equipment')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching equipment:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 morph-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Equipment & Assets</h1>
          <p className="text-sm text-outline">Manage all studio gear, rentals, and checkouts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button render={<Link href="/admin/equipment/new" />} nativeButton={false}>
            <Plus className="w-4 h-4 mr-2" />
            Add Equipment
          </Button>
        </div>
      </div>

      <EquipmentList initialEquipment={equipment || []} />
    </div>
  )
}
