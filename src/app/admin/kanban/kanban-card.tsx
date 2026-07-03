'use client'

import { cn } from '@/lib/utils'
import type { KanbanTask } from '@/types/kanban'
import { CalendarDays, User, AlertTriangle } from 'lucide-react'

const statusColors: Record<string, string> = {
    pending: 'border-m3-warning',
    in_progress: 'border-m3-info',
    completed: 'border-m3-success',
    blocked: 'border-m3-error',
}

interface KanbanCardProps {
    task: KanbanTask
    onDragStart: (e: React.DragEvent, task: KanbanTask) => void
}

export function KanbanCard({ task, onDragStart }: KanbanCardProps) {
    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task)}
            className={cn(
                'group bg-surface-container-lowest rounded-xl p-3.5 cursor-grab active:cursor-grabbing',
                'ring-1 ring-outline-variant/40 hover:ring-primary/30 hover:shadow-md',
                'border-l-4 transition-all duration-200',
                statusColors[task.status] || 'border-l-outline-variant',
                'morph-scale-in hover:-translate-y-0.5'
            )}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 flex-1">
                    {task.title.replace(/^E5_Task_\d+\s*-\s*/, '')}
                </h4>
                {isOverdue && (
                    <AlertTriangle className="w-3.5 h-3.5 text-m3-error shrink-0 mt-0.5" />
                )}
            </div>

            <p className="text-xs text-on-surface-variant mb-2 line-clamp-1">
                {task.project_name}
            </p>

            <div className="flex items-center justify-between gap-2 mt-auto">
                {task.assigned_name ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-primary-container text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                            {task.assigned_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] text-on-surface-variant truncate">{task.assigned_name}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-outline">
                        <User className="w-3 h-3" />
                        <span className="text-[11px]">Unassigned</span>
                    </div>
                )}

                {task.deadline && (
                    <div className={cn(
                        'flex items-center gap-1 text-[11px] shrink-0',
                        isOverdue ? 'text-m3-error font-medium' : 'text-on-surface-variant'
                    )}>
                        <CalendarDays className="w-3 h-3" />
                        <span>{new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                )}
            </div>

            {task.phase && (
                <div className="mt-2">
                    <span className="text-[10px] font-medium text-outline bg-surface-container-high px-1.5 py-0.5 rounded-md">
                        {task.phase}
                    </span>
                </div>
            )}
        </div>
    )
}
