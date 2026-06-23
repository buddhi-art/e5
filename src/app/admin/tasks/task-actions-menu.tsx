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
        <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors outline-none">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)} className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <Edit className="w-4 h-4 mr-2" />
            Edit Task
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />
          <DropdownMenuItem onClick={handleDelete} disabled={loading} className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-white">Edit Task</DialogTitle>
          </DialogHeader>
          <form action={handleUpdate} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Project</Label>
                <Select value={projectId} onValueChange={(val) => setProjectId(val || '')}>
                  <SelectTrigger className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white">
                    <SelectValue placeholder="Select Project">
                      {projectId ? projects.find(p => p.id === projectId)?.title : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white max-h-[300px]">
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Phase</Label>
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

              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Assign To</Label>
                <Select value={assignedTo} onValueChange={(val) => setAssignedTo(val || '')}>
                  <SelectTrigger className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white">
                    <SelectValue placeholder="Select Employee">
                      {assignedTo ? employees.find(e => e.id === assignedTo)?.full_name : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white max-h-[300px]">
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val || '')}>
                  <SelectTrigger className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white">
                    <SelectValue placeholder="Select Status">
                      {status === 'pending' && 'Pending'}
                      {status === 'in_progress' && 'In Progress'}
                      {status === 'completed' && 'Completed'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="deadline" className="text-zinc-700 dark:text-zinc-300">Deadline</Label>
                <Input defaultValue={task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''} id="deadline" name="deadline" type="datetime-local" className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white [color-scheme:dark]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-zinc-700 dark:text-zinc-300">Task Title *</Label>
              <Input defaultValue={task.title} id="title" name="title" required className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-700 dark:text-zinc-300">Description</Label>
              <Textarea defaultValue={task.description} id="description" name="description" className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white min-h-[100px]" />
            </div>

            <Button type="submit" className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
