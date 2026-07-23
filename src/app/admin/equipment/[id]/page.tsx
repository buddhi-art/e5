/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, PenTool, ClipboardCheck, ArrowRightLeft, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { EquipmentPhoto } from './equipment-photo'
import { EquipmentDetailActions } from './equipment-detail-actions'

export default async function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const resolvedParams = await params

  // Verify access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/employee/dashboard')

  // Fetch equipment
  const { data: equipment, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (error || !equipment) {
    return <div className="p-6 text-outline">Equipment not found.</div>
  }

  // Fetch checkouts
  const { data: checkouts } = await supabase
    .from('equipment_checkouts')
    .select(`
      *,
      checked_out_by_profile:profiles!equipment_checkouts_checked_out_by_fkey(full_name),
      projects(title)
    `)
    .eq('equipment_id', resolvedParams.id)
    .order('checked_out_at', { ascending: false })

  // Fetch maintenance
  const { data: maintenance } = await supabase
    .from('equipment_maintenance')
    .select('*')
    .eq('equipment_id', resolvedParams.id)
    .order('scheduled_date', { ascending: false })

  const currentCheckout = equipment.status === 'checked_out' ? checkouts?.find(c => !c.checked_in_at) : null
  const currentMaintenance = equipment.status === 'maintenance' ? maintenance?.find(m => m.status === 'in_progress' || m.status === 'scheduled') : null

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/admin/equipment" className="inline-flex items-center gap-2 text-sm text-outline hover:text-on-surface transition-colors -ml-2 px-2 py-1 rounded-md hover:bg-surface-container-high">
          <ArrowLeft className="w-4 h-4" />
          Back to Equipment
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {equipment.status === 'available' && (
            <Button render={<Link href={`/admin/equipment/checkout?equipment_id=${equipment.id}`} />} variant="outline">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Check Out
            </Button>
          )}
          {equipment.status === 'checked_out' && (
            <Button render={<Link href={`/admin/equipment/checkin?equipment_id=${equipment.id}`} />} variant="outline">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Check In
            </Button>
          )}
          <Button render={<Link href={`/admin/equipment/maintenance/new?equipment_id=${equipment.id}`} />} variant="outline">
            <PenTool className="w-4 h-4 mr-2" />
            Maintenance
          </Button>
          <Button render={<Link href={`/admin/equipment/${equipment.id}/edit`} />}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <EquipmentDetailActions equipmentId={equipment.id} equipmentName={equipment.name} isArchived={!!equipment.deleted_at} />
        </div>
      </div>

      {equipment.status === 'checked_out' && currentCheckout && (
        <div className="bg-m3-warning-subtle border border-m3-warning rounded-lg p-4 flex items-start gap-3 text-m3-warning">
          <ArrowRightLeft className="w-5 h-5 mt-0.5" />
          <div>
            <h4 className="font-semibold">Currently Checked Out</h4>
            <p className="text-sm mt-1">
              Checked out by <strong>{(currentCheckout.checked_out_by_profile as any)?.full_name}</strong> since {format(new Date(currentCheckout.checked_out_at), 'MMM d, yyyy')}.
              {currentCheckout.expected_return_at && ` Expected return: ${format(new Date(currentCheckout.expected_return_at), 'MMM d, yyyy')}.`}
              {currentCheckout.projects?.title && ` Project: ${currentCheckout.projects.title}.`}
            </p>
          </div>
        </div>
      )}

      {equipment.status === 'maintenance' && currentMaintenance && (
        <div className="bg-m3-error-subtle border border-m3-error rounded-lg p-4 flex items-start gap-3 text-m3-error">
          <PenTool className="w-5 h-5 mt-0.5" />
          <div>
            <h4 className="font-semibold">In Maintenance</h4>
            <p className="text-sm mt-1">
              Scheduled for {format(new Date(currentMaintenance.scheduled_date), 'MMM d, yyyy')}.
              {currentMaintenance.vendor && ` Vendor: ${currentMaintenance.vendor}.`}
              <br />Reason: {currentMaintenance.description}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="rounded-xl border border-outline-variant/50 overflow-hidden bg-surface-container-lowest elevation-1">
            <div className="aspect-square bg-surface-container-high flex items-center justify-center relative">
              {equipment.image_url ? (
                <EquipmentPhoto imageUrl={equipment.image_url} name={equipment.name} />
              ) : (
                <ImageIcon className="w-12 h-12 text-outline" />
              )}
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Badge variant={
                  equipment.status === 'available' ? 'default' :
                    equipment.status === 'checked_out' ? 'secondary' :
                      equipment.status === 'maintenance' ? 'destructive' : 'outline'
                } className="capitalize mb-2">
                  {equipment.status.replace('_', ' ')}
                </Badge>
                <h1 className="text-xl font-bold text-on-surface">{equipment.name}</h1>
                <p className="text-sm text-outline">{equipment.brand} {equipment.model}</p>
              </div>

              <div className="space-y-2 text-sm pt-4 border-t border-outline-variant">
                <div className="flex justify-between">
                  <span className="text-outline">Category</span>
                  <span className="font-medium">{equipment.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Serial Number</span>
                  <span className="font-medium">{equipment.serial_number || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Location</span>
                  <span className="font-medium">{equipment.location || '-'}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm pt-4 border-t border-outline-variant">
                <div className="flex justify-between">
                  <span className="text-outline">Purchase Date</span>
                  <span className="font-medium">{equipment.purchase_date ? format(new Date(equipment.purchase_date), 'MMM d, yyyy') : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Purchase Price</span>
                  <span className="font-medium">{equipment.purchase_price ? `NPR ${equipment.purchase_price.toLocaleString()}` : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Current Value</span>
                  <span className="font-medium">{equipment.current_value ? `NPR ${equipment.current_value.toLocaleString()}` : '-'}</span>
                </div>
              </div>

              {equipment.notes && (
                <div className="pt-4 border-t border-outline-variant text-sm">
                  <span className="text-outline block mb-1">Notes</span>
                  <p className="whitespace-pre-wrap">{equipment.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest elevation-1 overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant">
              <h3 className="font-semibold text-on-surface">Checkout History</h3>
            </div>
            <div className="divide-y divide-outline-variant max-h-[400px] overflow-y-auto">
              {!checkouts || checkouts.length === 0 ? (
                <div className="p-6 text-center text-outline text-sm">No checkout history.</div>
              ) : (
                checkouts.map((c: any) => (
                  <div key={c.id} className="p-4 sm:p-6 text-sm flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-on-surface mb-1">
                        {c.checked_out_by_profile?.full_name}
                      </p>
                      <p className="text-outline mb-2">
                        {format(new Date(c.checked_out_at), 'MMM d, yyyy')} - {c.checked_in_at ? format(new Date(c.checked_in_at), 'MMM d, yyyy') : 'Present'}
                      </p>
                      {c.projects?.title && (
                        <p className="text-on-surface-variant">
                          Project: <span className="font-medium">{c.projects.title}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      {c.condition_at_checkout && (
                        <div>
                          <span className="text-xs text-outline uppercase tracking-wider">Out Condition</span>
                          <p className="text-on-surface">{c.condition_at_checkout}</p>
                        </div>
                      )}
                      {c.condition_at_checkin && (
                        <div>
                          <span className="text-xs text-outline uppercase tracking-wider">In Condition</span>
                          <p className="text-on-surface">{c.condition_at_checkin}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest elevation-1 overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-semibold text-on-surface">Maintenance History</h3>
              <Link href={`/admin/equipment/maintenance`} className="text-xs text-primary hover:underline">View All</Link>
            </div>
            <div className="divide-y divide-outline-variant max-h-[300px] overflow-y-auto">
              {!maintenance || maintenance.length === 0 ? (
                <div className="p-6 text-center text-outline text-sm">No maintenance history.</div>
              ) : (
                maintenance.map((m: any) => (
                  <div key={m.id} className="p-4 sm:p-6 text-sm flex justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-on-surface">{m.description}</p>
                        <Badge variant="outline" className="text-[10px] uppercase h-5">{m.status}</Badge>
                      </div>
                      <p className="text-outline">
                        {format(new Date(m.scheduled_date), 'MMM d, yyyy')}
                        {m.vendor && ` • ${m.vendor}`}
                        {m.cost && ` • NPR ${m.cost.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
