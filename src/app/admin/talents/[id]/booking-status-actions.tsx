'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateBookingStatus } from '../actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type BookingStatus = 'proposed' | 'confirmed' | 'completed' | 'cancelled'

const STATUS_FLOW: { from: BookingStatus[]; label: string; next: BookingStatus; variant: 'default' | 'destructive' | 'secondary' }[] = [
    { from: ['proposed', 'confirmed'], label: 'Mark Completed', next: 'completed', variant: 'default' },
    { from: ['confirmed', 'proposed'], label: 'Cancel Booking', next: 'cancelled', variant: 'destructive' },
    { from: ['proposed'], label: 'Confirm Booking', next: 'confirmed', variant: 'default' },
]

export function BookingStatusActions({ bookingId, currentStatus }: { bookingId: string; currentStatus: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const availableActions = STATUS_FLOW.filter(act => act.from.includes(currentStatus as BookingStatus))

    async function handleStatusChange(newStatus: string) {
        const label = availableActions.find(a => a.next === newStatus)?.label || newStatus
        if (!confirm(`Are you sure you want to ${label.toLowerCase()}?`)) return

        setLoading(true)
        const result = await updateBookingStatus(bookingId, newStatus)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`Booking ${newStatus}`)
            router.refresh()
        }
        setLoading(false)
    }

    if (availableActions.length === 0) return null

    return (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {availableActions.map(action => (
                <Button
                    key={action.next}
                    size="sm"
                    variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                    className={action.variant === 'default' ? 'bg-m3-success hover:bg-m3-success text-white text-xs h-7' : 'text-xs h-7'}
                    onClick={() => handleStatusChange(action.next)}
                    disabled={loading}
                >
                    {action.label}
                </Button>
            ))}
        </div>
    )
}
