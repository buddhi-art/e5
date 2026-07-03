export type KanbanColumn = 'pending' | 'in_progress' | 'completed' | 'blocked'

export interface KanbanTask {
    id: string
    title: string
    project_name: string
    project_id: string
    assigned_to: string | null
    assigned_name: string | null
    phase: string
    deadline: string | null
    status: KanbanColumn
    dragId: string
    updated_at: string
}
