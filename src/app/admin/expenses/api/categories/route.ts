import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import globalCache from '@/lib/cache'

export async function GET() {
    const cacheKey = 'expense_categories'
    const cachedData = globalCache.get<string[]>(cacheKey)

    // If it's in the phone's RAM, return it instantly!
    if (cachedData) {
        return NextResponse.json(cachedData)
    }

    // If not in RAM, fetch from Supabase, then save to RAM
    const supabase = await createClient()
    const { data } = await supabase.from('expense_categories').select('name').order('name')
    const names = (data || []).map((c: any) => c.name)
    globalCache.set(cacheKey, names)
    return NextResponse.json(names)
}
