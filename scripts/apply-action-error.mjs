#!/usr/bin/env node
/**
 * One-off codemod: replace catch-block `console.error(ctx, err)` + `return { error }`
 * with the shared `captureActionError` helper so errors reach Sentry.
 *
 * Only rewrites the exact two-line pattern:
 *     console.error(<ctxArg>, <errVar>)
 *     return { [data: ...,] error: (err instanceof Error ? err.message : String(err)) [|| '...'] }
 *
 * Everything else (inline Supabase-error logs) is left untouched and reported.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const files = execSync('grep -rl "} catch" src/app --include="*.ts"', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)

// console.error('<ctx>', err)  OR  console.error("<ctx>", err)  (err may be err/error, any msg)
// Followed on the next line by a `return { ... error: (<errVar> instanceof Error ? ...) ... }`
const PATTERN =
    /console\.error\((['"`])([^'"`]*?)\1,\s*(\w+)\)\n(\s*)return \{ (data: [^,]+, )?error: \(\3 instanceof Error \? \3\.message : String\(\3\)\)( \|\| '[^']*')? \}/g

const report = []

for (const file of files) {
    let src = readFileSync(file, 'utf8')
    let count = 0

    src = src.replace(PATTERN, (_m, _q, ctx, errVar, indent, dataPart) => {
        count++
        const label = ctx
            .replace(/^Error in /, '')
            .replace(/^Exception in /, '')
            .replace(/:?\s*$/, '')
            .trim() || file
        const dataPrefix = dataPart ? dataPart : ''
        return `return { ${dataPrefix}error: await captureActionError('${label.replace(/'/g, "\\'")}', ${errVar}) }`
    })

    if (count > 0) {
        // Ensure the import is present, placed after the last existing import.
        if (!/action-error/.test(src)) {
            const imports = [...src.matchAll(/^import .*(?:\r?\n)/gm)]
            const imp = "import { captureActionError } from '@/lib/action-error'\n"
            if (imports.length) {
                const last = imports[imports.length - 1]
                const at = last.index + last[0].length
                src = src.slice(0, at) + imp + src.slice(at)
            } else {
                src = imp + src
            }
        }
        writeFileSync(file, src)
        report.push(`${String(count).padStart(2)}  ${file}`)
    }
}

console.log(report.join('\n'))
console.log(`\nRewrote ${report.reduce((n, r) => n + parseInt(r), 0)} catch blocks across ${report.length} files`)
