export interface KpiBreakdown {
    total_score: number
    attendance: {
        score: number
        max: number
        records: number
        weighted_pct: number
    }
    task_completion: {
        score: number
        max: number
        completed: number
        total: number
    }
    punctuality: {
        score: number
        max: number
        on_time: number
        completed_with_deadline: number
    }
    snapshot_history: {
        period: string
        score: number
        computed_at: string
    }[]
}

export interface KpiSnapshot {
    id: string
    employee_id: string
    period: string
    score: number
    breakdown: KpiBreakdown | null
    computed_at: string
}
