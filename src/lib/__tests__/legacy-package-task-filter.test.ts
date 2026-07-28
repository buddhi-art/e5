import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (file: string) => readFileSync(join(root, file), 'utf8')

describe('legacy package task removal', () => {
    it('filters old generated phase tasks only when their project is package-linked', () => {
        const employeePage = read('src/app/employee/page.tsx')
        expect(employeePage).toContain('package_id, package_item_id')
        expect(employeePage).toContain('isPackageProject')
        expect(employeePage).toContain('isLegacyGeneratedTask')
        expect(employeePage).toContain('return !(isPackageProject && isLegacyGeneratedTask)')
    })

    it('provides a second cleanup migration for both package project links', () => {
        const migration = read('supabase/migrations/20260724000008_remove_legacy_package_tasks_again.sql')
        expect(migration).toContain('project.package_item_id IS NOT NULL OR project.package_id IS NOT NULL')
        expect(migration).toContain("task.status = 'pending'")
        expect(migration).toContain('task.description = generated.description')
    })
})