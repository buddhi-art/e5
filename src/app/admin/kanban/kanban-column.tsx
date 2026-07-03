'use client'

import { cn } from '@/lib/utils'
import type { KanbanTask } from '@/types/kanban'
import { KanbanCard } from './kanban-card'

const columnConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'bg-m3-warning-subtle text-m3-warning border-m3-warning' },
    in_progress: { label: 'In Progress', color: 'bg-m3-info-subtle text-m3-info border-m3-info' },
    completed: { label: 'Completed', color: 'bg-m3-success-subtle text-m3-success border-m3-success' },
    blocked: { label: 'Blocked', color: 'bg-m3-error-subtle text-m3-error border-m3-error' },
}

interface KanbanColumnProps {
    status: string
    tasks: KanbanTask[]
    onDragStart: (e: React.DragEvent, task: KanbanTask) => void
    onDrop: (e: React.DragEvent, status: string) => void
    onDragOver: (e: React.DragEvent) => void
}

export function KanbanColumn({ status, tasks, onDragStart, onDrop, onDragOver }: KanbanColumnProps) {
    const cfg = columnConfig[status] || { label: status, color: 'bg-surface-container-high text-on-surface-variant' }

    return (
        <div
            onDrop={(e) => onDrop(e, status)}
            onDragOver={onDragOver}
            className="flex flex-col w-full min-w-[260px] max-w-[320px] shrink-0"
        >
            {/* Column header */}
            <div className={cn(
                'flex items-center justify-between px-3 py-2 rounded-t-xl border',
                cfg.color.split(' ').slice(2).join(' ')
            )}>
                <div className="flex items-center gap-2">
                    <div className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'pending' ? 'bg-m3-warning' :
                            status === 'in_progress' ? 'bg-m3-info' :
                                status === 'completed' ? 'bg-m3-success' :
                                    'bg-m3-error'
                    )} />
                    <h3 className="text-sm font-semibold">{cfg.label}</h3>
                </div>
                <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full tabular-nums',
                    cfg.color.split(' ').slice(0, 2).join(' ')
                )}>
                    {tasks.length}
                </span>
            </div>

            {/* Cards container */}
            <div className={cn(
                'flex-1 p-2 space-y-2 rounded-b-xl border border-t-0 min-h-[200px]',
                'bg-surface-container-low/50 transition-colors duration-200',
                cfg.color.split(' ').slice(2).join(' ')
            )}>
                {tasks.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-xs text-outline">
                        <p>Drop tasks here</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <KanbanCard key={task.id} task={task} onDragStart={onDragStart} />
                    ))
                )}
            </div>
        </div>
    )
}
