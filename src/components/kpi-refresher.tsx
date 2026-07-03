'use client'

import { useEffect, useRef } from 'react'
import { recomputeKpisAction } from '@/app/admin/employees/kpi-actions'

export function KpiRefresher() {
    const hasRefreshed = useRef(false)

    useEffect(() => {
        if (!hasRefreshed.current) {
            hasRefreshed.current = true
            recomputeKpisAction().catch(err => {
                console.error('Failed to recompute KPIs:', err)
            })
        }
    }, [])

    return null
}
