'use client'

import { useMemo, useState } from 'react'
import { ClipboardCheck, FileText, Loader2, PackageCheck, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { checklistProgress, defaultChecklist, PHASE_LABELS, type WorkspacePhase } from '@/lib/phase-workspace'
import type { ChecklistItem, TaskLogistics } from '@/lib/validations'
import { updateTaskPhaseWorkspace } from '@/app/employee/actions'

interface TaskPhaseActionsProps {
  taskId: string
  phase: WorkspacePhase
  logistics?: Partial<TaskLogistics> | null
}

type EmployeePatch = {
  checklist?: ChecklistItem[]
  scriptLink?: string
  reviewLink?: string
  finalDeliveryLink?: string
  qaVerdict?: 'pending' | 'passed' | 'changes_requested'
  qaNotes?: string
  blockingIssues?: string[]
}

const fieldClass = 'bg-surface-container-high border-outline-variant text-on-surface'
const labelClass = 'text-xs font-medium uppercase tracking-wider text-on-surface-variant'

export function TaskPhaseActions({ taskId, phase, logistics }: TaskPhaseActionsProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() =>
    logistics?.checklist?.length ? logistics.checklist.map((item) => ({ ...item })) : defaultChecklist(phase),
  )
  const [primaryLink, setPrimaryLink] = useState(() => {
    if (phase === 'Phase 1') return logistics?.scriptLink ?? ''
    if (phase === 'Phase 4') return logistics?.reviewLink ?? ''
    return logistics?.finalDeliveryLink ?? ''
  })
  const [qaVerdict, setQaVerdict] = useState<'pending' | 'passed' | 'changes_requested'>(logistics?.qaVerdict ?? 'pending')
  const [qaNotes, setQaNotes] = useState(logistics?.qaNotes ?? '')
  const [blockingIssues, setBlockingIssues] = useState((logistics?.blockingIssues ?? []).join('\n'))
  const [saving, setSaving] = useState(false)

  const progress = checklistProgress(checklist)
  const Icon = phase === 'Phase 1' ? FileText : phase === 'Phase 4' ? ClipboardCheck : PackageCheck
  const linkLabel = phase === 'Phase 1' ? 'Script link' : phase === 'Phase 4' ? 'Review cut link' : 'Final delivery link'
  const patch = useMemo<EmployeePatch>(() => {
    const next: EmployeePatch = { checklist }
    if (phase === 'Phase 1') next.scriptLink = primaryLink
    if (phase === 'Phase 4') {
      next.reviewLink = primaryLink
      next.qaVerdict = qaVerdict
      next.qaNotes = qaNotes
      next.blockingIssues = blockingIssues.split('\n').map((issue) => issue.trim()).filter(Boolean)
    }
    if (phase === 'Phase 5') next.finalDeliveryLink = primaryLink
    return next
  }, [blockingIssues, checklist, phase, primaryLink, qaNotes, qaVerdict])

  function toggleChecklist(index: number, done: boolean) {
    setChecklist((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, done } : item))
  }

  async function saveWorkspace() {
    setSaving(true)
    const result = await updateTaskPhaseWorkspace(taskId, patch)
    if (result.error) toast.error(result.error)
    else toast.success(`${PHASE_LABELS[phase]} workspace saved`)
    setSaving(false)
  }

  return (
    <section className="space-y-4 rounded-lg border border-outline-variant/60 bg-surface-container-low p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <div>
            <h4 className="text-sm font-semibold text-foreground">Update {PHASE_LABELS[phase]}</h4>
            <p className="text-xs text-on-surface-variant">Only fields assigned to your phase can be changed.</p>
          </div>
        </div>
        <div className="min-w-36">
          <div className="mb-1 flex justify-between text-xs text-on-surface-variant"><span>Checklist</span><span>{progress}%</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-highest"><div className="h-full bg-primary" style={{ width: `${progress}%` }} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {checklist.map((item, index) => (
          <label key={item.key} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface">
            <Checkbox checked={item.done} onCheckedChange={(checked) => toggleChecklist(index, checked === true)} />
            <span className={item.done ? 'text-on-surface-variant line-through' : ''}>{item.label}</span>
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <Label className={labelClass}>{linkLabel}</Label>
        <Input type="url" value={primaryLink} onChange={(event) => setPrimaryLink(event.target.value)} placeholder="https://..." className={fieldClass} />
      </div>

      {phase === 'Phase 4' && (
        <div className="space-y-4 border-t border-outline-variant pt-4">
          <div className="space-y-2">
            <Label className={labelClass}>QA verdict</Label>
            <Select value={qaVerdict} onValueChange={(value) => setQaVerdict(value as typeof qaVerdict)}>
              <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="changes_requested">Changes requested</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={labelClass}>QA notes</Label>
            <Textarea value={qaNotes} onChange={(event) => setQaNotes(event.target.value)} className={`${fieldClass} min-h-20`} />
          </div>
          <div className="space-y-2">
            <Label className={labelClass}>Blocking issues</Label>
            <Textarea value={blockingIssues} onChange={(event) => setBlockingIssues(event.target.value)} placeholder="One must-fix issue per line" className={`${fieldClass} min-h-20`} />
          </div>
        </div>
      )}

      <Button type="button" onClick={saveWorkspace} disabled={saving} className="min-h-10 gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving…' : 'Save workspace'}
      </Button>
    </section>
  )
}
