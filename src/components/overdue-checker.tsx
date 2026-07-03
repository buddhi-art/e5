'use client'

import { useEffect, useRef } from 'react'
import { updateOverdueInvoices } from '@/app/admin/invoices/actions'

export function OverdueChecker() {
    const hasChecked = useRef(false)

    useEffect(() => {
        // Fire once on mount to catch any invoices that became overdue
        // since the last server-side cron run (runs daily at 2 AM NPT).
        // This is a safety net, not the primary mechanism.
        if (!hasChecked.current) {
            hasChecked.current = true
            updateOverdueInvoices().catch(err => {
                console.error('Failed to update overdue invoices:', err)
            })
        }

        // Periodic refresh every 5 minutes as a fallback
        const interval = setInterval(() => {
            updateOverdueInvoices().catch(err => {
                console.error('Failed to update overdue invoices (interval):', err)
            })
        }, 5 * 60 * 1000)

        return () => clearInterval(interval)
    }, [])

    return null
}
