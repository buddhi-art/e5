import Link from 'next/link'
import { ArrowLeft, PenTool } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MaintenanceList } from './maintenance-list'
import { requireAdminOrFounder } from '@/lib/auth/page-guard'

export default async function MaintenancePage() {
  const { supabase } = await requireAdminOrFounder()


  // Fetch maintenance records
  const { data: records, error } = await supabase
    .from('equipment_maintenance')
    .select(`
      *,
      equipment(name, serial_number, category)
    `)
    .order('scheduled_date', { ascending: false })

  if (error) {
    console.error('Error fetching maintenance records:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Maintenance Log</h1>
          <p className="text-sm text-outline">Track equipment repairs and servicing.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button render={<Link href="/admin/equipment" />} variant="outline" nativeButton={false}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Equipment
          </Button>
          <Button render={<Link href="/admin/equipment/maintenance/new" />} nativeButton={false}>
            <PenTool className="w-4 h-4 mr-2" />
            Schedule Maintenance
          </Button>
        </div>
      </div>

      <MaintenanceList initialRecords={records || []} />
    </div>
  )
}
