'use client'

/**
 * Kept as a stable layout slot while KPI recomputation runs in the scheduled
 * job. This avoids turning dashboard navigation into a write-heavy action.
 */
export function KpiRefresher() {
    // KPI recomputation is performed by the scheduled cron job. Loading an
    // admin page must remain a read operation for every employee record.
    return null
}
