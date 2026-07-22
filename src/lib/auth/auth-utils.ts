/**
 * Centralized Authentication and Authorization Utilities
 *
 * Provides consistent auth checks, permission verification, and audit logging
 * across the entire application.
 */

import { createClient } from '@/lib/supabase/server'
import { Role, isAdminOrFounder, isFounder, hasPermission, Permission, getUserPermissions } from './roles'
import { revalidatePath } from 'next/cache'

/**
 * Authenticated user data
 */
export interface AuthUser {
    id: string
    email: string
    role: Role
    designation: string | null
    fullName: string | null
    permissions: Permission[]
}

/**
 * Auth context for server components and actions
 */
export interface AuthContext {
    user: AuthUser | null
    isAuthenticated: boolean
    isAdmin: boolean
    isFounder: boolean
    hasPermission: (permission: Permission) => boolean
}

/**
 * Get the current authenticated user with full profile data
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        console.error('Auth error:', authError)
        return null
    }

    // Get the full profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, designation, full_name, deleted_at')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        console.error('Profile error:', profileError)
        return null
    }

    // Check if user is deleted
    if (profile.deleted_at) {
        console.error('User account is deleted')
        return null
    }

    // Determine role (handle founder designation)
    const role: Role = profile.role as Role || 'employee'
    const permissions = getUserPermissions(role, profile.designation)

    return {
        id: user.id,
        email: user.email || '',
        role,
        designation: profile.designation,
        fullName: profile.full_name,
        permissions
    }
}

/**
 * Verify if the current user has admin or founder privileges
 */
export async function verifyAdminOrFounderAccess(): Promise<boolean> {
    const user = await getCurrentUser()
    if (!user) return false

    return isAdminOrFounder(user.role, user.designation)
}

/**
 * Verify if the current user has a specific permission
 */
export async function verifyPermission(permission: Permission): Promise<boolean> {
    const user = await getCurrentUser()
    if (!user) return false

    // Founders have all permissions
    if (isFounder(user.designation)) return true

    return hasPermission(user.role, permission)
}

/**
 * Create an authenticated context for server components
 */
export async function createAuthContext(): Promise<AuthContext> {
    const user = await getCurrentUser()

    return {
        user,
        isAuthenticated: !!user,
        isAdmin: user ? user.role === 'admin' : false,
        isFounder: user ? isFounder(user.designation) : false,
        hasPermission: (permission: Permission) => {
            if (!user) return false
            if (isFounder(user.designation)) return true
            return hasPermission(user.role, permission)
        }
    }
}

/**
 * Middleware for protecting server actions
 */
export function withAuth<Args extends any[], Result>(
    action: (user: AuthUser, ...args: Args) => Promise<Result>,
    requiredPermission?: Permission
) {
    return async (...args: Args): Promise<Result> => {
        const user = await getCurrentUser()
        if (!user) {
            throw new Error('Unauthorized')
        }

        // Check permission if required
        if (requiredPermission && !user.permissions.includes(requiredPermission)) {
            throw new Error('Permission denied')
        }

        return action(user, ...args)
    }
}

/**
 * Middleware for protecting routes
 */
export async function protectRoute(path: string, redirectTo: string = '/login'): Promise<void> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        const response = new Response(null, {
            status: 302,
            headers: {
                Location: redirectTo
            }
        })
        throw response
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, designation, deleted_at')
        .eq('id', user.id)
        .single()

    if (!profile || profile.deleted_at) {
        const response = new Response(null, {
            status: 302,
            headers: {
                Location: redirectTo
            }
        })
        throw response
    }

    // Route-based access control
    const role: Role = profile.role as Role || 'employee'

    // Founders can access admin routes
    if (isFounder(profile.designation)) {
        if (path.startsWith('/employee')) {
            const response = new Response(null, {
                status: 302,
                headers: {
                    Location: '/founder'
                }
            })
            throw response
        }
        return
    }

    // Admins can access admin routes
    if (role === 'admin') {
        if (path.startsWith('/employee') || path.startsWith('/founder')) {
            const response = new Response(null, {
                status: 302,
                headers: {
                    Location: '/admin'
                }
            })
            throw response
        }
        return
    }

    // Employees can only access employee routes
    if (role === 'employee') {
        if (path.startsWith('/admin') || path.startsWith('/founder')) {
            const response = new Response(null, {
                status: 302,
                headers: {
                    Location: '/employee'
                }
            })
            throw response
        }
        return
    }

    // Default deny
    const response = new Response(null, {
        status: 302,
        headers: {
            Location: redirectTo
        }
    })
    throw response
}

