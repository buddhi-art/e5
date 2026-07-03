'use client'

import { useState, useCallback } from 'react'
import { KanbanColumn } from './kanban-column'
import { moveKanbanCard } from './actions'
import type { KanbanTask, KanbanColumn as KanbanColumnType } from '@/types/kanban'
import { toast } from 'sonner'

const COLUMN_ORDER: KanbanColumnType[] = ['pending', 'in_progress', 'completed', 'blocked']

export function KanbanClient({ initialTasks }: { initialTasks: KanbanTask[] }) {
    const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks)
    const [draggedTask, setDraggedTask] = useState<KanbanTask | null>(null)
    const [moving, setMoving] = useState<string | null>(null)

    const tasksByStatus = (status: string) =>
        tasks.filter((t) => t.status === status)

    const handleDragStart = useCallback((e: React.DragEvent, task: KanbanTask) => {
        setDraggedTask(task)
        e.dataTransfer.setData('text/plain', task.id)
        e.dataTransfer.effectAllowed = 'move'

        // Slight delay for visual feedback
        const target = e.currentTarget as HTMLElement
        setTimeout(() => target.classList.add('opacity-30'), 0)
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }, [])

    const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault()
        const taskId = e.dataTransfer.getData('text/plain')
        if (!taskId || !draggedTask || draggedTask.status === newStatus) {
            setDraggedTask(null)
            return
        }

        const cardType = newStatus as KanbanColumnType

        // Optimistic update
        setTasks((prev) =>
            prev.map((t) =>
                t.id === taskId ? { ...t, status: cardType } : t
            )
        )
        setMoving(taskId)

        try {
            const result = await moveKanbanCard(taskId, cardType, draggedTask.updated_at)

            if (result.error === 'conflict') {
                // Reconcile: revert to server state
                setTasks((prev) =>
                    prev.map((t) =>
                        t.id === taskId
                            ? { ...t, status: result.serverState?.status as KanbanColumnType || t.status }
                            : t
                    )
                )
                toast.error('Task was modified by another user. Refreshed state.')
            } else if (result.error) {
                // Revert on error
                setTasks((prev) =>
                    prev.map((t) =>
                        t.id === taskId ? { ...t, status: draggedTask.status } : t
                    )
                )
                toast.error(result.error)
            } else {
                toast.success('Task moved')
            }
        } catch {
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === taskId ? { ...t, status: draggedTask.status } : t
                )
            )
            toast.error('Failed to move task')
        } finally {
            setMoving(null)
            setDraggedTask(null)
            // Clean up opacity
            document.querySelectorAll('.opacity-30').forEach((el) => el.classList.remove('opacity-30'))
        }
    }, [draggedTask])

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-premium">
            {COLUMN_ORDER.map((status) => (
                <KanbanColumn
                    key={status}
                    status={status}
                    tasks={tasksByStatus(status)}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                />
            ))}
        </div>
    )
}
