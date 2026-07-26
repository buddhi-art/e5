import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()

function read(relativePath: string) {
    return readFileSync(join(projectRoot, relativePath), 'utf8')
}

describe('manual-only task creation', () => {
    it('does not insert tasks from project or package creation actions', () => {
        const automaticCreationSources = [
            'src/app/admin/projects/actions.ts',
            'src/app/admin/packages/actions.ts',
        ]

        for (const source of automaticCreationSources) {
            expect(read(source), `${source} must not create tasks automatically`).not.toMatch(
                /\.from\(['"]tasks['"]\)\s*\.insert\s*\(/,
            )
        }
    })

    it('does not install a database task generator', () => {
        const migrationsDirectory = join(projectRoot, 'supabase/migrations')
        const migrations = readdirSync(migrationsDirectory)
            .filter(file => file.endsWith('.sql'))
            .map(file => readFileSync(join(migrationsDirectory, file), 'utf8'))
            .join('\n')

        expect(migrations).not.toMatch(/insert\s+into\s+(?:public\.)?tasks\b/i)
    })

    it('keeps the explicit admin task action as the creation path', () => {
        expect(read('src/app/admin/tasks/actions.ts')).toMatch(
            /\.from\(['"]tasks['"]\)\s*\.insert\s*\(/,
        )
    })
})