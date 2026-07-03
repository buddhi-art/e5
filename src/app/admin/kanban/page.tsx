import { KanbanClient } from './kanban-client'
import { getKanbanTasks } from './actions'
import type { KanbanTask } from '@/types/kanban'

export const revalidate = 60 // ISR: refresh tasks every minute

export default async function KanbanPage() {
    const tasks = await getKanbanTasks()

    // Map to KanbanTask interface
    const kanbanTasks: KanbanTask[] = tasks.map((t) => ({
        id: t.id,
        title: t.title,
        project_name: t.project_name,
        project_id: t.project_id,
        assigned_to: t.assigned_to,
        assigned_name: t.assigned_name,
        phase: t.phase,
        deadline: t.deadline,
        status: t.status,
        dragId: t.dragId,
        updated_at: t.updated_at,
    }))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Kanban Board</h1>
                    <p className="text-sm text-on-surface-variant mt-1">
                        Drag and drop tasks between columns to update their status
                    </p>
                </div>
            </div>

            <KanbanClient initialTasks={kanbanTasks} />
        </div>
    )
}
