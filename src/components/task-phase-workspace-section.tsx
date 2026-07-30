'use client'

import { useMemo, useState } from 'react'
import { ClipboardCheck, FileText, PackageCheck } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  checklistProgress,
  defaultChecklist,
  PHASE_LABELS,
  WORKSPACE_VERSION,
  type WorkspacePhase,
} from '@/lib/phase-workspace'
import type { ChecklistItem, TaskLogistics } from '@/lib/validations'

interface TaskPhaseWorkspaceSectionProps {
  phase: WorkspacePhase
  initialLogistics?: Partial<TaskLogistics> | null
}

const fieldClass = 'bg-surface-container-high border-outline-variant text-on-surface'
const labelClass = 'text-xs font-medium uppercase tracking-wider text-on-surface-variant'

function cleanWorkspace(logistics: Partial<TaskLogistics>): Partial<TaskLogistics> {
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(logistics)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      cleaned[key] = value.filter((item) => typeof item !== 'string' || item.trim().length > 0)
    } else {
      cleaned[key] = value
    }
  }
  return cleaned as Partial<TaskLogistics>
}

export function TaskPhaseWorkspaceSection({ phase, initialLogistics }: TaskPhaseWorkspaceSectionProps) {
  const [logistics, setLogistics] = useState<Partial<TaskLogistics>>(() => ({
    ...(initialLogistics ?? {}),
    workspaceVersion: WORKSPACE_VERSION,
    checklist: initialLogistics?.checklist?.length
      ? initialLogistics.checklist.map((item) => ({ ...item }))
      : defaultChecklist(phase),
  }))

  const progress = checklistProgress(logistics.checklist)
  const serialized = useMemo(() => JSON.stringify(cleanWorkspace(logistics)), [logistics])

  function setField<K extends keyof TaskLogistics>(key: K, value: TaskLogistics[K]) {
    setLogistics((current) => ({ ...current, [key]: value }))
  }

  function toggleChecklist(index: number, done: boolean) {
    setLogistics((current) => ({
      ...current,
      checklist: (current.checklist ?? []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, done } : item,
      ),
    }))
  }

  function setLines(key: 'referenceLinks' | 'blockingIssues', raw: string) {
    setField(key, raw.split('\n').map((value) => value.trim()).filter(Boolean))
  }

  const Icon = phase === 'Phase 1' ? FileText : phase === 'Phase 4' ? ClipboardCheck : PackageCheck

  return (
    <section className="space-y-5 rounded-xl border border-outline-variant bg-surface-container-low p-4 md:p-5">
      <input type="hidden" name="logistics" value={serialized} readOnly />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-medium text-on-surface">{PHASE_LABELS[phase]} workspace</h3>
            <p className="text-xs text-on-surface-variant">Saved atomically with this task.</p>
          </div>
        </div>
        <div className="min-w-40">
          <div className="mb-1 flex justify-between text-xs text-on-surface-variant">
            <span>Checklist progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {(logistics.checklist ?? []).map((item: ChecklistItem, index: number) => (
          <label
            key={item.key}
            className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
          >
            <Checkbox
              checked={item.done}
              onCheckedChange={(checked) => toggleChecklist(index, checked === true)}
            />
            <span className={item.done ? 'text-on-surface-variant line-through' : ''}>{item.label}</span>
          </label>
        ))}
      </div>

      {phase === 'Phase 1' && (
        <div className="space-y-4 border-t border-outline-variant pt-4">
          <div className="space-y-2">
            <Label className={labelClass}>Creative brief</Label>
            <Textarea
              value={logistics.conceptBrief ?? ''}
              onChange={(event) => setField('conceptBrief', event.target.value)}
              placeholder="Audience, message, tone, must-have shots, constraints..."
              className={`${fieldClass} min-h-28`}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <WorkspaceInput label="Approved script link" type="url" value={logistics.scriptLink} onChange={(value) => setField('scriptLink', value)} />
            <WorkspaceInput label="Storyboard / shot-list link" type="url" value={logistics.storyboardLink} onChange={(value) => setField('storyboardLink', value)} />
            <WorkspaceInput label="Moodboard link" type="url" value={logistics.moodboardLink} onChange={(value) => setField('moodboardLink', value)} />
            <WorkspaceInput label="Deliverable format" value={logistics.deliverableFormat} placeholder="Reel 9:16" onChange={(value) => setField('deliverableFormat', value)} />
            <WorkspaceInput label="Target duration" value={logistics.targetDuration} placeholder="45s" onChange={(value) => setField('targetDuration', value)} />
            <div className="space-y-2">
              <Label className={labelClass}>Concept status</Label>
              <Select value={logistics.conceptStatus ?? 'drafting'} onValueChange={(value) => setField('conceptStatus', value as TaskLogistics['conceptStatus'])}>
                <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="drafting">Drafting</SelectItem>
                  <SelectItem value="internal_review">Internal review</SelectItem>
                  <SelectItem value="client_review">Client review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className={labelClass}>Extra reference links</Label>
            <Textarea
              value={(logistics.referenceLinks ?? []).join('\n')}
              onChange={(event) => setLines('referenceLinks', event.target.value)}
              placeholder="One http(s) link per line"
              className={fieldClass}
            />
          </div>
        </div>
      )}

      {phase === 'Phase 4' && (
        <div className="space-y-4 border-t border-outline-variant pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <WorkspaceInput label="QA reviewer" value={logistics.qaReviewer} onChange={(value) => setField('qaReviewer', value)} />
            <WorkspaceInput label="Revision round" type="number" min="0" value={String(logistics.reviewRound ?? 0)} onChange={(value) => setField('reviewRound', Math.max(0, Number.parseInt(value || '0', 10)))} />
            <WorkspaceInput label="Cut under review" type="url" value={logistics.reviewLink} onChange={(value) => setField('reviewLink', value)} />
            <div className="space-y-2">
              <Label className={labelClass}>QA verdict</Label>
              <Select value={logistics.qaVerdict ?? 'pending'} onValueChange={(value) => setField('qaVerdict', value as TaskLogistics['qaVerdict'])}>
                <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="changes_requested">Changes requested</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className={labelClass}>QA notes</Label>
              <Textarea value={logistics.qaNotes ?? ''} onChange={(event) => setField('qaNotes', event.target.value)} className={`${fieldClass} min-h-24`} />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Blocking issues</Label>
              <Textarea
                value={(logistics.blockingIssues ?? []).join('\n')}
                onChange={(event) => setLines('blockingIssues', event.target.value)}
                placeholder="One must-fix issue per line"
                className={`${fieldClass} min-h-24`}
              />
            </div>
          </div>
        </div>
      )}

      {phase === 'Phase 5' && (
        <div className="space-y-4 border-t border-outline-variant pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <WorkspaceInput label="Final delivery link" type="url" value={logistics.finalDeliveryLink} onChange={(value) => setField('finalDeliveryLink', value)} />
            <WorkspaceInput label="Delivery date" type="date" value={logistics.deliveryDate} onChange={(value) => setField('deliveryDate', value)} />
            <WorkspaceInput label="Delivery channel" value={logistics.deliveryChannel} placeholder="Drive, email, physical..." onChange={(value) => setField('deliveryChannel', value)} />
            <WorkspaceInput label="Client contact" value={logistics.clientContact} onChange={(value) => setField('clientContact', value)} />
            <WorkspaceInput label="Archive link" type="url" value={logistics.archiveLink} onChange={(value) => setField('archiveLink', value)} />
          </div>
          <div className="space-y-2">
            <Label className={labelClass}>Delivery notes</Label>
            <Textarea value={logistics.deliveryNotes ?? ''} onChange={(event) => setField('deliveryNotes', event.target.value)} className={`${fieldClass} min-h-24`} />
          </div>
        </div>
      )}
    </section>
  )
}

function WorkspaceInput({
  label,
  value,
  onChange,
  ...inputProps
}: {
  label: string
  value?: string
  onChange: (value: string) => void
} & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'>) {
  return (
    <div className="space-y-2">
      <Label className={labelClass}>{label}</Label>
      <Input
        {...inputProps}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      />
    </div>
  )
}