/**
 * Audit logging utility
 */
export async function logAuditEvent(
    action: string,
    entityType: string,
    entityId: string,
    metadata: Record<string, any> = {},
    userId?: string
) {
    const supabase = await createClient()

    // Get current user if not provided
    let currentUserId = userId
    if (!currentUserId) {
        const user = await getCurrentUser()
        currentUserId = user?.id
    }

    try {
        await supabase.from('audit_logs').insert({
            user_id: currentUserId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            metadata,
            ip_address: null, // Could be added from request context
            user_agent: null // Could be added from request context
        })
    } catch (error) {
        console.error('Failed to log audit event:', error)
    }
}

/**
 * Check if user can access a specific resource
 */
export async function canAccessResource(
    resourceType: string,
    resourceId: string,
    requiredPermission: Permission
): Promise<boolean> {
    const user = await getCurrentUser()
    if (!user) return false

    // Founders can access everything
    if (isFounder(user.designation)) return true

    // Check basic permission
    if (!hasPermission(user.role, requiredPermission)) {
        return false
    }

    // For employee-specific resources, verify ownership
    if (user.role === 'employee') {
        switch (resourceType) {
            case 'task':
                return await verifyTaskOwnership(resourceId, user.id)
            case 'expense':
                return await verifyExpenseOwnership(resourceId, user.id)
            case 'equipment_checkout':
                return await verifyEquipmentOwnership(resourceId, user.id)
            case 'leave_request':
                return await verifyLeaveOwnership(resourceId, user.id)
            default:
                return true
        }
    }

    return true
}

/**
 * Verify task ownership
 */
async function verifyTaskOwnership(taskId: string, userId: string): Promise<boolean> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('tasks')
        .select('assigned_to')
        .eq('id', taskId)
        .single()

    if (error || !data) return false
    return data.assigned_to === userId
}

/**
 * Verify expense ownership
 */
async function verifyExpenseOwnership(expenseId: string, userId: string): Promise<boolean> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('expenses')
        .select('submitted_by')
        .eq('id', expenseId)
        .single()

    if (error || !data) return false
    return data.submitted_by === userId
}

/**
 * Verify equipment checkout ownership
 */
async function verifyEquipmentOwnership(checkoutId: string, userId: string): Promise<boolean> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('equipment_checkouts')
        .select('employee_id')
        .eq('id', checkoutId)
        .single()

    if (error || !data) return false
    return data.employee_id === userId
}

/**
 * Verify leave request ownership
 */
async function verifyLeaveOwnership(leaveId: string, userId: string): Promise<boolean> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('leave_requests')
        .select('user_id')
        .eq('id', leaveId)
        .single()

    if (error || !data) return false
    return data.user_id === userId
}

/**
 * Get the appropriate portal path for the current user
 */
export async function getUserPortalPath(): Promise<string> {
    const user = await getCurrentUser()
    if (!user) return '/login'

    if (isFounder(user.designation)) {
        return '/founder'
    }

    if (user.role === 'admin') {
        return '/admin'
    }

    return '/employee'
}

/**
 * Verify if a user can perform an action on a specific entity
 */
export async function verifyEntityAccess(
    entityType: string,
    entityId: string,
    action: Permission
): Promise<boolean> {
    const user = await getCurrentUser()
    if (!user) return false

    // Founders can do everything
    if (isFounder(user.designation)) return true

    // Check basic permission
    if (!hasPermission(user.role, action)) {
        return false
    }

    // For employee-specific actions, verify ownership
    if (user.role === 'employee') {
        switch (entityType) {
            case 'task':
                return action.startsWith('tasks:') && await verifyTaskOwnership(entityId, user.id)
            case 'expense':
                return action.startsWith('expenses:') && await verifyExpenseOwnership(entityId, user.id)
            case 'equipment_checkout':
                return action.startsWith('equipment:') && await verifyEquipmentOwnership(entityId, user.id)
            case 'leave_request':
                return action.startsWith('leave:') && await verifyLeaveOwnership(entityId, user.id)
            default:
                return true
        }
    }

    return true
}