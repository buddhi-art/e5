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
      <span className="text-xs text-zinc-500">
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
          <DropdownMenuItem onClick={handleApprove} disabled={loading} className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950/50">
            <Check className="w-4 h-4 mr-2" />
            Approve
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setRejectOpen(true)} disabled={loading} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
            <X className="w-4 h-4 mr-2" />
            Reject
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReject} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Rejection Reason</label>
              <Textarea 
                value={rejectNotes} 
                onChange={e => setRejectNotes(e.target.value)} 
                placeholder="Explain why this request is being rejected..."
                required
                className="bg-zinc-50 dark:bg-zinc-900 resize-none h-24"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-red-500 hover:bg-red-600 text-white">
                Confirm Rejection
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
