import { cn } from '@/lib/utils'

const config: Record<string, { label: string; className: string }> = {
    completed: {
        label: 'Completed',
        className: 'bg-tertiary-container text-on-tertiary-container',
    },
    in_progress: {
        label: 'In Progress',
        className: 'bg-primary-container text-on-primary-container',
    },
    todo: {
        label: 'To Do',
        className: 'bg-surface-container-high text-on-surface-variant',
    },
}

export function StatusBadge({ status }: { status: string }) {
    const s = config[status] || {
        label: status.replace('_', ' '),
        className: 'bg-surface-container-high text-on-surface-variant',
    }
    return (
        <span
            className={cn(
                'text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap capitalize',
                s.className,
            )}
        >
            {s.label}
        </span>
    )
}
