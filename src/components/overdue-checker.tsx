'use client'

import { useEffect, useRef } from 'react'
import { updateOverdueInvoices } from '@/app/admin/invoices/actions'

export function OverdueChecker() {
    const hasChecked = useRef(false)

    useEffect(() => {
        if (!hasChecked.current) {
            hasChecked.current = true
            updateOverdueInvoices().catch(err => {
                console.error('Failed to update overdue invoices:', err)
            })
        }
    }, [])

    return null
}
