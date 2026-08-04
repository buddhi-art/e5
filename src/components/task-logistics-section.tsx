// Package action results will receive generated Supabase types in the schema-typing pass.
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Calendar, Camera, CheckCircle2, Clock, History, Loader2, MapPin, Plus, RotateCcw, Truck, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  getPackageDetailsForProject,
  incrementRevisionCount,
  updateLogistics,
} from '@/app/admin/packages/actions'

interface PackageLogisticsData {
  location_address?: string
  locations?: string[]
  shoot_date?: string
  start_time?: string
  end_time?: string
  assigned_staff_ids?: string[]
  vehicles_taken?: string[]
  equipments_taken?: string[]
  revision_count?: number
}

interface PackageLogisticsEmployee {
  id: string
  full_name: string
  designation: string | null
  role?: string
  social_urls?: { vehicle?: string; vehicle_details?: string }
}

interface PackageLogisticsEquipment {
  id: string
  name: string
  model?: string | null
  category?: string
  status?: string
}

interface PackageLogisticsSiteVisit {
  id: string
  visit_date: string
  reason: string
  location_address?: string | null
  profiles?: { full_name?: string } | { full_name?: string }[] | null
}

interface PackageLogisticsResult {
  package?: { id: string; package_number: string }
  logistics?: PackageLogisticsData
  employees?: PackageLogisticsEmployee[]
  equipmentList?: PackageLogisticsEquipment[]
  siteVisits?: PackageLogisticsSiteVisit[]
}

interface TaskLogisticsSectionProps {
  projectId: string
  onLogisticsChange?: (logistics: Record<string, unknown> | null) => void
}

