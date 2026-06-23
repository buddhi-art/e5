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
    not_started: 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700',
    in_progress: 'text-blue-400 bg-blue-400/10 border-blue-500/20',
    completed: 'text-green-400 bg-green-400/10 border-green-500/20',
    on_hold: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
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
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
                {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
