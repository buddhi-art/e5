'use client'

import { useMemo, useState, useEffect } from 'react'
import { ClipboardCheck, FileText, PackageCheck, Camera, Truck, X } from 'lucide-react'
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
import { getPhaseTwoOptions } from '@/app/admin/tasks/actions'

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
  const [equipmentList, setEquipmentList] = useState<{name: string, model: string|null}[]>([])
  const [employeesWithVehicles, setEmployeesWithVehicles] = useState<{full_name: string, social_urls: any}[]>([])
  const [equipmentInput, setEquipmentInput] = useState('')
  const [vehicleInput, setVehicleInput] = useState('')

  useEffect(() => {
    if (phase === 'Phase 2') {
      getPhaseTwoOptions().then(({ employees, equipment }) => {
        setEquipmentList(equipment)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setEmployeesWithVehicles(employees.filter((e: any) => e.social_urls?.vehicle === 'yes' || e.social_urls?.vehicle_details))
      })
    }
  }, [phase])

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

  function setLines(key: 'referenceLinks' | 'blockingIssues' | 'assignedStaffIds' | 'vehiclesTaken' | 'equipmentsTaken' | 'assignedEditorIds', raw: string) {
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

      {phase === 'Phase 2' && (
        <div className="space-y-4 border-t border-outline-variant pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <WorkspaceInput label="Shoot location" value={logistics.locationAddress} placeholder="Venue name or maps link" onChange={(value) => setField('locationAddress', value)} />
            <WorkspaceInput label="Shoot date" type="date" value={logistics.shootDate} onChange={(value) => setField('shootDate', value)} />
            <WorkspaceInput label="Start time" type="time" value={logistics.startTime} onChange={(value) => setField('startTime', value)} />
            <WorkspaceInput label="End time" type="time" value={logistics.endTime} onChange={(value) => setField('endTime', value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TagManager title="Equipment taken" icon={Camera} values={logistics.equipmentsTaken ?? []} setValues={(vals) => setField('equipmentsTaken', vals)} input={equipmentInput} setInput={setEquipmentInput} placeholder="Add custom equipment" selectOptions={equipmentList.map((item) => `${item.name}${item.model ? ` (${item.model})` : ''}`)} selectLabel="Select studio equipment" onAdd={() => { const trimmed = equipmentInput.trim(); if (trimmed && !(logistics.equipmentsTaken??[]).includes(trimmed)) setField('equipmentsTaken', [...(logistics.equipmentsTaken??[]), trimmed]); setEquipmentInput('') }} />
            <TagManager title="Vehicles & transport" icon={Truck} values={logistics.vehiclesTaken ?? []} setValues={(vals) => setField('vehiclesTaken', vals)} input={vehicleInput} setInput={setVehicleInput} placeholder="Add vehicle or transport detail" selectOptions={employeesWithVehicles.map((emp) => emp.social_urls?.vehicle_details ? `${emp.full_name} — ${emp.social_urls.vehicle_details}` : `${emp.full_name}'s vehicle`)} selectLabel="Select team vehicle" onAdd={() => { const trimmed = vehicleInput.trim(); if (trimmed && !(logistics.vehiclesTaken??[]).includes(trimmed)) setField('vehiclesTaken', [...(logistics.vehiclesTaken??[]), trimmed]); setVehicleInput('') }} />
          </div>
        </div>
      )}

      {phase === 'Phase 3' && (
        <div className="space-y-4 border-t border-outline-variant pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <WorkspaceInput label="Editing location" value={logistics.editingLocation} placeholder="Studio or remote" onChange={(value) => setField('editingLocation', value)} />
            <WorkspaceInput label="Editing date" type="date" value={logistics.editingDate} onChange={(value) => setField('editingDate', value)} />
            <WorkspaceInput label="Start time" type="time" value={logistics.editingStartTime} onChange={(value) => setField('editingStartTime', value)} />
            <WorkspaceInput label="End time" type="time" value={logistics.editingEndTime} onChange={(value) => setField('editingEndTime', value)} />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Deliverables / Notes</Label>
              <Textarea
                value={logistics.editingNotes ?? ''}
                onChange={(event) => setField('editingNotes', event.target.value)}
                placeholder="List required deliverables and edit notes"
                className={`${fieldClass} min-h-24`}
              />
            </div>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TagManager({ title, icon: Icon, values, setValues, input, setInput, placeholder, selectOptions, selectLabel, onAdd }: { title: string, icon: any, values: string[], setValues: (items: string[]) => void, input: string, setInput: (value: string) => void, placeholder: string, selectOptions: string[], selectLabel: string, onAdd: () => void }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant"><Icon className="h-3.5 w-3.5 text-primary" />{title}</label>
      <div className="space-y-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-3">
        <select value="" onChange={(event) => { const value = event.target.value; if (value && !values.includes(value)) setValues([...values, value]) }} className={`${fieldClass} w-full rounded-md border p-2 text-sm`}>
          <option value="">{selectLabel}</option>
          {selectOptions.map((option) => <option key={option} value={option} disabled={values.includes(option)}>{option}</option>)}
        </select>
        <div className="flex gap-2">
          <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onAdd() } }} placeholder={placeholder} className="min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40" />
          <button type="button" onClick={onAdd} className="shrink-0 rounded-lg bg-surface-container-high px-2.5 text-xs font-semibold text-foreground hover:bg-outline-variant">Add</button>
        </div>
        <div className="flex min-h-7 flex-wrap gap-1.5">
          {values.length === 0 ? <span className="text-[11px] italic text-on-surface-variant">Nothing selected.</span> : values.map((value) => (
            <span key={value} className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] text-primary">
              <span className="truncate">{value}</span>
              <button type="button" onClick={() => setValues(values.filter((item) => item !== value))} aria-label={`Remove ${value}`}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
