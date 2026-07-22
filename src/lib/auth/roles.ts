/**
 * Centralized Role and Permission System
 *
 * Defines all roles, permissions, and authorization utilities
 * for the E5 Chronicles application.
 */

// Role definitions
export type Role = 'admin' | 'employee' | 'founder'

// Special designation for founders (not a role in the enum)
export const FOUNDER_DESIGNATION = 'Founder'

// Permission definitions
export type Permission =
    // User management
    | 'users:read'
    | 'users:create'
    | 'users:update'
    | 'users:delete'
    | 'users:archive'
    | 'users:restore'

    // Talent management
    | 'talents:read'
    | 'talents:create'
    | 'talents:update'
    | 'talents:delete'
    | 'talents:book'

    // Equipment management
    | 'equipment:read'
    | 'equipment:create'
    | 'equipment:update'
    | 'equipment:delete'
    | 'equipment:checkout'
    | 'equipment:checkin'
    | 'equipment:maintain'

    // Project management
    | 'projects:read'
    | 'projects:create'
    | 'projects:update'
    | 'projects:delete'

    // Task management
    | 'tasks:read'
    | 'tasks:create'
    | 'tasks:update'
    | 'tasks:delete'
    | 'tasks:assign'

    // Invoice management
    | 'invoices:read'
    | 'invoices:create'
    | 'invoices:update'
    | 'invoices:delete'
    | 'invoices:send'
    | 'invoices:mark_paid'

    // Expense management
    | 'expenses:read'
    | 'expenses:create'
    | 'expenses:update'
    | 'expenses:delete'
    | 'expenses:approve'

    // Leave management
    | 'leave:read'
    | 'leave:request'
    | 'leave:approve'
    | 'leave:cancel'

    // Attendance management
    | 'attendance:read'
    | 'attendance:checkin'
    | 'attendance:checkout'

    // KPI management
    | 'kpi:read'
    | 'kpi:recompute'

    // System management
    | 'system:audit'
    | 'system:settings'

// Role to permission mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    admin: [
        'users:read', 'users:create', 'users:update', 'users:archive', 'users:restore',
        'talents:read', 'talents:create', 'talents:update', 'talents:delete', 'talents:book',
        'equipment:read', 'equipment:create', 'equipment:update', 'equipment:delete', 'equipment:checkout', 'equipment:checkin', 'equipment:maintain',
        'projects:read', 'projects:create', 'projects:update', 'projects:delete',
        'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete', 'tasks:assign',
        'invoices:read', 'invoices:create', 'invoices:update', 'invoices:delete', 'invoices:send', 'invoices:mark_paid',
        'expenses:read', 'expenses:create', 'expenses:update', 'expenses:delete', 'expenses:approve',
        'leave:read', 'leave:approve',
        'attendance:read',
        'kpi:read', 'kpi:recompute',
        'system:audit'
    ],
    employee: [
        'users:read', // Self only
        'talents:read',
        'equipment:read', 'equipment:checkout', // Self only
        'projects:read',
        'tasks:read', 'tasks:update', // Self assigned only
        'invoices:read',
        'expenses:read', 'expenses:create',
        'leave:read', 'leave:request', 'leave:cancel',
        'attendance:read', 'attendance:checkin', 'attendance:checkout',
        'kpi:read' // Self only
    ],
    founder: [] // Founders get all permissions via special designation
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role].includes(permission)
}

/**
 * Check if a user is a founder (by designation)
 */
export function isFounder(designation: string | null): boolean {
    return designation === FOUNDER_DESIGNATION
}

/**
 * Check if a user has admin or founder privileges
 */
export function isAdminOrFounder(role: Role, designation: string | null): boolean {
    return role === 'admin' || isFounder(designation)
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(role: Role, designation: string | null): Permission[] {
    if (isFounder(designation)) {
        // Founders get all permissions
        return Object.values(ROLE_PERMISSIONS).flat()
    }
    return ROLE_PERMISSIONS[role] || []
}

/**
 * Route protection configuration
 */
export const PROTECTED_ROUTES = {
    admin: [
        '/admin',
        '/admin/employees',
        '/admin/talents',
        '/admin/equipment',
        '/admin/projects',
        '/admin/tasks',
        '/admin/invoices',
        '/admin/expenses',
        '/admin/leave',
        '/admin/attendance',
        '/admin/calendar'
    ],
    founder: [
        '/founder',
        '/founder/employees',
        '/founder/finances',
        '/founder/resources'
    ],
    employee: [
        '/employee',
        '/employee/profile',
        '/employee/tasks',
        '/employee/leave',
        '/employee/attendance',
        '/employee/expenses',
        '/employee/equipment'
    ]
}

/**
 * Check if a route is protected and requires specific access
 */
export function isProtectedRoute(path: string, requiredRole: Role): boolean {
    const normalizedPath = path.replace(/\/$/, '') // Remove trailing slash

    if (requiredRole === 'admin') {
        return PROTECTED_ROUTES.admin.some(route =>
            normalizedPath === route || normalizedPath.startsWith(route + '/')
        )
    }

    if (requiredRole === 'founder') {
        return PROTECTED_ROUTES.founder.some(route =>
            normalizedPath === route || normalizedPath.startsWith(route + '/')
        )
    }

    if (requiredRole === 'employee') {
        return PROTECTED_ROUTES.employee.some(route =>
            normalizedPath === route || normalizedPath.startsWith(route + '/')
        )
    }

    return false
}