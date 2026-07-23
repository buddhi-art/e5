'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function recomputeKpisAction() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        // The RPC itself verifies admin/founder internally via is_admin_or_founder()
        const { error } = await supabase.rpc('recompute_all_kpis')

        if (error) {
            console.error('KPI recompute error:', error)
            return { error: error.message }
        }

        revalidatePath('/admin/employees')
        return { success: true }
    } catch (err: unknown) {
        console.error('Error in recomputeKpisAction:', err)
        return { error: (err instanceof Error ? err.message : String(err)) || 'An unexpected error occurred' }
    }
}

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
            console.error('KPI breakdown error:', error)
            return { error: error.message }
        }

        return { data }
    } catch (err: unknown) {
        console.error('Error in getEmployeeKpiBreakdown:', err)
        return { error: (err instanceof Error ? err.message : String(err)) || 'An unexpected error occurred' }
    }
}

export async function getEmployeeKpiScore(employeeId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const { data, error } = await supabase.rpc('calculate_employee_kpi', {
            p_employee_id: employeeId,
            p_window_days: 30,
        })

        if (error) {
            console.error('KPI score error:', error)
            return { error: error.message }
        }

        return { data: Number(data) }
    } catch (err: unknown) {
        console.error('Error in getEmployeeKpiScore:', err)
        return { error: (err instanceof Error ? err.message : String(err)) || 'An unexpected error occurred' }
    }
}
