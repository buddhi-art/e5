'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Check, X, CalendarDays } from 'lucide-react'
import { approveLeave, rejectLeave } from './actions'
import { toast } from 'sonner'

interface PendingRequest {
    id: string
    user_id: string
    leave_type_id: string
    start_date: string
    end_date: string
    total_days: number
    reason: string
    leave_types: { name: string } | null
    profiles: { full_name: string; email: string } | null
}

export function DashboardPendingRequests({ requests }: { requests: PendingRequest[] }) {
    const [isPending, startTransition] = useTransition()
    const [rejectOpen, setRejectOpen] = useState(false)
    const [rejectId, setRejectId] = useState<string | null>(null)
    const [rejectNotes, setRejectNotes] = useState('')

    function handleApprove(id: string) {
        startTransition(async () => {
            const res = await approveLeave(id)
            if (res?.error) toast.error(res.error)
            else toast.success('Leave request approved')
        })
    }

    function openReject(id: string) {
        setRejectId(id)
        setRejectNotes('')
        setRejectOpen(true)
    }

    function handleReject(e: React.FormEvent) {
        e.preventDefault()
        if (!rejectId) return
        startTransition(async () => {
            const res = await rejectLeave(rejectId, rejectNotes)
            if (res?.error) toast.error(res.error)
            else {
                toast.success('Leave request rejected')
                setRejectOpen(false)
                setRejectId(null)
            }
        })
    }

    if (requests.length === 0) return null

    return (
        <>
            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-amber-500" />
                        Pending Leave Requests
                    </CardTitle>
                    <Badge variant="outline" className="text-amber-600 border-amber-300">{requests.length} pending</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                    {requests.slice(0, 5).map((req) => (
                        <div key={req.id} className="flex items-start gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-zinc-900 dark:text-white text-sm">{req.profiles?.full_name}</span>
                                    <Badge variant="outline" className="text-[10px] h-5 capitalize">{req.leave_types?.name}</Badge>
                                </div>
                                <p className="text-xs text-zinc-500 mb-1">
                                    {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()} ({req.total_days} day{req.total_days > 1 ? 's' : ''})
                                </p>
                                {req.reason && (
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{req.reason}</p>
                                )}
                            </div>
                            <div className="flex gap-1 flex-shrink-0 pt-0.5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleApprove(req.id)}
                                    disabled={isPending}
                                    className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                                >
                                    <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openReject(req.id)}
                                    disabled={isPending}
                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {requests.length > 5 && (
                        <a href="/admin/leave/requests" className="block text-center text-sm text-sky-500 hover:text-sky-600 hover:underline py-1">
                            View all {requests.length} pending requests
                        </a>
                    )}
                </CardContent>
            </Card>

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
                            <Button type="submit" disabled={isPending} className="bg-red-500 hover:bg-red-600 text-white">
                                Confirm Rejection
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
