'use client'

import { useState } from 'react'
import { assignTask } from './actions'
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
} from "@/components/ui/select"
import { toast } from 'sonner'
import { X, Plus, CalendarIcon } from 'lucide-react'

export function TaskForm({ projects, employees }: { projects: any[], employees: any[] }) {
  const [loading, setLoading] = useState(false)
  type SubtaskInput = { title: string, subSubtasks: string[] }
  const [subtasks, setSubtasks] = useState<SubtaskInput[]>([])
  const [newSubtask, setNewSubtask] = useState('')
  const [newSubSubtask, setNewSubSubtask] = useState<{ [key: number]: string }>({})

  // State for Selects
  const [projectId, setProjectId] = useState('')
  const [phase, setPhase] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  function addSubtask() {
    const trimmed = newSubtask.trim()
    if (trimmed && !subtasks.some(s => s.title === trimmed)) {
      setSubtasks(prev => [...prev, { title: trimmed, subSubtasks: [] }])
      setNewSubtask('')
    }
  }

  function removeSubtask(index: number) {
    setSubtasks(prev => prev.filter((_, i) => i !== index))
  }

  function addSubSubtask(subtaskIndex: number) {
    const trimmed = (newSubSubtask[subtaskIndex] || '').trim()
    if (trimmed) {
      setSubtasks(prev => {
        const next = [...prev]
        if (!next[subtaskIndex].subSubtasks.includes(trimmed)) {
          next[subtaskIndex].subSubtasks.push(trimmed)
        }
        return next
      })
      setNewSubSubtask(prev => ({ ...prev, [subtaskIndex]: '' }))
    }
  }

  function removeSubSubtask(subtaskIndex: number, sst: string) {
    setSubtasks(prev => {
      const next = [...prev]
      next[subtaskIndex].subSubtasks = next[subtaskIndex].subSubtasks.filter(s => s !== sst)
      return next
    })
  }

  async function handleSubmit(formData: FormData) {
    if (!projectId || !phase || !assignedTo) {
      toast.error('Please fill all required dropdowns.')
      return
    }

    formData.set('project_id', projectId)
    formData.set('phase', phase)
    formData.set('assigned_to', assignedTo)
    formData.set('subtasks', JSON.stringify(subtasks))

    setLoading(true)
    const result = await assignTask(formData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Task assigned successfully')
      const form = document.getElementById('task-form') as HTMLFormElement
      form.reset()
      setSubtasks([])
      setProjectId('')
      setPhase('')
      setAssignedTo('')
    }
    setLoading(false)
  }

  return (
    <form id="task-form" action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Project Selection */}
        <div className="space-y-2">
          <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Project *</Label>
          <Select value={projectId} onValueChange={(val) => setProjectId(val || '')}>
            <SelectTrigger className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white">
              <SelectValue placeholder="Select Project">
                {projectId ? projects.find(p => p.id === projectId)?.title : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white max-h-[300px]">
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.title} ({p.clients?.company_name})</SelectItem>
              ))}
              {projects.length === 0 && <SelectItem value="none" disabled>No active projects</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        {/* Phase Selection */}
        <div className="space-y-2">
          <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Phase *</Label>
          <Select value={phase} onValueChange={(val) => setPhase(val || '')}>
            <SelectTrigger className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white">
              <SelectValue placeholder="Select Phase">
                {phase === 'Phase 1' ? 'Client Requirement' : phase === 'Phase 2' ? 'Pre-Production' : phase === 'Phase 3' ? 'Production' : phase === 'Phase 4' ? 'Post-Production' : phase === 'Phase 5' ? 'Delivery & SEO' : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
              <SelectItem value="Phase 1">Phase 1: Client Requirement</SelectItem>
              <SelectItem value="Phase 2">Phase 2: Pre-Production</SelectItem>
              <SelectItem value="Phase 3">Phase 3: Production</SelectItem>
              <SelectItem value="Phase 4">Phase 4: Post-Production</SelectItem>
              <SelectItem value="Phase 5">Phase 5: Delivery & SEO</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Employee Selection */}
        <div className="space-y-2">
          <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Assign To *</Label>
          <Select value={assignedTo} onValueChange={(val) => setAssignedTo(val || '')}>
            <SelectTrigger className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white">
              <SelectValue placeholder="Select Employee">
                {assignedTo ? employees.find(e => e.id === assignedTo)?.full_name : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white max-h-[300px]">
              {employees.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.full_name} - {e.designation}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label htmlFor="start_date" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Start Date</Label>
          <div className="relative">
            <Input id="start_date" name="start_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white [color-scheme:dark]" />
          </div>
        </div>

        {/* Deadline */}
        <div className="space-y-2">
          <Label htmlFor="deadline" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Deadline</Label>
          <div className="relative">
            <Input id="deadline" name="deadline" type="datetime-local" className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white [color-scheme:dark]" />
          </div>
        </div>
      </div>

      {/* Main Task Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Task Title *</Label>
        <Input id="title" name="title" required placeholder="Main objective" className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Description</Label>
        <Textarea id="description" name="description" placeholder="Additional details, references, or instructions..." className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white min-h-[100px]" />
      </div>

      {/* Subtasks */}
      <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
        <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Sub-tasks & Sub-sub-tasks</Label>

        {subtasks.length > 0 && (
          <div className="space-y-3 mb-3">
            {subtasks.map((st, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{st.title}</span>
                  <button type="button" onClick={() => removeSubtask(i)} className="text-zinc-500 hover:text-red-400 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub-sub-tasks List */}
                {st.subSubtasks.length > 0 && (
                  <ul className="pl-4 space-y-1 mb-2 border-l-2 border-zinc-200 dark:border-zinc-700">
                    {st.subSubtasks.map((sst, j) => (
                      <li key={j} className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                        <span>• {sst}</span>
                        <button type="button" onClick={() => removeSubSubtask(i, sst)} className="text-zinc-400 hover:text-red-400 p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Add Sub-sub-task */}
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newSubSubtask[i] || ''}
                    onChange={(e) => setNewSubSubtask(prev => ({ ...prev, [i]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubSubtask(i) } }}
                    placeholder="Add sub-sub-task..."
                    className="h-7 text-xs bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
                  />
                  <Button type="button" onClick={() => addSubSubtask(i)} variant="outline" size="sm" className="h-7 px-2 text-xs">
                    <Plus className="w-3 h-3" /> Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask() } }}
            placeholder="Add a main sub-task..."
            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white"
          />
          <Button type="button" onClick={addSubtask} variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700">
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-zinc-900 dark:text-white font-semibold shadow-[0_0_20px_rgba(249,115,22,0.15)] transition-all border-none h-12" disabled={loading}>
        {loading ? 'Assigning...' : 'Assign Task'}
      </Button>
    </form>
  )
}
