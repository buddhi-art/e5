'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { approveLeave, rejectLeave } from '../actions'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export function AdminLeaveActions({ request }: { request: any }) {
  const [loading, setLoading] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectNotes, setRejectNotes] = useState('')

  if (request.status !== 'pending') {
    return (
      <span className="text-xs text-outline">
        Processed
      </span>
    )
  }

  async function handleApprove() {
    setLoading(true)
    const res = await approveLeave(request.id)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Leave request approved')
    }
    setLoading(false)
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await rejectLeave(request.id, rejectNotes)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Leave request rejected')
      setRejectOpen(false)
    }
    setLoading(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleApprove} disabled={loading} className="text-m3-success focus:text-m3-success focus:bg-m3-success-subtle">
            <Check className="w-4 h-4 mr-2" />
            Approve
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setRejectOpen(true)} disabled={loading} className="text-m3-error focus:text-m3-error focus:bg-m3-error-subtle">
            <X className="w-4 h-4 mr-2" />
            Reject
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md bg-surface-container-lowest text-on-surface border-outline-variant">
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReject} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface-variant">Rejection Reason</label>
              <Textarea
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                required
                className="bg-surface-container resize-none h-24"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="btn-morph bg-destructive hover:bg-destructive/90 text-white">
                Confirm Rejection
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
