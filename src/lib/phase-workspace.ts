import type { ChecklistItem, TaskLogistics } from './validations'

/**
 * Phase 1 / 4 / 5 workspace metadata and helpers.
 *
 * Phases 2 and 3 keep their canonical package-table workspaces
 * (task-logistics-section / editing-logistics-section). Phases 1, 4 and 5
 * store per-deliverable data in `tasks.logistics` (JSONB) instead — see
 * Accio.md §3 for the architecture decision.
 */

export const WORKSPACE_VERSION = 1

export type WorkspacePhase = 'Phase 1' | 'Phase 4' | 'Phase 5'

export function isWorkspacePhase(phase: string | null | undefined): phase is WorkspacePhase {
  return phase === 'Phase 1' || phase === 'Phase 4' || phase === 'Phase 5'
}

/** Default checklist templates, seeded when a workspace is first opened. */
export const PHASE_CHECKLIST_TEMPLATES: Record<WorkspacePhase, ChecklistItem[]> = {
  'Phase 1': [
    { key: 'brief_received', label: 'Brief received', done: false },
    { key: 'script_drafted', label: 'Script drafted', done: false },
    { key: 'script_approved', label: 'Script approved by client', done: false },
    { key: 'storyboard_ready', label: 'Storyboard ready', done: false },
    { key: 'shot_list_ready', label: 'Shot list ready', done: false },
    { key: 'crew_gear_booked', label: 'Crew & gear booked', done: false },
  ],
  'Phase 4': [
    { key: 'video_quality', label: 'Video quality checked', done: false },
    { key: 'audio_levels', label: 'Audio levels checked', done: false },
    { key: 'colour_grading', label: 'Colour & grading checked', done: false },
    { key: 'graphics_lower_thirds', label: 'Graphics & lower-thirds checked', done: false },
    { key: 'branding_correct', label: 'Branding correct', done: false },
    { key: 'export_settings', label: 'Export settings verified', done: false },
    { key: 'brief_rechecked', label: 'Client brief re-checked', done: false },
  ],
  'Phase 5': [
    { key: 'final_exported', label: 'Final file exported', done: false },
    { key: 'delivered', label: 'Delivered to client', done: false },
    { key: 'client_confirmed', label: 'Client confirmed receipt', done: false },
    { key: 'raw_archived', label: 'Raw footage archived', done: false },
    { key: 'project_archived', label: 'Project files archived', done: false },
    { key: 'invoice_raised', label: 'Invoice raised', done: false },
  ],
}

export const PHASE_LABELS: Record<string, string> = {
  'Phase 1': 'Concept & Scripting',
  'Phase 2': 'Videography (Shoot)',
  'Phase 3': 'Editing & Design',
  'Phase 4': 'QA & Revision',
  'Phase 5': 'Delivery',
}

export const PHASE_HANDOFFS: Record<string, { nextPhase: string; title: string; message: string } | undefined> = {
  'Phase 1': {
    nextPhase: 'Phase 2',
    title: 'Script Approved (Baton Pass)',
    message: 'Script approved — shoot can be scheduled',
  },
  'Phase 2': {
    nextPhase: 'Phase 3',
    title: 'Footage Ready (Baton Pass)',
    message: 'Footage ready — editing can begin',
  },
  'Phase 3': {
    nextPhase: 'Phase 4',
    title: 'Edit Ready (Baton Pass)',
    message: 'Edit ready for QA',
  },
  'Phase 4': {
    nextPhase: 'Phase 5',
    title: 'QA Passed (Baton Pass)',
    message: 'QA passed — ready for delivery',
  },
}

/** The phase-specific primary artifact link field. */
export const PHASE_PRIMARY_LINK_FIELD: Record<WorkspacePhase, 'scriptLink' | 'reviewLink' | 'finalDeliveryLink'> = {
  'Phase 1': 'scriptLink',
  'Phase 4': 'reviewLink',
  'Phase 5': 'finalDeliveryLink',
}

/** Returns a fresh (deep-copied) default checklist for a phase. */
export function defaultChecklist(phase: WorkspacePhase): ChecklistItem[] {
  return PHASE_CHECKLIST_TEMPLATES[phase].map((item) => ({ ...item }))
}

/**
 * Merges an incoming checklist into the existing one BY KEY.
 * - Existing items keep their position and label; only `done` is taken from
 *   the incoming item when present.
 * - Incoming items with unknown keys are appended (allows template growth).
 * Neither array is mutated.
 */
export function mergeChecklists(
  existing: ChecklistItem[] | undefined,
  incoming: ChecklistItem[] | undefined,
): ChecklistItem[] {
  const base = (existing ?? []).map((item) => ({ ...item }))
  if (!incoming || incoming.length === 0) return base

  const byKey = new Map(base.map((item) => [item.key, item]))
  for (const inc of incoming) {
    const found = byKey.get(inc.key)
    if (found) {
      found.done = inc.done
    } else {
      const appended = { ...inc }
      base.push(appended)
      byKey.set(appended.key, appended)
    }
  }
  return base
}

/**
 * Merges an employee patch into existing logistics without dropping any
 * admin-entered fields. Checklists merge by key; empty-string links clear the
 * field; everything else is a shallow field-level overwrite of ONLY the keys
 * present in the patch.
 */
export function mergeWorkspacePatch(
  existing: Partial<TaskLogistics> | null | undefined,
  patch: Partial<TaskLogistics>,
): Partial<TaskLogistics> {
  const base: Record<string, unknown> = { ...(existing ?? {}) }

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue
    if (key === 'checklist') {
      base.checklist = mergeChecklists(
        (existing?.checklist ?? undefined) as ChecklistItem[] | undefined,
        value as ChecklistItem[],
      )
    } else if (value === '') {
      // Empty string = explicit clear for link/text fields.
      delete base[key]
    } else {
      base[key] = value
    }
  }

  base.workspaceVersion = WORKSPACE_VERSION
  return base as Partial<TaskLogistics>
}

/** Percentage of checklist items completed (0 when there is no checklist). */
export function checklistProgress(checklist: ChecklistItem[] | undefined): number {
  if (!checklist || checklist.length === 0) return 0
  const done = checklist.filter((item) => item.done).length
  return Math.round((done / checklist.length) * 100)
}

/**
 * Completion gate: whether completing this task should trigger the hand-off
 * notification to the next phase. Deliberately soft for Phase 1/5 (warn-level
 * gates live in the UI); hard for Phase 4 — QA must actually have passed.
 */
export function isHandoffReady(phase: string, logistics: Partial<TaskLogistics> | null | undefined): boolean {
  if (phase === 'Phase 4') {
    return logistics?.qaVerdict === 'passed' && !(logistics?.blockingIssues && logistics.blockingIssues.length > 0)
  }
  return true
}
