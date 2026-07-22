import { SupabaseClient } from '@supabase/supabase-js'

export async function verifyAdminOrFounder(supabase: SupabaseClient, userId: string) {
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, designation')
        .eq('id', userId)
        .single();

    // NOTE: the `user_role` enum is only ('admin', 'employee') — there is no
    // 'founder' role value. Founders are identified by designation = 'Founder'.
    return profile?.role === 'admin' || profile?.designation === 'Founder';
}