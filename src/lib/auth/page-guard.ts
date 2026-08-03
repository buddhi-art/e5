/**
 * Server-side page guards for protected route segments.
 *
 * These run inside async server components — the layer the proxy in
 * `src/lib/supabase/proxy.ts` explicitly defers real enforcement to, since it
 * reads the session from the cookie without verifying it. Row Level Security is
 * the final backstop; these guards make the redirect behaviour correct and
 * consistent instead of being duplicated inline in every page.
 */

import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { type Role, isAdminOrFounder, isFounder } from './roles'

export interface GuardedUser {
    id: string
    email: string
    role: Role
    designation: string | null
}

interface GuardResult {
    supabase: SupabaseClient
    user: GuardedUser
}

/**
 * Resolve the signed-in user plus their profile, or redirect to /login.
 *
 * Deleted accounts are treated as signed out.
 */
async function loadUser(): Promise<GuardResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, designation, deleted_at')
        .eq('id', user.id)
        .single()

    if (!profile || profile.deleted_at) redirect('/login')

    return {
        supabase,
        user: {
            id: user.id,
            email: user.email ?? '',
            role: (profile.role as Role) ?? 'employee',
            designation: profile.designation ?? null,
        },
    }
}

/**
 * Guard an /admin page. Admins and Founders are allowed through; everyone else
 * is sent to their own portal.
 *
 * Founders are identified by `designation === 'Founder'` — the `user_role` enum
 * is only ('admin', 'employee'), so a `role === 'founder'` check never matches.
 */
export async function requireAdminOrFounder(): Promise<GuardResult> {
    const result = await loadUser()
    const { role, designation } = result.user

    if (!isAdminOrFounder(role, designation)) redirect('/employee')

    return result
}

/**
 * Guard a /founder page. Founders only; admins are sent back to /admin.
 */
export async function requireFounder(): Promise<GuardResult> {
    const result = await loadUser()
    const { role, designation } = result.user

    if (!isFounder(designation)) redirect(role === 'admin' ? '/admin' : '/employee')

    return result
}
