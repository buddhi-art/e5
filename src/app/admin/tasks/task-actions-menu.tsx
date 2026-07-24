/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { updateTask, deleteTask } from './actions'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner'
import { MoreVertical, Edit, Trash2 } from 'lucide-react'

export function TaskActionsMenu({ task, projects, employees }: { task: any, projects: any[], employees: any[] }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Edit State
  const [projectId, setProjectId] = useState(task.project_id)
  const [phase, setPhase] = useState(task.phase)
  const [assignedTo, setAssignedTo] = useState(task.assigned_to)
  const [status, setStatus] = useState(task.status)

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this task? All sub-tasks will be permanently deleted.')) return
    
    setLoading(true)
    const result = await deleteTask(task.id)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Task deleted successfully')
    }
    setLoading(false)
  }

  async function handleUpdate(formData: FormData) {
    if (!projectId || !phase || !assignedTo || !status) {
      toast.error('Please fill all required dropdowns.')
      return
    }

    formData.set('project_id', projectId)
    formData.set('phase', phase)
    formData.set('assigned_to', assignedTo)
    formData.set('status', status)
    
    setLoading(true)
    const result = await updateTask(task.id, formData)
    
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Task updated successfully')
      setIsEditDialogOpen(false)
    }
    setLoading(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors outline-none">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-surface-container-lowest border-outline-variant text-on-surface">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)} className="cursor-pointer hover:bg-surface-container-high">
            <Edit className="w-4 h-4 mr-2" />
            Edit Task
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-outline-variant" />
          <DropdownMenuItem onClick={handleDelete} disabled={loading} className="cursor-pointer text-m3-error hover:bg-m3-error-subtle hover:text-m3-error">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-surface-container-lowest border-outline-variant">
          <DialogHeader>
            <DialogTitle className="text-on-surface">Edit Task</DialogTitle>
          </DialogHeader>
          <form action={handleUpdate} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-on-surface">Project</Label>
                <Select value={projectId} onValueChange={(val) => setProjectId(val || '')}>
                  <SelectTrigger className="w-full bg-surface-container-high border-outline-variant text-on-surface">
                    <SelectValue placeholder="Select Project">
                      {projectId ? projects.find(p => p.id === projectId)?.title : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container-lowest border-outline-variant text-on-surface max-h-[300px]">
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-on-surface">Phase</Label>
                <Select value={phase} onValueChange={(val) => setPhase(val || '')}>
                  <SelectTrigger className="w-full bg-surface-container-high border-outline-variant text-on-surface">
                    <SelectValue placeholder="Select Phase">
                      {phase === 'Phase 1' ? 'Concept & Scripting' : phase === 'Phase 2' ? 'Videography (Shoot)' : phase === 'Phase 3' ? 'Editing & Design' : phase === 'Phase 4' ? 'QA & Revision' : phase === 'Phase 5' ? 'Delivery' : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container-lowest border-outline-variant text-on-surface">
                    <SelectItem value="Phase 1">Phase 1: Concept & Scripting</SelectItem>
                    <SelectItem value="Phase 2">Phase 2: Videography (Shoot)</SelectItem>
                    <SelectItem value="Phase 3">Phase 3: Editing & Design</SelectItem>
                    <SelectItem value="Phase 4">Phase 4: QA & Revision</SelectItem>
                    <SelectItem value="Phase 5">Phase 5: Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-on-surface">Assign To</Label>
                <Select value={assignedTo} onValueChange={(val) => setAssignedTo(val || '')}>
                  <SelectTrigger className="w-full bg-surface-container-high border-outline-variant text-on-surface">
                    <SelectValue placeholder="Select Employee">
                      {assignedTo ? employees.find(e => e.id === assignedTo)?.full_name : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container-lowest border-outline-variant text-on-surface max-h-[300px]">
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-on-surface">Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val || '')}>
                  <SelectTrigger className="w-full bg-surface-container-high border-outline-variant text-on-surface">
                    <SelectValue placeholder="Select Status">
                      {status === 'pending' && 'Pending'}
                      {status === 'in_progress' && 'In Progress'}
                      {status === 'completed' && 'Completed'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container-lowest border-outline-variant text-on-surface">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="deadline" className="text-on-surface">Deadline</Label>
                <Input defaultValue={task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''} id="deadline" name="deadline" type="datetime-local" className="bg-surface-container-high border-outline-variant text-on-surface [color-scheme:dark]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-on-surface">Task Title *</Label>
              <Input defaultValue={task.title} id="title" name="title" required className="bg-surface-container-high border-outline-variant text-on-surface" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-on-surface">Description</Label>
              <Textarea defaultValue={task.description} id="description" name="description" className="bg-surface-container-high border-outline-variant text-on-surface min-h-[100px]" />
            </div>

            <Button type="submit" className="w-full bg-inverse-surface text-inverse-on-surface hover:bg-inverse-surface/90" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
