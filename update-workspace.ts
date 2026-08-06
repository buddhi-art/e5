import * as fs from 'fs'

const path = 'src/components/task-phase-workspace-section.tsx'
let content = fs.readFileSync(path, 'utf8')

// Add imports
content = content.replace(
  "import { ClipboardCheck, FileText, PackageCheck } from 'lucide-react'",
  "import { ClipboardCheck, FileText, PackageCheck, Camera, Truck, X } from 'lucide-react'\nimport { getPhaseTwoOptions } from '@/app/admin/tasks/actions'"
)

// Add state for dynamic options
content = content.replace(
  "export function TaskPhaseWorkspaceSection({ phase, initialLogistics }: TaskPhaseWorkspaceSectionProps) {",
  `export function TaskPhaseWorkspaceSection({ phase, initialLogistics }: TaskPhaseWorkspaceSectionProps) {
  const [equipmentList, setEquipmentList] = useState<{name: string, model: string|null}[]>([])
  const [employeesWithVehicles, setEmployeesWithVehicles] = useState<{full_name: string, social_urls: any}[]>([])
  const [equipmentInput, setEquipmentInput] = useState('')
  const [vehicleInput, setVehicleInput] = useState('')

  import('react').then(({ useEffect }) => {
    useEffect(() => {
      if (phase === 'Phase 2') {
        getPhaseTwoOptions().then(({ employees, equipment }) => {
          setEquipmentList(equipment)
          setEmployeesWithVehicles(employees.filter((e: any) => e.social_urls?.vehicle === 'yes' || e.social_urls?.vehicle_details))
        })
      }
    }, [phase])
  })
`
)

// Remove assigned staff/editors textareas and update Phase 2 to use TagManager
content = content.replace(
  /\{phase === 'Phase 2' && \([\s\S]*?Assigned staff[\s\S]*?Vehicles & transport[\s\S]*?\}\)/,
  `{phase === 'Phase 2' && (
        <div className="space-y-4 border-t border-outline-variant pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <WorkspaceInput label="Shoot location" value={logistics.locationAddress} placeholder="Venue name or maps link" onChange={(value) => setField('locationAddress', value)} />
            <WorkspaceInput label="Shoot date" type="date" value={logistics.shootDate} onChange={(value) => setField('shootDate', value)} />
            <WorkspaceInput label="Start time" type="time" value={logistics.startTime} onChange={(value) => setField('startTime', value)} />
            <WorkspaceInput label="End time" type="time" value={logistics.endTime} onChange={(value) => setField('endTime', value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TagManager title="Equipment taken" icon={Camera} values={logistics.equipmentsTaken ?? []} setValues={(vals) => setField('equipmentsTaken', vals)} input={equipmentInput} setInput={setEquipmentInput} placeholder="Add custom equipment" selectOptions={equipmentList.map((item) => \`\${item.name}\${item.model ? \` (\${item.model})\` : ''}\`)} selectLabel="Select studio equipment" onAdd={() => { const trimmed = equipmentInput.trim(); if (trimmed && !(logistics.equipmentsTaken??[]).includes(trimmed)) setField('equipmentsTaken', [...(logistics.equipmentsTaken??[]), trimmed]); setEquipmentInput('') }} />
            <TagManager title="Vehicles & transport" icon={Truck} values={logistics.vehiclesTaken ?? []} setValues={(vals) => setField('vehiclesTaken', vals)} input={vehicleInput} setInput={setVehicleInput} placeholder="Add vehicle or transport detail" selectOptions={employeesWithVehicles.map((emp) => emp.social_urls?.vehicle_details ? \`\${emp.full_name} — \${emp.social_urls.vehicle_details}\` : \`\${emp.full_name}'s vehicle\`)} selectLabel="Select team vehicle" onAdd={() => { const trimmed = vehicleInput.trim(); if (trimmed && !(logistics.vehiclesTaken??[]).includes(trimmed)) setField('vehiclesTaken', [...(logistics.vehiclesTaken??[]), trimmed]); setVehicleInput('') }} />
          </div>
        </div>
      )}`
)

content = content.replace(
  /\{phase === 'Phase 3' && \([\s\S]*?Assigned editors[\s\S]*?Deliverables \/ Notes[\s\S]*?\}\)/,
  `{phase === 'Phase 3' && (
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
                className={\`\${fieldClass} min-h-24\`}
              />
            </div>
          </div>
        </div>
      )}`
)

content += `\n\nfunction TagManager({ title, icon: Icon, values, setValues, input, setInput, placeholder, selectOptions, selectLabel, onAdd }: { title: string, icon: any, values: string[], setValues: (items: string[]) => void, input: string, setInput: (value: string) => void, placeholder: string, selectOptions: string[], selectLabel: string, onAdd: () => void }) { return <div><label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant"><Icon className="h-3.5 w-3.5 text-primary" />{title}</label><div className="space-y-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-3"><select value="" onChange={(event) => { const value = event.target.value; if (value && !values.includes(value)) setValues([...values, value]) }} className={\`\${fieldClass} w-full rounded-md border p-2 text-sm\`!}><option value="">{selectLabel}</option>{selectOptions.map((option) => <option key={option} value={option} disabled={values.includes(option)}>{option}</option>)}</select><div className="flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onAdd() } }} placeholder={placeholder} className="min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40" /><button type="button" onClick={onAdd} className="shrink-0 rounded-lg bg-surface-container-high px-2.5 text-xs font-semibold text-foreground hover:bg-outline-variant">Add</button></div><div className="flex min-h-7 flex-wrap gap-1.5">{values.length === 0 ? <span className="text-[11px] italic text-on-surface-variant">Nothing selected.</span> : values.map((value) => <span key={value} className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] text-primary"><span className="truncate">{value}</span><button type="button" onClick={() => setValues(values.filter((item) => item !== value))} aria-label={\`Remove \${value}\`}><X className="h-3 w-3" /></button></span>)}</div></div></div> }`

fs.writeFileSync(path, content)
