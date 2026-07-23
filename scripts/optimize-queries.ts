#!/usr/bin/env ts-node
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Database Query Optimization Script
 *
 * Analyzes the codebase for inefficient database queries and suggests optimizations.
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

// Patterns to identify inefficient queries
const INEFFICIENT_PATTERNS = [
    { pattern: '\\.select\\(\\s*[\'"]\\*[\'"]\\s*\\)', message: 'Avoid SELECT * - specify only needed columns' },
    { pattern: '\\.select\\(\\s*\\)', message: 'Empty SELECT - specify columns explicitly' },
    { pattern: '\\.from\\([\'"][^\'"]+[\'"]\\)\\s*\\n\\s*\\.select\\(', message: 'SELECT after FROM without column specification' },
    { pattern: '\\.eq\\([\'"]deleted_at[\'"]\\s*,\\s*null\\)', message: 'Use .is(\'deleted_at\', null) for soft delete checks' },
    { pattern: '\\.not\\([\'"]deleted_at[\'"]\\s*,\\s*[\'"]is[\'"]\\s*,\\s*null\\)', message: 'Use .not(\'deleted_at\', \'is\', null) for active record checks' },
    { pattern: 'await\\s+supabase\\s*\\.\\s*from', message: 'Sequential queries - consider Promise.all for parallel execution' },
    { pattern: '\\.select\\([^\\)]*\\{.*count.*\\}[^\\)]*\\)', message: 'Count queries should use .select(\'id\', { count: \'exact\', head: true })' }
]

// Directories to scan
const DIRECTORIES = [
    'src/app/admin',
    'src/app/founder',
    'src/app/employee',
    'src/app/actions',
    'src/lib'
]

// Query optimization suggestions
const OPTIMIZATION_SUGGESTIONS: Record<string, string> = {
    'SELECT *': 'Specify only the columns you need. Example: .select(\'id,full_name,email\') instead of .select(\'*\')',
    'Empty SELECT': 'Always specify columns explicitly. Example: .select(\'id,title,status\')',
    'Soft delete': 'Use .is(\'deleted_at\', null) for better readability and performance',
    'Count queries': 'Use .select(\'id\', { count: \'exact\', head: true }) for efficient counting',
    'Sequential queries': 'Use Promise.all() to execute independent queries in parallel',
    'Missing indexes': 'Add appropriate indexes for frequently queried columns'
}

/**
 * Scan a file for inefficient query patterns
 */
function scanFile(filePath: string): Array<{ line: number, pattern: string, message: string, content: string, suggestion: string }> {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    const results: Array<{ line: number, pattern: string, message: string, content: string, suggestion: string }> = []

    INEFFICIENT_PATTERNS.forEach(({ pattern, message }) => {
        const regex = new RegExp(pattern, 'g')
        let match

        while ((match = regex.exec(content)) !== null) {
            const lineNumber = content.substring(0, match.index).split('\n').length
            const lineContent = lines[lineNumber - 1].trim()

            // Skip if this is a comment
            if (lineContent.includes('//') || lineContent.includes('*')) {
                continue
            }

            results.push({
                line: lineNumber,
                pattern: pattern,
                message: message,
                content: lineContent,
                suggestion: OPTIMIZATION_SUGGESTIONS[message] || 'Optimize this query'
            })
        }
    })

    return results
}

/**
 * Scan a directory for inefficient queries
 */
function scanDirectory(dirPath: string): Array<{ file: string, issues: Array<{ line: number, pattern: string, message: string, content: string, suggestion: string }> }> {
    const results: Array<{ file: string, issues: Array<{ line: number, pattern: string, message: string, content: string, suggestion: string }> }> = []
    const files = fs.readdirSync(dirPath)

    for (const file of files) {
        const fullPath = path.join(dirPath, file)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
            results.push(...scanDirectory(fullPath))
        } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
            const issues = scanFile(fullPath)
            if (issues.length > 0) {
                results.push({
                    file: path.relative(process.cwd(), fullPath),
                    issues
                })
            }
        }
    }

    return results
}

/**
 * Generate optimization report
 */
function generateReport(results: Array<{ file: string, issues: Array<{ line: number, pattern: string, message: string, content: string, suggestion: string }> }>) {
    console.log('=== Database Query Optimization Report ===\n')

    const totalFiles = results.length
    const totalIssues = results.reduce((sum, result) => sum + result.issues.length, 0)

    console.log(`Files scanned: ${totalFiles}`)
    console.log(`Total issues found: ${totalIssues}\n`)

    if (totalIssues === 0) {
        console.log('✅ No major query optimization opportunities found!')
        return
    }

    console.log('=== Files with optimization opportunities ===')

    results.forEach(result => {
        console.log(`\n📄 File: ${result.file}`)
        console.log(`   Issues: ${result.issues.length}`)

        result.issues.forEach(issue => {
            console.log(`\n   Line ${issue.line}: ${issue.message}`)
            console.log(`   > ${issue.content}`)
            console.log(`   ✅ Suggestion: ${issue.suggestion}`)
        })
    })

    console.log('\n=== Optimization Examples ===')

    console.log(`
Example 1: SELECT * optimization
----------------------------------------
// BEFORE (inefficient)
const { data, error } = await supabase
  .from('talents')
  .select('*')

// AFTER (optimized)
const { data, error } = await supabase
  .from('talents')
  .select('id,full_name,email,talent_type,rate_amount')
`)

    console.log(`
Example 2: Soft delete optimization
----------------------------------------
// BEFORE (less readable)
const { data, error } = await supabase
  .from('talents')
  .eq('deleted_at', null)

// AFTER (optimized)
const { data, error } = await supabase
  .from('talents')
  .is('deleted_at', null)
`)

    console.log(`
Example 3: Parallel queries
----------------------------------------
// BEFORE (sequential)
const { data: talents } = await supabase.from('talents').select('*')
const { data: projects } = await supabase.from('projects').select('*')

// AFTER (parallel)
const [talentsResult, projectsResult] = await Promise.all([
  supabase.from('talents').select('id,full_name,email'),
  supabase.from('projects').select('id,title,status')
])
`)

    console.log(`
Example 4: Count optimization
----------------------------------------
// BEFORE (inefficient)
const { count } = await supabase.from('talents').select('*', { count: 'exact' })

// AFTER (optimized)
const { count } = await supabase.from('talents').select('id', { count: 'exact', head: true })
`)

    console.log('\n=== Recommended Next Steps ===')
    console.log('1. Review the optimization suggestions above')
    console.log('2. Prioritize fixes based on query frequency and impact')
    console.log('3. Test optimized queries to ensure they return the same data')
    console.log('4. Consider adding database indexes for frequently queried columns')
    console.log('5. Monitor performance before and after optimizations')
}

/**
 * Run database analysis
 */
function runDatabaseAnalysis() {
    console.log('🔍 Running database query optimization analysis...\n')

    const allResults: Array<{ file: string, issues: Array<{ line: number, pattern: string, message: string, content: string, suggestion: string }> }> = []

    DIRECTORIES.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir)
        if (fs.existsSync(fullPath)) {
            allResults.push(...scanDirectory(fullPath))
        }
    })

    generateReport(allResults)
}

// Execute the script
runDatabaseAnalysis()