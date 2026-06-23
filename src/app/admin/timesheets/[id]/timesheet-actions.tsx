'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveTimesheet, rejectTimesheet } from '../actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CheckCircle2, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function AdminTimesheetActions({ timesheetId }: { timesheetId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')

  async function handleApprove() {
    setLoading(true)
    const res = await approveTimesheet(timesheetId)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Timesheet approved')
      router.push('/admin/timesheets')
    }
    setLoading(false)
  }

  async function handleReject() {
    if (!reason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    
    setLoading(true)
    const res = await rejectTimesheet(timesheetId, reason)
    if (res?.error) {
      toast.error(res.error)
      setLoading(false)
    } else {
      toast.success('Timesheet rejected')
      setRejectOpen(false)
      router.push('/admin/timesheets')
    }
  }

  return (
    <>
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
          onClick={() => setRejectOpen(true)}
          disabled={loading}
        >
          <XCircle className="w-4 h-4 mr-2" />
          Reject
        </Button>
        <Button 
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
          onClick={handleApprove}
          disabled={loading}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {loading ? 'Processing...' : 'Approve Timesheet'}
        </Button>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Timesheet</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this timesheet. The employee will need to make corrections and resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Missing task on Tuesday, hours seem too high on Friday..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading}>
              {loading ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
