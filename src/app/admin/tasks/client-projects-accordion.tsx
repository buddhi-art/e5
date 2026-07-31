/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CardContent } from '@/components/ui/card'
import {
  ChevronDown, ChevronRight, FolderKanban,
  Calendar as CalendarIcon, CheckSquare, Clock,
  Plus, X, Trash2, User, Package, PlayCircle, FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  addDeliverableSubItem,
  toggleSubSubtask,
  removeSubSubtask,
  assignSubtaskEmployee,
  removeSubtask,
  syncDeliverableSubtasks,
} from './actions'
import { PHASE_LABELS } from '@/lib/phase-workspace'

// ─── Types ───────────────────────────────────────────────────────────

interface SubSubTask {
  id: string
  title: string
  is_completed: boolean
}

interface Subtask {
  id: string
  title: string
  is_completed: boolean
  deliverable_id: string | null
  assigned_to: string | null
  sort_order: number
  status: string
  sub_subtasks: SubSubTask[]
}

interface Task {
  id: string
  title: string
  status: string
  phase: string
  deadline: string | null
  start_date: string | null
  assigned_to: string | null
  logistics: any
  subtasks: Subtask[]
}

interface Project {
  id: string
  title: string
  status: string
  deleted_at?: string | null
  package_id?: string | null
  tasks: Task[]
}

interface Client {
  id: string
  company_name: string
  projects: Project[]
}

// ─── Helpers ─────────────────────────────────────────────────────────

function phaseLabel(phase: string): string {
  return PHASE_LABELS[phase] || phase
}

function taskStatusBadge(status: string) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border'
  switch (status) {
    case 'completed':
      return `${base} bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400`
    case 'in_progress':
      return `${base} bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400`
    default:
      return `${base} bg-surface-container-high text-on-surface-variant border-outline-variant`
  }
}

function subtaskStatusBadge(status: string) {
  const base = 'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide'
  switch (status) {
    case 'completed':
      return `${base} bg-emerald-500/10 text-emerald-600 dark:text-emerald-400`
    case 'in_progress':
      return `${base} bg-sky-500/10 text-sky-600 dark:text-sky-400`
    default:
      return `${base} bg-surface-container-high text-on-surface-variant`
  }
}

// ─── Sub-task (deliverable) card ─────────────────────────────────────

