import { describe, expect, it } from 'vitest'
import { UpdateTaskPhaseWorkspaceSchema } from '@/lib/validations'
import {
  checklistProgress,
  defaultChecklist,
  isHandoffReady,
  mergeWorkspacePatch,
} from '@/lib/phase-workspace'

describe('Phase 1 / 4 / 5 workspace helpers', () => {
  it('creates isolated default checklists for each phase', () => {
    const first = defaultChecklist('Phase 1')
    const second = defaultChecklist('Phase 1')

    first[0].done = true

    expect(second[0].done).toBe(false)
    expect(first).toHaveLength(6)
    expect(defaultChecklist('Phase 4')).toHaveLength(7)
    expect(defaultChecklist('Phase 5')).toHaveLength(6)
  })

  it('calculates checklist progress accurately', () => {
    expect(checklistProgress([
      { key: 'a', label: 'A', done: true },
      { key: 'b', label: 'B', done: false },
      { key: 'c', label: 'C', done: true },
    ])).toBe(67)
  })

  it('merges employee updates without erasing admin data', () => {
    const merged = mergeWorkspacePatch({
      conceptBrief: 'Admin-owned brief',
      deliverableFormat: 'Reel 9:16',
      checklist: [
        { key: 'brief_received', label: 'Brief received', done: false },
        { key: 'script_drafted', label: 'Script drafted', done: false },
      ],
    }, {
      scriptLink: 'https://drive.example/script',
      checklist: [{ key: 'script_drafted', label: 'Untrusted replacement label', done: true }],
    })

    expect(merged.conceptBrief).toBe('Admin-owned brief')
    expect(merged.deliverableFormat).toBe('Reel 9:16')
    expect(merged.scriptLink).toBe('https://drive.example/script')
    expect(merged.checklist).toEqual([
      { key: 'brief_received', label: 'Brief received', done: false },
      { key: 'script_drafted', label: 'Script drafted', done: true },
    ])
  })

  it('allows an employee to clear a primary link without affecting other fields', () => {
    const merged = mergeWorkspacePatch({
      scriptLink: 'https://drive.example/old-script',
      conceptBrief: 'Preserved brief',
    }, { scriptLink: '' })

    expect(merged.scriptLink).toBeUndefined()
    expect(merged.conceptBrief).toBe('Preserved brief')
  })

  it('requires passed QA with no blocking issues before the Phase 4 hand-off', () => {
    expect(isHandoffReady('Phase 4', { qaVerdict: 'passed' })).toBe(true)
    expect(isHandoffReady('Phase 4', { qaVerdict: 'changes_requested' })).toBe(false)
    expect(isHandoffReady('Phase 4', {
      qaVerdict: 'passed',
      blockingIssues: ['Fix lower-third spelling'],
    })).toBe(false)
    expect(isHandoffReady('Phase 1', {})).toBe(true)
  })
})

describe('UpdateTaskPhaseWorkspaceSchema', () => {
  const taskId = 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a'

  it('accepts an employee patch for a checklist and primary link', () => {
    expect(UpdateTaskPhaseWorkspaceSchema.safeParse({
      taskId,
      patch: {
        scriptLink: 'https://drive.example/script',
        checklist: [{ key: 'script_drafted', label: 'Script drafted', done: true }],
      },
    }).success).toBe(true)
  })

  it('rejects admin-owned fields and invalid links', () => {
    expect(UpdateTaskPhaseWorkspaceSchema.safeParse({
      taskId,
      patch: { conceptBrief: 'An employee must not overwrite this' },
    }).success).toBe(false)

    expect(UpdateTaskPhaseWorkspaceSchema.safeParse({
      taskId,
      patch: { finalDeliveryLink: 'not-a-link' },
    }).success).toBe(false)
  })
})
