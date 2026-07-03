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

type ProjectStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold'

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'on_hold', label: 'On Hold' },
]

const STATUS_STYLES: Record<ProjectStatus, string> = {
    not_started: 'text-on-surface-variant bg-surface-container-high border-outline-variant',
    in_progress: 'text-m3-info bg-m3-info-subtle border-m3-info',
    completed: 'text-m3-success bg-m3-success-subtle border-m3-success',
    on_hold: 'text-m3-warning bg-m3-warning-subtle border-m3-warning',
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
                {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
