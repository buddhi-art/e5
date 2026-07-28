'use client'

import { useCallback, useEffect, useState } from 'react'
import { Calendar, CheckCircle2, Clock, FolderKanban, Link2, Loader2, MapPin, Plus, Video } from 'lucide-react'
import { toast } from 'sonner'
import {
  addPackageDeliverable,
  assignDeliverableEmployee,
  getPackageDetailsForProject,
  updateDeliverableStatus,
  updatePostProduction,
} from '@/app/admin/packages/actions'

interface EditingLogisticsSectionProps {
  projectId: string
}

const deliveryStatuses = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_editing', label: 'In editing' },
  { value: 'client_review', label: 'Client review' },
  { value: 'approved', label: 'Approved' },
] as const

export function EditingLogisticsSection({ projectId }: EditingLogisticsSectionProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [packageData, setPackageData] = useState<any>(null)
  const [editingLocation, setEditingLocation] = useState('')
  const [editingDate, setEditingDate] = useState('')
  const [editingStartTime, setEditingStartTime] = useState('')
  const [editingEndTime, setEditingEndTime] = useState('')
  const [editorIds, setEditorIds] = useState<string[]>([])
  const [editingNotes, setEditingNotes] = useState('')
  const [newDeliverable, setNewDeliverable] = useState('')
  const [addingDeliverable, setAddingDeliverable] = useState(false)

  const loadPackageData = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    const result = await getPackageDetailsForProject(projectId)
    setLoading(false)
    if ('error' in result || !result.package) {
      setPackageData(null)
      return
    }

    const postProduction = result.postProd || {}
    setPackageData(result)
    setEditingLocation(postProduction.editing_location || '')
    setEditingDate(postProduction.editing_date || '')
    setEditingStartTime(postProduction.editing_start_time || '')
    setEditingEndTime(postProduction.editing_end_time || '')
    setEditorIds(postProduction.assigned_editor_ids || [])
    setEditingNotes(postProduction.client_revision_notes || '')
  }, [projectId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPackageData()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadPackageData])

  const packageId = packageData?.package?.id
  const employees = packageData?.employees || []
  const deliverables = packageData?.deliverables || []

  function toggleEditor(id: string) {
    setEditorIds(editorIds.includes(id) ? editorIds.filter((value) => value !== id) : [...editorIds, id])
  }

  async function savePostProduction() {
    if (!packageId) return
    setSaving(true)
    const result = await updatePostProduction(packageId, {
      editingLocation,
      editingDate,
      editingStartTime,
      editingEndTime,
      assignedEditorIds: editorIds,
      editingNotes,
    })
    setSaving(false)

    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Editing operations saved to the package workspace.')
    loadPackageData()
  }

  async function addDeliverable() {
    if (!packageId || !newDeliverable.trim()) return
    setAddingDeliverable(true)
    const result = await addPackageDeliverable(packageId, newDeliverable)
    setAddingDeliverable(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setNewDeliverable('')
    toast.success('Deliverable added.')
    loadPackageData()
  }

  async function changeDeliverableAssignee(deliverableId: string, employeeId: string) {
    if (!packageId) return
    const result = await assignDeliverableEmployee(deliverableId, packageId, employeeId || null)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(employeeId ? 'Deliverable assigned.' : 'Deliverable unassigned.')
    loadPackageData()
  }

  async function changeDeliverableStatus(deliverableId: string, status: typeof deliveryStatuses[number]['value']) {
    if (!packageId) return
    const result = await updateDeliverableStatus(deliverableId, packageId, status)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Deliverable status updated.')
    loadPackageData()
  }

  if (loading) return <LoadingState label="Loading editing operations…" />
  if (!packageData) return <EmptyPackageState />

  return (
    <section className="space-y-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-4 sm:p-5 shadow-sm" aria-label="Editing and deliverable hub">
      <header className="border-b border-outline-variant/50 pb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Video className="h-4 w-4 text-primary" /> Editing &amp; Deliverable Hub</h3>
        <p className="mt-1 text-xs text-on-surface-variant">Manage shared Package Management editing data, editors, and deliverables from this Phase 3 task.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-7">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Editing location" icon={MapPin}><input value={editingLocation} onChange={(event) => setEditingLocation(event.target.value)} placeholder="Studio, home office, or remote suite" className="input-field" /></Field>
            <Field label="Editing date" icon={Calendar}><input type="date" value={editingDate} onChange={(event) => setEditingDate(event.target.value)} className="input-field" /></Field>
            <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-3 md:col-span-2">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-foreground"><span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> Editing duration</span><Duration start={editingStartTime} end={editingEndTime} /></div>
              <div className="grid grid-cols-2 gap-2"><TimeInput label="Start" value={editingStartTime} onChange={setEditingStartTime} /><TimeInput label="End" value={editingEndTime} onChange={setEditingEndTime} /></div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-end justify-between gap-3"><label className="text-xs font-semibold text-on-surface-variant">Assigned editors</label><span className="text-[10px] text-on-surface-variant">Select everyone responsible for post-production.</span></div>
            <div className="grid max-h-52 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest p-3 pr-4 sm:grid-cols-2">
              {employees.map((employee: any) => {
                const selected = editorIds.includes(employee.id)
                return <button key={employee.id} type="button" onClick={() => toggleEditor(employee.id)} className={`flex min-w-0 items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-colors ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-high'}`}><span className="min-w-0"><span className="block truncate text-xs font-semibold text-foreground">{employee.full_name}</span><span className="block truncate text-[10px]">{employee.designation || 'Team member'}</span></span>{selected && <CheckCircle2 className="ml-2 h-4 w-4 shrink-0" />}</button>
              })}
            </div>
          </div>

          <label className="block text-xs font-semibold text-on-surface-variant">Client revision notes / instructions<textarea value={editingNotes} onChange={(event) => setEditingNotes(event.target.value)} placeholder="Client feedback, brand guidance, or edit instructions…" className="mt-1.5 min-h-28 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40" /></label>
          <div className="flex justify-end border-t border-outline-variant/50 pt-3"><button type="button" disabled={saving} onClick={savePostProduction} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save editing operations</button></div>
        </div>

        <aside className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 xl:col-span-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><div><h4 className="text-xs font-semibold text-foreground">Deliverable workflow</h4><p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">Add deliverables, assign editors, and advance each through its review status.</p></div><span className="w-fit rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">{deliverables.length} item{deliverables.length === 1 ? '' : 's'}</span></div>
          <div className="mt-3 flex gap-2"><input value={newDeliverable} onChange={(event) => setNewDeliverable(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void addDeliverable() } }} placeholder="e.g. Product reel 01" className="min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-2.5 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40" /><button type="button" onClick={() => void addDeliverable()} disabled={addingDeliverable} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{addingDeliverable ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add</button></div>
          <div className="mt-3 max-h-[30rem] space-y-2 overflow-y-auto pr-1">{deliverables.length === 0 ? <p className="py-6 text-center text-xs italic text-on-surface-variant">No deliverables created yet.</p> : deliverables.map((deliverable: any) => <DeliverableRow key={deliverable.id} deliverable={deliverable} employees={employees} onAssigneeChange={changeDeliverableAssignee} onStatusChange={changeDeliverableStatus} />)}</div>
        </aside>
      </div>
    </section>
  )
}

