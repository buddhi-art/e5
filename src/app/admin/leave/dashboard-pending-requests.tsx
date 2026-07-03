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
            <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 card-morph">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-m3-warning" />
                        Pending Leave Requests
                    </CardTitle>
                    <Badge variant="outline" className="text-m3-warning border-m3-warning">{requests.length} pending</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                    {requests.slice(0, 5).map((req, i) => (
                        <div
                            key={req.id}
                            className={`flex items-start gap-3 p-3 shape-medium border border-outline-variant/50 bg-surface-container card-morph morph-fade-in morph-delay-${Math.min(i + 1, 8)}`}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-on-surface text-sm">{req.profiles?.full_name}</span>
                                    <Badge variant="outline" className="text-[10px] h-5 capitalize">{req.leave_types?.name}</Badge>
                                </div>
                                <p className="text-xs text-outline mb-1">
                                    {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()} ({req.total_days} day{req.total_days > 1 ? 's' : ''})
                                </p>
                                {req.reason && (
                                    <p className="text-xs text-on-surface-variant line-clamp-2">{req.reason}</p>
                                )}
                            </div>
                            <div className="flex gap-1 flex-shrink-0 pt-0.5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleApprove(req.id)}
                                    disabled={isPending}
                                    className="h-7 w-7 p-0 btn-morph text-m3-success hover:bg-m3-success-subtle"
                                >
                                    <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openReject(req.id)}
                                    disabled={isPending}
                                    className="h-7 w-7 p-0 btn-morph text-m3-error hover:bg-m3-error-subtle"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {requests.length > 5 && (
                        <a href="/admin/leave/requests" className="block text-center text-sm text-primary hover:text-primary/80 hover:underline py-1">
                            View all {requests.length} pending requests
                        </a>
                    )}
                </CardContent>
            </Card>

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
                            <Button type="submit" disabled={isPending} className="btn-morph bg-destructive hover:bg-destructive/90 text-white">
                                Confirm Rejection
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
