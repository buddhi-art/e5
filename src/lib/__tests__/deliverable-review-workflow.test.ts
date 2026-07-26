import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()

function read(relativePath: string) {
    return readFileSync(join(projectRoot, relativePath), 'utf8')
}

describe('employee to founder deliverable review workflow', () => {
    const actions = read('src/app/admin/packages/actions.ts')
    const workflowMigration = read('supabase/migrations/20260724000007_fix_employee_founder_review_workflow.sql')

    it('uses a restricted RPC instead of broad employee update permissions', () => {
        expect(workflowMigration).toContain('SECURITY DEFINER')
        expect(workflowMigration).toMatch(/deliverable\.assigned_employee_id = auth\.uid\(\)/i)
        expect(workflowMigration).toContain("status = 'UNDER_REVIEW'")
        expect(workflowMigration).toContain('REVOKE ALL ON FUNCTION')
        expect(workflowMigration).not.toMatch(/CREATE POLICY[\s\S]*FOR UPDATE/i)
    })

    it('verifies that an employee submission was actually persisted', () => {
        expect(actions).toContain("supabase.rpc('submit_deliverable_for_founder_review'")
        expect(actions).toMatch(/!submittedDeliverable \|\| submittedDeliverable\.length === 0/)
        expect(workflowMigration).toMatch(/INSERT INTO package_audit_logs/i)
    })

    it('loads founder reviews through explicit relationships and surfaces query errors', () => {
        expect(actions).toContain('profiles!package_deliverables_assigned_employee_id_fkey')
        expect(actions).toContain('projects!packages_project_id_fkey')
        expect(actions).toMatch(/Failed to load founder review queue/)
    })
})