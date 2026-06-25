'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { requestLeave } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export function RequestLeaveForm({ availableTypes }: { availableTypes: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const res = await requestLeave(formData)

    if (res?.error) {
      toast.error(res.error)
      setLoading(false)
    } else {
      toast.success('Leave requested successfully')
      router.push('/employee/leave')
    }
  }

  // Calculate generic working days (excluding weekends, ignores holidays on client side preview)
  let predictedDays = 0
  if (startDate && endDate) {
    const s = new Date(startDate)
    const e = new Date(endDate)
    if (s <= e) {
      let current = new Date(s)
      while (current <= e) {
        if (current.getDay() !== 0 && current.getDay() !== 6) {
          predictedDays++
        }
        current.setDate(current.getDate() + 1)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {availableTypes.length > 0 ? (
        <div className="space-y-2">
          <Label>Leave Type</Label>
          <Select name="leave_type_id" required>
            <SelectTrigger className="bg-zinc-50 dark:bg-zinc-800/50">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({t.remaining_days} days remaining)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="p-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg text-center">
          <p className="text-amber-700 dark:text-amber-400 mb-3">
            No leave types available. Your leave balance may not have been set up yet.
          </p>
          <Link href="/employee/leave">
            <Button variant="outline" className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400">
              <Plus className="w-4 h-4 mr-2" />
              Back to Leave Page
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input
            name="start_date"
            type="date"
            required
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="bg-zinc-50 dark:bg-zinc-800/50 [color-scheme:light] dark:[color-scheme:dark]"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input
            name="end_date"
            type="date"
            required
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="bg-zinc-50 dark:bg-zinc-800/50 [color-scheme:light] dark:[color-scheme:dark]"
            min={startDate || new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {predictedDays > 0 && (
        <div className="p-3 bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 rounded-lg text-sm">
          You are requesting approximately <strong>{predictedDays} working days</strong>.
          <span className="block mt-1 opacity-80 text-xs">This excludes weekends, but may be adjusted if there are public holidays.</span>
        </div>
      )}

      <div className="space-y-2">
        <Label>Reason</Label>
        <Textarea
          name="reason"
          required
          placeholder="Please provide details for your leave request..."
          className="bg-zinc-50 dark:bg-zinc-800/50 h-32 resize-none"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button render={<Link href="/employee/leave" />} variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading || availableTypes.length === 0} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white">
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
    </form>
  )
}
