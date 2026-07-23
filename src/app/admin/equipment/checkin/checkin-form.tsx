/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { checkInEquipment } from '../actions'

export function CheckinForm({ 
  activeCheckouts,
  initialCheckoutId 
}: { 
  activeCheckouts: any[],
  initialCheckoutId?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [checkoutId, setCheckoutId] = useState(initialCheckoutId || '')
  const [condition, setCondition] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!checkoutId) {
      toast.error('Please select equipment to return')
      return
    }
    if (!condition) {
      toast.error('Condition report is required')
      return
    }

    startTransition(async () => {
      const result = await checkInEquipment({
        checkout_id: checkoutId,
        condition_at_checkin: condition,
        notes: notes || undefined
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Equipment checked in successfully')
        const checkout = activeCheckouts.find(c => c.id === checkoutId)
        router.push(checkout ? `/admin/equipment/${checkout.equipment_id}` : '/admin/equipment')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-on-surface">Equipment to Return *</label>
        <Select value={checkoutId} onValueChange={(v: string | null) => setCheckoutId(v || '')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select equipment..." />
          </SelectTrigger>
          <SelectContent>
            {activeCheckouts.map(checkout => (
              <SelectItem key={checkout.id} value={checkout.id}>
                {checkout.equipment?.name} {checkout.equipment?.serial_number ? `(${checkout.equipment.serial_number})` : ''}
                {' '}— {checkout.checked_out_by_profile?.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-on-surface">Condition at Check-in *</label>
        <Textarea 
          placeholder="e.g. Good condition, returned with all cables" 
          value={condition} 
          onChange={e => setCondition(e.target.value)} 
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-on-surface">Additional Notes</label>
        <Textarea 
          placeholder="Any other notes for this check-in..." 
          value={notes} 
          onChange={e => setNotes(e.target.value)} 
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Processing...' : 'Check In Equipment'}
        </Button>
      </div>
    </form>
  )
}
