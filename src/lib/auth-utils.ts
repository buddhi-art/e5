import { SupabaseClient } from '@supabase/supabase-js'
import { type Role, isAdminOrFounder } from '@/lib/auth/roles'

/**
 * Verify a user has admin or founder privileges, given an existing client.
 *
 * Used by server actions, which already hold a Supabase client and the user id.
 * For page-level protection use the guards in `@/lib/auth/page-guard`.
 *
 * The founder rule itself lives in `@/lib/auth/roles` — see `isAdminOrFounder`.
 */
export async function verifyAdminOrFounder(supabase: SupabaseClient, userId: string) {
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, designation')
        .eq('id', userId)
        .single();

    if (!profile) return false

    return isAdminOrFounder((profile.role as Role) ?? 'employee', profile.designation ?? null);
}
