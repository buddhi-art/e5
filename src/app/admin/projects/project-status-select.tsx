'use client'

import { useState } from 'react'
import { updateProjectStatus } from './actions'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
    PROJECT_STATUSES,
    PROJECT_STATUS_LABELS,
    type ProjectStatus,
} from '@/lib/constants/statuses'

const STATUS_STYLES: Record<ProjectStatus, string> = {
    not_started: 'text-on-surface-variant bg-surface-container-high border-outline-variant',
    in_progress: 'text-m3-info bg-m3-info-subtle border-m3-info',
    on_hold: 'text-m3-warning bg-m3-warning-subtle border-m3-warning',
    completed: 'text-m3-success bg-m3-success-subtle border-m3-success',
    cancelled: 'text-destructive bg-destructive/20 border-destructive',
}

export function ProjectStatusSelect({ projectId, currentStatus }: { projectId: string; currentStatus: string }) {
    const [status, setStatus] = useState(currentStatus)
    const [updating, setUpdating] = useState(false)

    async function handleStatusChange(value: string | null) {
        if (!value) return
        setUpdating(true)
        const result = await updateProjectStatus(projectId, value as ProjectStatus)
        setUpdating(false)

        if (result?.error) {
            toast.error(result.error)
            return
        }

        setStatus(value)
        toast.success(`Status updated to ${value.replace('_', ' ')}`)
    }

    return (
        <Select value={status} onValueChange={handleStatusChange} disabled={updating}>
            <SelectTrigger className={`w-[140px] h-7 text-xs font-medium border ${STATUS_STYLES[status as ProjectStatus] || STATUS_STYLES.not_started}`}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-container-lowest border-outline-variant text-on-surface">
                {PROJECT_STATUSES.map(s => (
                    <SelectItem key={s} value={s} className="text-xs">
                        {PROJECT_STATUS_LABELS[s]}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
