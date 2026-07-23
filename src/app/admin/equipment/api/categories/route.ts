/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import globalCache from '@/lib/cache'

export async function GET() {
    const cacheKey = 'equipment_categories'

    // Require an authenticated session before returning reference data
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cachedData = await globalCache.get(cacheKey)
    if (cachedData) {
        return NextResponse.json(cachedData)
    }

    // If not in RAM, fetch from Supabase, then save to RAM
    const { data } = await supabase.from('equipment_categories').select('name').order('name')
    const names = (data || []).map((c: any) => c.name)
    await globalCache.set(cacheKey, names)
    return NextResponse.json(names)
}