function SubtaskCard({
  subtask,
  employees,
  onRefresh,
}: {
  subtask: Subtask
  employees: any[]
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [adding, setAdding] = useState(false)
  const [assigning, setAssigning] = useState(false)

  async function handleAddItem() {
    const trimmed = newItem.trim()
    if (!trimmed) return
    setAdding(true)
    const res = await addDeliverableSubItem(subtask.id, trimmed)
    setAdding(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Item added')
      setNewItem('')
      onRefresh()
    }
  }

  async function handleToggleSub(subSubId: string, isCompleted: boolean) {
    const res = await toggleSubSubtask(subSubId, isCompleted)
    if (res.error) toast.error(res.error)
    else onRefresh()
  }

  async function handleRemoveSub(subSubId: string) {
    const res = await removeSubSubtask(subSubId)
    if (res.error) toast.error(res.error)
    else onRefresh()
  }

  async function handleAssign(empId: string | null) {
    setAssigning(true)
    const res = await assignSubtaskEmployee(subtask.id, empId)
    setAssigning(false)
    if (res.error) toast.error(res.error)
    else {
      toast.success(empId ? 'Assigned' : 'Unassigned')
      onRefresh()
    }
  }

  async function handleRemoveSubtask() {
    if (!confirm('Remove this deliverable subtask and all its items?')) return
    const res = await removeSubtask(subtask.id)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Subtask removed')
      onRefresh()
    }
  }

  const completedItems = subtask.sub_subtasks.filter(s => s.is_completed).length
  const totalItems = subtask.sub_subtasks.length
  const assignee = employees.find(e => e.id === subtask.assigned_to)

  return (
    <div className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest overflow-hidden">
      {/* Subtask header */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface-container-high/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight className={`w-3.5 h-3.5 text-outline shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />

        {/* Completion dot */}
        <div className={`w-2 h-2 rounded-full shrink-0 ${subtask.is_completed ? 'bg-emerald-500' : 'bg-surface-container-highest'}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium ${subtask.is_completed ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
              {subtask.title}
            </span>
            {subtask.deliverable_id && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20 dark:text-purple-400">
                <Package className="w-2.5 h-2.5" /> Deliverable
              </span>
            )}
            <span className={subtaskStatusBadge(subtask.status)}>{subtask.status.replace('_', ' ')}</span>
          </div>
          {totalItems > 0 && (
            <span className="text-[10px] text-on-surface-variant mt-0.5 inline-block">
              {completedItems}/{totalItems} items
            </span>
          )}
        </div>

        {/* Assignee */}
        {assignee && (
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-on-surface-variant shrink-0">
            <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[8px]">
              {assignee.full_name.charAt(0)}
            </div>
            <span className="truncate max-w-[60px]">{assignee.full_name}</span>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleRemoveSubtask() }}
          className="text-on-surface-variant hover:text-m3-error p-1 shrink-0"
          title="Remove subtask"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Expanded content: sub-sub-tasks + assignment */}
      {expanded && (
        <div className="border-t border-outline-variant/40 px-3 py-2.5 bg-surface-container-low/30 space-y-3">
          {/* Employee assignment for this subtask */}
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-on-surface-variant shrink-0" />
            <select
              value={subtask.assigned_to || ''}
              onChange={(e) => handleAssign(e.target.value || null)}
              disabled={assigning}
              className="flex-1 max-w-[200px] px-2 py-1 text-[11px] bg-surface-container-lowest border border-outline-variant rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            >
              <option value="">— Unassigned —</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Sub-sub-tasks list */}
          {subtask.sub_subtasks.length > 0 && (
            <div className="space-y-1 pl-1">
              {subtask.sub_subtasks.map(sst => (
                <div key={sst.id} className="flex items-center gap-2 group">
                  <button
                    type="button"
                    onClick={() => handleToggleSub(sst.id, !sst.is_completed)}
                    className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-colors ${
                      sst.is_completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-outline-variant hover:border-primary'
                    }`}
                  >
                    {sst.is_completed && <CheckSquare className="w-2.5 h-2.5" />}
                  </button>
                  <span className={`text-[11px] flex-1 ${sst.is_completed ? 'text-on-surface-variant line-through' : 'text-on-surface-variant'}`}>
                    {sst.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSub(sst.id)}
                    className="text-on-surface-variant hover:text-m3-error p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add sub-sub-task */}
          <div className="flex gap-1.5 pl-1">
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem() } }}
              placeholder="Add an actionable item..."
              className="flex-1 px-2 py-1 text-[11px] bg-surface-container-lowest border border-outline-variant rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={handleAddItem}
              disabled={adding}
              className="shrink-0 px-2 py-1 text-[11px] font-semibold bg-primary/10 text-primary rounded-md hover:bg-primary/20"
            >
              <Plus className="w-3 h-3 inline" /> Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Task card ───────────────────────────────────────────────────────

function TaskCard({
  task,
  employees,
  onRefresh,
}: {
  task: Task
  employees: any[]
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const completedSubs = task.subtasks.filter(s => s.is_completed).length
  const totalSubs = task.subtasks.length
  const progress = totalSubs === 0 ? (task.status === 'completed' ? 100 : 0) : Math.round((completedSubs / totalSubs) * 100)
  const assignee = employees.find(e => e.id === task.assigned_to)

  // Extract a clean display title
  const displayTitle = (() => {
    const match = task.title.match(/^E5_Task_\d+\s*-\s*(.*)/)
    return match ? match[1] : task.title
  })()

  // Parse logistics for time summary (Phase 2/3)
  const logistics = task.logistics || {}
  const hasTimeInfo = logistics.shootDate || logistics.editingDate || logistics.startTime || logistics.endTime

  return (
    <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low overflow-hidden">
      {/* Task header */}
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-surface-container-high/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight className={`w-4 h-4 text-outline shrink-0 mt-1 transition-transform ${expanded ? 'rotate-90' : ''}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-sm text-on-surface">{displayTitle}</h4>
            <span className={taskStatusBadge(task.status)}>{task.status.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
              <PlayCircle className="w-3 h-3" />
              {phaseLabel(task.phase)}
            </span>

            {assignee && (
              <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[8px]">
                  {assignee.full_name.charAt(0)}
                </div>
                {assignee.full_name}
              </span>
            )}

            {task.deadline && (
              <span className="text-[10px] text-primary flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {new Date(task.deadline).toLocaleDateString()}
              </span>
            )}

            {hasTimeInfo && (
              <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {logistics.shootDate || logistics.editingDate || ''}
                {(logistics.startTime || logistics.endTime) && ` ${logistics.startTime || '?'}–${logistics.endTime || '?'}`}
              </span>
            )}

            <span className="text-[10px] text-on-surface-variant ml-auto">
              {totalSubs > 0 ? (
                <span className={progress === 100 ? 'text-emerald-500' : ''}>
                  {completedSubs} / {totalSubs} subtasks
                </span>
              ) : (
                'No subtasks'
              )}
            </span>
          </div>

          {/* Progress bar */}
          {totalSubs > 0 && (
            <div className="w-full bg-surface-container-highest h-1 mt-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Expanded: subtasks (deliverable-linked + manual) */}
      {expanded && (
        <div className="border-t border-outline-variant/40 px-3 py-3 bg-surface-container-low/20 space-y-2">
          {task.subtasks.length > 0 ? (
            <div className="space-y-1.5">
              {task.subtasks
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(st => (
                  <SubtaskCard
                    key={st.id}
                    subtask={st}
                    employees={employees}
                    onRefresh={onRefresh}
                  />
                ))}
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant text-center py-3">
              No subtasks yet. Deliverables from the package will appear here when synced.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Project card ────────────────────────────────────────────────────

function ProjectCard({
  project,
  employees,
  onRefresh,
}: {
  project: Project
  employees: any[]
  onRefresh: () => void
}) {
  const [syncing, setSyncing] = useState(false)

  async function handleSync() {
    setSyncing(true)
    const res = await syncDeliverableSubtasks(project.id)
    setSyncing(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      const count = (res as any).synced ?? 0
      toast.success(count > 0 ? `${count} deliverable${count === 1 ? '' : 's'} synced` : 'All deliverables already synced')
      onRefresh()
    }
  }

  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter(t => t.status === 'completed').length
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

  const upcomingDeadlines = project.tasks
    .filter(t => t.deadline && t.status !== 'completed')
    .map(t => new Date(t.deadline!))
    .sort((a, b) => a.getTime() - b.getTime())
  const nextDeadline = upcomingDeadlines.length > 0 ? upcomingDeadlines[0] : null

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden hover:border-primary/40 transition-colors">
      {/* Project header */}
      <Link
        href={`/admin/projects/${project.id}`}
        className="block p-3 hover:bg-surface-container-high/30 transition-colors"
      >
        <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm text-on-surface truncate">{project.title}</h4>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant border border-outline-variant">
                {project.status.replace('_', ' ')}
              </span>
              {nextDeadline && (
                <span className="text-xs flex items-center gap-1 text-primary">
                  <CalendarIcon className="w-3 h-3" />
                  {nextDeadline.toLocaleDateString()}
                </span>
              )}
              {project.package_id && (
                <span className="text-[10px] flex items-center gap-1 text-purple-600 dark:text-purple-400">
                  <Package className="w-3 h-3" />
                  Package linked
                </span>
              )}
            </div>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-4">
            <div className="w-32">
              <div className="flex justify-between text-[10px] text-outline mb-1 font-medium">
                <span>Progress</span>
                <span className={progress === 100 ? 'text-emerald-500' : ''}>{progress}%</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-outline min-w-[80px] justify-end">
              <CheckSquare className="w-3.5 h-3.5" />
              {completedTasks} / {totalTasks}
            </div>
          </div>
        </div>
      </Link>

      {/* Task list */}
      {project.tasks.length > 0 && (
        <div className="px-3 pb-3 space-y-2">
          {project.tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              employees={employees}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}

      {/* Sync deliverables button */}
      {project.package_id && (
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-primary border border-primary/30 bg-primary/5 rounded-lg hover:bg-primary/10 disabled:opacity-50"
          >
            <Plus className="w-3 h-3" />
            {syncing ? 'Syncing...' : 'Sync deliverables'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main accordion ──────────────────────────────────────────────────

export function ClientProjectsAccordion({
  clients,
  employees,
  onRefresh,
}: {
  clients: Client[]
  employees: any[]
  onRefresh?: () => void
}) {
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const router = useRouter()

  const handleRefresh = useCallback(() => {
    // Trigger a server-side re-render so the expanded tree reflects
    // the latest DB state (new subtasks, toggled completions, etc.)
    router.refresh()
    if (onRefresh) onRefresh()
  }, [router, onRefresh])

  if (clients.length === 0) {
    return (
      <CardContent>
        <div className="text-center py-12">
          <div className="text-outline mb-2">No active projects found.</div>
          <p className="text-sm text-on-surface-variant">Create projects and assign tasks to see them here.</p>
        </div>
      </CardContent>
    )
  }

  return (
    <CardContent className="space-y-4">
      {clients.map(client => {
        const activeProjects = client.projects.filter(p => p.status !== 'completed' && !p.deleted_at)
        if (activeProjects.length === 0) return null

        const isExpanded = expandedClient === client.id
        const totalTasks = activeProjects.reduce((sum, p) => sum + p.tasks.length, 0)
        const completedTasks = activeProjects.reduce(
          (sum, p) => sum + p.tasks.filter(t => t.status === 'completed').length, 0
        )

        return (
          <div key={client.id} className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest morph-fade-in">
            {/* Client Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-container-high transition-colors"
              onClick={() => setExpandedClient(isExpanded ? null : client.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isExpanded ? 'bg-primary text-primary-foreground' : 'bg-surface-container-high text-outline'}`}>
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface">{client.company_name}</h3>
                  <p className="text-xs text-outline">
                    {activeProjects.length} project{activeProjects.length !== 1 ? 's' : ''} · {totalTasks} task{totalTasks !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 text-xs text-outline">
                  <CheckSquare className="w-3.5 h-3.5" />
                  {completedTasks}/{totalTasks}
                </div>
                {isExpanded ? <ChevronDown className="w-5 h-5 text-outline" /> : <ChevronRight className="w-5 h-5 text-outline" />}
              </div>
            </div>

            {/* Projects List */}
            {isExpanded && (
              <div className="border-t border-outline-variant bg-surface-container-low p-2 space-y-2">
                {activeProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    employees={employees}
                    onRefresh={handleRefresh}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </CardContent>
  )
}
