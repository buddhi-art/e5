import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data } = await supabase.from('talent_types').select('name').order('name')
    const names = (data || []).map((c: any) => c.name)
    return NextResponse.json(names)
}
