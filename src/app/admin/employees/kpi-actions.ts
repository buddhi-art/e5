'use server'

import { createClient } from '@/lib/supabase/server'
import { captureActionError } from '@/lib/action-error'

export async function getEmployeeKpiBreakdown(employeeId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const { data, error } = await supabase.rpc('get_employee_kpi_breakdown', {
            p_employee_id: employeeId,
            p_window_days: 30,
        })

        if (error) {
            return { error: await captureActionError('getEmployeeKpiBreakdown:rpc', error) }
        }

        return { data }
    } catch (err: unknown) {
        return { error: await captureActionError('getEmployeeKpiBreakdown', err) }
    }
}

