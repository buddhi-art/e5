'use client'

import { useState } from 'react'
import { markAttendance } from './actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'

export function AttendanceForm() {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await markAttendance(formData)
    
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Attendance marked successfully')
    }
    setLoading(false)
  }

  return (
    <form id="attendance-form" action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="status" className="text-zinc-700 dark:text-zinc-300">Status for Today</Label>
        <Select name="status" required defaultValue="present">
          <SelectTrigger className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white h-12 text-lg">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
            <SelectItem value="present" className="text-green-400">Present</SelectItem>
            <SelectItem value="late" className="text-orange-400">Late</SelectItem>
            <SelectItem value="half-day" className="text-blue-400">Half-day</SelectItem>
            <SelectItem value="absent" className="text-red-400">Absent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" size="lg" className="w-full bg-white text-black hover:bg-zinc-200 text-lg h-12" disabled={loading}>
        {loading ? 'Submitting...' : 'Mark Attendance'}
      </Button>
    </form>
  )
}