function DeliverableRow({ deliverable, employees, onAssigneeChange, onStatusChange }: { deliverable: any, employees: any[], onAssigneeChange: (id: string, employeeId: string) => void, onStatusChange: (id: string, status: typeof deliveryStatuses[number]['value']) => void }) {
  const legacyStatusMap: Record<string, typeof deliveryStatuses[number]['value']> = {
    UNASSIGNED: 'not_started',
    ASSIGNED: 'in_editing',
    IN_PROGRESS: 'in_editing',
    UNDER_REVIEW: 'client_review',
    REVISION_REQUESTED: 'in_editing',
    APPROVED: 'approved',
  }
  const normalizedStatus = deliveryStatuses.some((status) => status.value === deliverable.status)
    ? deliverable.status
    : legacyStatusMap[deliverable.status] || 'not_started'
  return <article className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-3"><div className="flex min-w-0 items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-semibold text-foreground">{deliverable.title}</p><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-on-surface-variant">{deliverable.revision_count > 0 && <span>Revision {deliverable.revision_count}</span>}{deliverable.drive_link && <a href={deliverable.drive_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><Link2 className="h-3 w-3" /> Drive file</a>}{deliverable.project_id && <a href={`/admin/projects/${deliverable.project_id}`} className="inline-flex items-center gap-1 text-primary hover:underline"><FolderKanban className="h-3 w-3" /> Project</a>}</div></div></div><div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"><select value={deliverable.assigned_employee_id || ''} onChange={(event) => onAssigneeChange(deliverable.id, event.target.value)} className="input-field"><option value="">Unassigned editor</option>{employees.map((employee: any) => <option key={employee.id} value={employee.id}>{employee.full_name}</option>)}</select><select value={normalizedStatus} onChange={(event) => onStatusChange(deliverable.id, event.target.value as typeof deliveryStatuses[number]['value'])} className="input-field">{deliveryStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></div></article>
}

function LoadingState({ label }: { label: string }) { return <div className="flex items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-low p-6 text-sm text-on-surface-variant"><Loader2 className="h-4 w-4 animate-spin text-primary" />{label}</div> }
function EmptyPackageState() { return <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-5 text-sm text-on-surface-variant">This project is not linked to a package, so editing operations cannot be managed here.</div> }
function Field({ label, icon: Icon, children }: { label: string, icon: typeof MapPin, children: React.ReactNode }) { return <label className="block text-xs font-semibold text-on-surface-variant"><span className="mb-1.5 flex items-center gap-1.5"><Icon className="h-3.5 w-3.5 text-primary" />{label}</span>{children}</label> }
function TimeInput({ label, value, onChange }: { label: string, value: string, onChange: (value: string) => void }) { return <label className="text-[11px] text-on-surface-variant">{label}<input type="time" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40" /></label> }
function Duration({ start, end }: { start: string, end: string }) { if (!start || !end) return null; const [sh, sm] = start.split(':').map(Number); const [eh, em] = end.split(':').map(Number); let minutes = eh * 60 + em - (sh * 60 + sm); if (minutes < 0) minutes += 1440; return <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">{Math.floor(minutes / 60)}h {minutes % 60}m</span> }
