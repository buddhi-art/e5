/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { scheduleMaintenance } from '../../actions'

export function MaintenanceForm({
  equipment,
  initialEquipmentId
}: {
  equipment: any[],
  initialEquipmentId?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [equipmentId, setEquipmentId] = useState(initialEquipmentId || '')
  const [description, setDescription] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [vendor, setVendor] = useState('')
  const [vendorPhone, setVendorPhone] = useState('')
  const [vendorLocation, setVendorLocation] = useState('')
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!equipmentId || !description || !scheduledDate) {
      toast.error('Equipment, description, and scheduled date are required')
      return
    }

    startTransition(async () => {
      const result = await scheduleMaintenance({
        equipment_id: equipmentId,
        description,
        scheduled_date: scheduledDate,
        vendor: vendor || undefined,
        vendor_phone: vendorPhone || undefined,
        vendor_location: vendorLocation || undefined,
        cost: cost ? Number(cost) : undefined,
        notes: notes || undefined,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Maintenance scheduled successfully')
        router.push(`/admin/equipment/${equipmentId}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-on-surface">Equipment *</label>
        <Select value={equipmentId} onValueChange={(v: string | null) => setEquipmentId(v || '')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select equipment...">
              {equipmentId ? equipment.find(eq => eq.id === equipmentId)?.name : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {equipment.map(eq => (
              <SelectItem key={eq.id} value={eq.id}>
                {eq.name} {eq.serial_number ? `(${eq.serial_number})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-on-surface">Description / Reason *</label>
        <Input
          placeholder="e.g. Sensor cleaning, repair broken mount"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-on-surface">Scheduled Date *</label>
          <Input
            type="date"
            value={scheduledDate}
            onChange={e => setScheduledDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-on-surface">Estimated/Actual Cost (NPR)</label>
          <Input
            type="number"
            step="0.01"
            value={cost}
            onChange={e => setCost(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-on-surface">Vendor / Service Center</label>
        <Input
          placeholder="e.g. Sony Service Center, New Road"
          value={vendor}
          onChange={e => setVendor(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-on-surface">Vendor Phone</label>
          <Input
            type="tel"
            placeholder="e.g. 9800000000"
            value={vendorPhone}
            onChange={e => setVendorPhone(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-on-surface">Vendor Location</label>
          <Input
            placeholder="e.g. Kathmandu"
            value={vendorLocation}
            onChange={e => setVendorLocation(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-on-surface">Additional Notes</label>
        <Textarea
          placeholder="Any other notes..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Processing...' : 'Schedule Maintenance'}
        </Button>
      </div>
    </form>
  )
}
