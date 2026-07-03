'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { checkOutEquipment } from '../actions'

export function CheckoutForm({
  equipment,
  employees,
  projects,
  initialEquipmentId
}: {
  equipment: any[],
  employees: any[],
  projects: any[],
  initialEquipmentId?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [equipmentId, setEquipmentId] = useState(initialEquipmentId || '')
  const [checkedOutBy, setCheckedOutBy] = useState('')
  const [projectId, setProjectId] = useState('')
  const [expectedReturn, setExpectedReturn] = useState('')
  const [condition, setCondition] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!equipmentId || !checkedOutBy) {
      toast.error('Equipment and employee are required')
      return
    }

    startTransition(async () => {
      const result = await checkOutEquipment({
        equipment_id: equipmentId,
        checked_out_by: checkedOutBy,
        project_id: projectId || undefined,
        expected_return_at: expectedReturn ? new Date(expectedReturn).toISOString() : undefined,
        condition_at_checkout: condition || undefined,
        notes: notes || undefined
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Equipment checked out successfully')
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
            <SelectValue placeholder="Select equipment to check out">
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
        <label className="block text-sm font-medium text-on-surface">Assign To Employee *</label>
        <Select value={checkedOutBy} onValueChange={(v: string | null) => setCheckedOutBy(v || '')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select employee">
              {checkedOutBy ? employees.find(emp => emp.id === checkedOutBy)?.full_name : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {employees.map(emp => (
              <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-on-surface">Associated Project (Optional)</label>
        <Select value={projectId} onValueChange={(v: string | null) => setProjectId(v || '')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="No specific project">
              {projectId ? projects.find(proj => proj.id === projectId)?.title : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projects.map(proj => (
              <SelectItem key={proj.id} value={proj.id}>{proj.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-on-surface">Expected Return Date (Optional)</label>
        <Input type="date" value={expectedReturn} onChange={e => setExpectedReturn(e.target.value)} />
        {expectedReturn && new Date(expectedReturn) < new Date(new Date().setHours(0,0,0,0)) && (
          <p className="text-xs text-m3-error font-medium">Warning: The expected return date is in the past.</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-on-surface">Condition at Checkout</label>
        <Textarea placeholder="e.g. Minor scratches on lens body, fully functional" value={condition} onChange={e => setCondition(e.target.value)} />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-on-surface">Additional Notes</label>
        <Textarea placeholder="Any other notes for this checkout..." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Processing...' : 'Check Out Equipment'}
        </Button>
      </div>
    </form>
  )
}
