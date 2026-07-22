#!/usr/bin/env node
/**
 * Auth System Migration Script
 *
 * This script helps migrate old auth patterns to the new centralized auth system.
 * It identifies functions that need to be updated and provides migration guidance.
 */

import fs from 'fs'
import path from 'path'

// Patterns to identify old auth patterns
const OLD_AUTH_PATTERNS = [
    'await supabase.auth.getUser()',
    'verifyAdminOrFounder(supabase',
    'if (!user) return { error: \'Unauthorized\' }',
    'if (!isAuthorized) return { error: \'Permission denied.\' }'
]

// Patterns for new auth patterns
const NEW_AUTH_PATTERNS = [
    'withAuth(',
    'verifyPermission(',
    'logAuditEvent(',
    'getCurrentUser()'
]

// Directories to scan
const DIRECTORIES = [
    'src/app/admin',
    'src/app/founder',
    'src/app/employee',
    'src/app/actions',
    'src/lib'
]

/**
 * Scan a file for old auth patterns
 */
function scanFile(filePath: string): { file: string, oldPatterns: string[], newPatterns: string[] } {
    const content = fs.readFileSync(filePath, 'utf-8')
    const oldPatternsFound: string[] = []
    const newPatternsFound: string[] = []

    OLD_AUTH_PATTERNS.forEach(pattern => {
        if (content.includes(pattern)) {
            oldPatternsFound.push(pattern)
        }
    })

    NEW_AUTH_PATTERNS.forEach(pattern => {
        if (content.includes(pattern)) {
            newPatternsFound.push(pattern)
        }
    })

    return {
        file: path.relative(process.cwd(), filePath),
        oldPatterns: oldPatternsFound,
        newPatterns: newPatternsFound
    }
}

/**
 * Scan a directory for files with old auth patterns
 */
function scanDirectory(dirPath: string): Array<{ file: string, oldPatterns: string[], newPatterns: string[] }> {
    const results: Array<{ file: string, oldPatterns: string[], newPatterns: string[] }> = []
    const files = fs.readdirSync(dirPath)

    for (const file of files) {
        const fullPath = path.join(dirPath, file)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
            results.push(...scanDirectory(fullPath))
        } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
            const result = scanFile(fullPath)
            if (result.oldPatterns.length > 0 || result.newPatterns.length > 0) {
                results.push(result)
            }
        }
    }

    return results
}

/**
 * Generate migration report
 */
function generateReport(results: Array<{ file: string, oldPatterns: string[], newPatterns: string[] }>) {
    console.log('=== Auth System Migration Report ===\n')

    const filesWithOldAuth = results.filter(r => r.oldPatterns.length > 0)
    const filesWithNewAuth = results.filter(r => r.newPatterns.length > 0)

    console.log(`Files with old auth patterns: ${filesWithOldAuth.length}`)
    console.log(`Files with new auth patterns: ${filesWithNewAuth.length}\n`)

    if (filesWithOldAuth.length > 0) {
        console.log('=== Files needing migration ===')
        filesWithOldAuth.forEach(result => {
            console.log(`\nFile: ${result.file}`)
            console.log('Old patterns found:')
            result.oldPatterns.forEach(pattern => {
                console.log(`  - ${pattern}`)
            })
            console.log('Migration steps:')
            console.log('  1. Import { withAuth, logAuditEvent } from \'@/lib/auth/auth-utils\'')
            console.log('  2. Convert function to use withAuth wrapper')
            console.log('  3. Add permission checks if needed')
            console.log('  4. Add audit logging for important actions')
            console.log('  5. Remove old auth checks')
        })
    }

    if (filesWithNewAuth.length > 0) {
        console.log('\n=== Files already using new auth ===')
        filesWithNewAuth.forEach(result => {
            console.log(`\nFile: ${result.file}`)
            console.log('New patterns found:')
            result.newPatterns.forEach(pattern => {
                console.log(`  - ${pattern}`)
            })
        })
    }

    console.log('\n=== Migration Examples ===')
    console.log(`
Example 1: Basic migration
----------------------------------------
// OLD
export async function createTalent(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }
    // ... function body
}

// NEW
export const createTalent = withAuth(async (user, formData: FormData) => {
    // ... function body
}, 'talents:create')
`)

    console.log(`
Example 2: With audit logging
----------------------------------------
// NEW
export const createTalent = withAuth(async (user, formData: FormData) => {
    // ... function body

    await logAuditEvent(
        'CREATE_TALENT',
        'talent',
        talent.id,
        { full_name: data.full_name }
    )
    // ...
}, 'talents:create')
`)

    console.log('\n=== Migration Complete ===')
}

// Run the migration scanner
function runMigrationScan() {
    const allResults: Array<{ file: string, oldPatterns: string[], newPatterns: string[] }> = []

    DIRECTORIES.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir)
        if (fs.existsSync(fullPath)) {
            allResults.push(...scanDirectory(fullPath))
        }
    })

    generateReport(allResults)
}

// Execute the script
runMigrationScan()