export function TaskLogisticsSection({ projectId, onLogisticsChange }: TaskLogisticsSectionProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingRevision, setSavingRevision] = useState(false)
  const [packageData, setPackageData] = useState<PackageLogisticsResult | null>(null)
  const [locations, setLocations] = useState<string[]>([''])
  const [shootDate, setShootDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [staffIds, setStaffIds] = useState<string[]>([])
  const [vehicles, setVehicles] = useState<string[]>([])
  const [equipment, setEquipment] = useState<string[]>([])
  const [vehicleInput, setVehicleInput] = useState('')
  const [equipmentInput, setEquipmentInput] = useState('')
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [revisionReason, setRevisionReason] = useState('')
  const [revisionDate, setRevisionDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [revisionStaffIds, setRevisionStaffIds] = useState<string[]>([])

  // Notify parent of current logistics state so form can include it on submit
  const notifyParent = useCallback((overrides?: {
    locations?: string[]; shootDate?: string; startTime?: string; endTime?: string
    staffIds?: string[]; vehicles?: string[]; equipment?: string[]
  }) => {
    if (!onLogisticsChange) return
    const l = {
      locationAddress: (overrides?.locations ?? locations)[0] ?? '',
      locations: overrides?.locations ?? locations,
      shootDate: overrides?.shootDate ?? shootDate,
      startTime: overrides?.startTime ?? startTime,
      endTime: overrides?.endTime ?? endTime,
      assignedStaffIds: overrides?.staffIds ?? staffIds,
      vehiclesTaken: overrides?.vehicles ?? vehicles,
      equipmentsTaken: overrides?.equipment ?? equipment,
    }
    onLogisticsChange(l)
  }, [onLogisticsChange, locations, shootDate, startTime, endTime, staffIds, vehicles, equipment])

  const loadPackageData = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    const result = await getPackageDetailsForProject(projectId)
    setLoading(false)

    if ('error' in result || !result.package) {
      setPackageData(null)
      return
    }

    const logistics = result.logistics || {}
    setPackageData(result)
    const newLocations = Array.isArray(logistics.locations) && logistics.locations.length > 0
      ? logistics.locations
      : logistics.location_address ? [logistics.location_address] : ['']
    const newShootDate = logistics.shoot_date || ''
    const newStartTime = logistics.start_time || ''
    const newEndTime = logistics.end_time || ''
    const newStaffIds = logistics.assigned_staff_ids || []
    const newVehicles = logistics.vehicles_taken || []
    const newEquipment = logistics.equipments_taken || []
    setLocations(newLocations)
    setShootDate(newShootDate)
    setStartTime(newStartTime)
    setEndTime(newEndTime)
    setStaffIds(newStaffIds)
    setVehicles(newVehicles)
    setEquipment(newEquipment)
    // Notify parent immediately after loading so it has the latest data
    if (onLogisticsChange) {
      onLogisticsChange({
        locationAddress: newLocations[0] ?? '',
        locations: newLocations,
        shootDate: newShootDate,
        startTime: newStartTime,
        endTime: newEndTime,
        assignedStaffIds: newStaffIds,
        vehiclesTaken: newVehicles,
        equipmentsTaken: newEquipment,
      })
    }
  }, [projectId, onLogisticsChange])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPackageData()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadPackageData])

  // Keep the parent form in sync whenever any logistics field changes
  // so that clicking "Assign Task" always submits the latest logistics data.
  useEffect(() => {
    notifyParent()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, shootDate, startTime, endTime, staffIds, vehicles, equipment])

  const packageId = packageData?.package?.id
  const employees = packageData?.employees || []
  const equipmentList = packageData?.equipmentList || []
  const siteVisits = packageData?.siteVisits || []
  const revisionCount = packageData?.logistics?.revision_count || 0

  function toggleId(id: string, selected: string[], setSelected: (ids: string[]) => void) {
    setSelected(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id])
  }

  function addUniqueValue(value: string, values: string[], setValues: (items: string[]) => void, reset: () => void) {
    const trimmed = value.trim()
    if (!trimmed || values.includes(trimmed)) return
    setValues([...values, trimmed])
    reset()
  }

  async function saveLogistics() {
    if (!packageId) return
    setSaving(true)
    const result = await updateLogistics(packageId, {
      locationAddress: locations[0] || '',
      locations,
      shootDate,
      startTime,
      endTime,
      assignedStaffIds: staffIds,
      vehiclesTaken: vehicles,
      equipmentsTaken: equipment,
    })
    setSaving(false)

    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Videography logistics saved to the package workspace.')
    loadPackageData()
  }

  async function logRevision() {
    if (!packageId) return
    if (!revisionReason.trim()) {
      toast.error('A reason is required for every additional site visit.')
      return
    }
    setSavingRevision(true)
    const result = await incrementRevisionCount(packageId, revisionDate, revisionStaffIds, revisionReason, {
      equipmentsTaken: equipment,
      startTime,
      endTime,
      locationAddress: locations[0] || '',
    })
    setSavingRevision(false)

    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(`Site revision ${result.revisionCount} logged.`)
    setRevisionReason('')
    setRevisionStaffIds([])
    setRevisionOpen(false)
    loadPackageData()
  }

  if (loading) {
    return <LoadingState label="Loading videography operations…" />
  }

  if (!packageData) {
    return <EmptyPackageState phase="videography" />
  }

  return (
    <section className="space-y-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-4 sm:p-5 shadow-sm" aria-label="Videography and on-site logistics">
      <header className="flex flex-col gap-2 border-b border-outline-variant/50 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Truck className="h-4 w-4 text-primary" />
            Videography &amp; On-Site Logistics
          </h3>
          <p className="mt-1 text-xs text-on-surface-variant">Changes save directly to package {packageData.package?.package_number ?? '…'}, shared by its linked project tasks.</p>
        </div>
        <span className="w-fit rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
          {revisionCount === 0 ? 'First shoot pending' : `${revisionCount} extra visit${revisionCount === 1 ? '' : 's'}`}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="text-xs font-semibold text-on-surface-variant">Shoot locations / Maps links</label>
                <button type="button" onClick={() => setLocations([...locations, ''])} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20">
                  <Plus className="h-3.5 w-3.5" /> Add location
                </button>
              </div>
              <div className="space-y-2">
                {locations.map((location, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-primary" />
                      <input value={location} onChange={(event) => setLocations(locations.map((value, valueIndex) => valueIndex === index ? event.target.value : value))} placeholder="Venue name or Google Maps link" className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40" />
                    </div>
                    {locations.length > 1 && <button type="button" onClick={() => setLocations(locations.filter((_, valueIndex) => valueIndex !== index))} aria-label="Remove location" className="rounded-lg p-2 text-error hover:bg-error/10"><X className="h-4 w-4" /></button>}
                  </div>
                ))}
              </div>
            </div>

            <Field label="Shoot date" icon={Calendar}>
              <input type="date" value={shootDate} onChange={(event) => setShootDate(event.target.value)} className="input-field" />
            </Field>
            <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-foreground"><span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> Shoot duration</span><Duration start={startTime} end={endTime} /></div>
              <div className="grid grid-cols-2 gap-2"><TimeInput label="Start" value={startTime} onChange={setStartTime} /><TimeInput label="End" value={endTime} onChange={setEndTime} /></div>
            </div>
          </div>

          <SelectionPanel title="On-site staff / videographers" hint="Select everyone attending the shoot.">
            <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {employees.map((employee: PackageLogisticsEmployee) => {
                const selected = staffIds.includes(employee.id)
                const vehicleInfo = employee.social_urls?.vehicle_details || (employee.social_urls?.vehicle === 'yes' ? 'Owns vehicle' : '')
                return <SelectionButton key={employee.id} selected={selected} onClick={() => toggleId(employee.id, staffIds, setStaffIds)} name={employee.full_name} detail={`${employee.designation || 'Team member'}${vehicleInfo ? ` · ${vehicleInfo}` : ''}`} />
              })}
            </div>
          </SelectionPanel>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TagManager title="Equipment" icon={Camera} values={equipment} setValues={setEquipment} input={equipmentInput} setInput={setEquipmentInput} placeholder="Add custom equipment" selectOptions={equipmentList.map((item: PackageLogisticsEquipment) => `${item.name}${item.model ? ` (${item.model})` : ''}`)} selectLabel="Select studio equipment" onAdd={() => addUniqueValue(equipmentInput, equipment, setEquipment, () => setEquipmentInput(''))} />
            <TagManager title="Vehicles & transport" icon={Truck} values={vehicles} setValues={setVehicles} input={vehicleInput} setInput={setVehicleInput} placeholder="Add vehicle or transport detail" selectOptions={employees.filter((employee: PackageLogisticsEmployee) => employee.social_urls?.vehicle === 'yes' || employee.social_urls?.vehicle_details).map((employee: PackageLogisticsEmployee) => employee.social_urls?.vehicle_details ? `${employee.full_name} — ${employee.social_urls.vehicle_details}` : `${employee.full_name}'s vehicle`)} selectLabel="Select team vehicle" onAdd={() => addUniqueValue(vehicleInput, vehicles, setVehicles, () => setVehicleInput(''))} />
          </div>

          <div className="flex justify-end border-t border-outline-variant/50 pt-3">
            <button type="button" disabled={saving} onClick={saveLogistics} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save videography logistics
            </button>
          </div>
        </div>

        <aside className="space-y-4 xl:col-span-4">
          <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4">
            <div className="flex items-start justify-between gap-3"><div><h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground"><RotateCcw className="h-4 w-4 text-primary" /> Site revision tracker</h4><p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">Log every additional site trip after the original shoot.</p></div><span className="font-mono text-2xl font-semibold text-foreground">{revisionCount}</span></div>
            <button type="button" onClick={() => setRevisionOpen(!revisionOpen)} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-500/20 dark:text-amber-400"><Plus className="h-3.5 w-3.5" /> Log extra site visit</button>
            {revisionOpen && <div className="mt-3 space-y-3 border-t border-outline-variant/50 pt-3"><textarea value={revisionReason} onChange={(event) => setRevisionReason(event.target.value)} placeholder="Reason for this extra visit" className="min-h-20 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40" /><input type="date" value={revisionDate} onChange={(event) => setRevisionDate(event.target.value)} className="input-field" /><div className="grid max-h-32 grid-cols-2 gap-1 overflow-y-auto rounded-lg border border-outline-variant bg-surface-container-low p-2">{employees.map((employee: PackageLogisticsEmployee) => <button key={employee.id} type="button" onClick={() => toggleId(employee.id, revisionStaffIds, setRevisionStaffIds)} className={`rounded-md px-2 py-1.5 text-left text-[11px] ${revisionStaffIds.includes(employee.id) ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>{employee.full_name}</button>)}</div><button type="button" disabled={savingRevision} onClick={logRevision} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{savingRevision && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save site visit</button></div>}
          </div>

          <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground"><History className="h-4 w-4 text-primary" /> Recent visit history</h4>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">{siteVisits.length === 0 ? <p className="py-3 text-center text-xs italic text-on-surface-variant">No additional site visits logged.</p> : siteVisits.map((visit: PackageLogisticsSiteVisit) => <div key={visit.id} className="rounded-lg border border-outline-variant/50 bg-surface-container-low p-2.5 text-xs"><div className="flex justify-between gap-2 text-[11px] text-on-surface-variant"><span>{visit.visit_date}</span><span>{(visit.profiles as { full_name?: string } | null)?.full_name || 'Admin'}</span></div><p className="mt-1 font-medium text-foreground">{visit.reason}</p>{visit.location_address && <p className="mt-1 truncate text-[11px] text-on-surface-variant">{visit.location_address}</p>}</div>)}</div>
          </div>
        </aside>
      </div>
    </section>
  )
}

function LoadingState({ label }: { label: string }) { return <div className="flex items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-low p-6 text-sm text-on-surface-variant"><Loader2 className="h-4 w-4 animate-spin text-primary" />{label}</div> }
function EmptyPackageState({ phase }: { phase: string }) { return <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-5 text-sm text-on-surface-variant">This project is not linked to a package, so {phase} operations cannot be managed here.</div> }
function Field({ label, icon: Icon, children }: { label: string, icon: typeof Calendar, children: React.ReactNode }) { return <label className="block text-xs font-semibold text-on-surface-variant"><span className="mb-1.5 flex items-center gap-1.5"><Icon className="h-3.5 w-3.5 text-primary" />{label}</span>{children}</label> }
function TimeInput({ label, value, onChange }: { label: string, value: string, onChange: (value: string) => void }) { return <label className="text-[11px] text-on-surface-variant">{label}<input type="time" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40" /></label> }
function Duration({ start, end }: { start: string, end: string }) { if (!start || !end) return null; const [sh, sm] = start.split(':').map(Number); const [eh, em] = end.split(':').map(Number); let minutes = eh * 60 + em - (sh * 60 + sm); if (minutes < 0) minutes += 1440; return <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">{Math.floor(minutes / 60)}h {minutes % 60}m</span> }
function SelectionPanel({ title, hint, children }: { title: string, hint: string, children: React.ReactNode }) { return <div><div className="mb-1.5 flex items-end justify-between gap-3"><label className="text-xs font-semibold text-on-surface-variant">{title}</label><span className="text-[10px] text-on-surface-variant">{hint}</span></div><div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3">{children}</div></div> }
function SelectionButton({ selected, onClick, name, detail }: { selected: boolean, onClick: () => void, name: string, detail: string }) { return <button type="button" onClick={onClick} className={`flex min-w-0 items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-colors ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-high'}`}><span className="min-w-0"><span className="block truncate text-xs font-semibold text-foreground">{name}</span><span className="block truncate text-[10px]">{detail}</span></span>{selected && <CheckCircle2 className="ml-2 h-4 w-4 shrink-0" />}</button> }
function TagManager({ title, icon: Icon, values, setValues, input, setInput, placeholder, selectOptions, selectLabel, onAdd }: { title: string, icon: typeof Camera, values: string[], setValues: (items: string[]) => void, input: string, setInput: (value: string) => void, placeholder: string, selectOptions: string[], selectLabel: string, onAdd: () => void }) { return <div><label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant"><Icon className="h-3.5 w-3.5 text-primary" />{title}</label><div className="space-y-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-3"><select value="" onChange={(event) => { const value = event.target.value; if (value && !values.includes(value)) setValues([...values, value]) }} className="input-field"><option value="">{selectLabel}</option>{selectOptions.map((option) => <option key={option} value={option} disabled={values.includes(option)}>{option}</option>)}</select><div className="flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onAdd() } }} placeholder={placeholder} className="min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40" /><button type="button" onClick={onAdd} className="shrink-0 rounded-lg bg-surface-container-high px-2.5 text-xs font-semibold text-foreground hover:bg-outline-variant">Add</button></div><div className="flex min-h-7 flex-wrap gap-1.5">{values.length === 0 ? <span className="text-[11px] italic text-on-surface-variant">Nothing selected.</span> : values.map((value) => <span key={value} className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] text-primary"><span className="truncate">{value}</span><button type="button" onClick={() => setValues(values.filter((item) => item !== value))} aria-label={`Remove ${value}`}><X className="h-3 w-3" /></button></span>)}</div></div></div> }
