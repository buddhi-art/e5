import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
    try {
        // Require CRON_SECRET to prevent unauthorized access to this endpoint
        const authHeader = request.headers.get('authorization')
        const expectedSecret = process.env.CRON_SECRET
        if (!expectedSecret) {
            console.error('CRON_SECRET environment variable is not set')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }
        if (authHeader !== `Bearer ${expectedSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabaseAdmin.rpc('mark_overdue_invoices')

        if (error) {
            console.error('CRON mark_overdue_invoices error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ updated: data })
    } catch (err: any) {
        console.error('CRON handler error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
