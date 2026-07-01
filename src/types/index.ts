export interface TaskSummary {
    id: string
    title: string
    status: string
    created_at: string
    profiles: { full_name: string } | null
    projects: { title: string; clients: { company_name: string } | null } | null
}

export interface AttendanceEntry {
    id: string
    created_at: string
    status: string
    profiles: { full_name: string } | null
}
