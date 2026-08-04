'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Clock, CheckCircle2 } from 'lucide-react'
import { toggleSubtask, toggleSubSubtask, updateMainTaskStatus } from './actions'
import { toast } from 'sonner'
import { SubtaskCommentSection } from '@/components/subtask-comment-section'
import { TaskLogisticsView } from '@/components/task-logistics-view'
import { TaskPhaseActions } from '@/components/employee/task-phase-actions'
import { isWorkspacePhase, PHASE_LABELS } from '@/lib/phase-workspace'
import type { ChecklistItem } from '@/lib/validations'

type Comment = {
  id: string
  subtask_id: string
  author_id: string
  content: string
  created_at: string
  profiles: { full_name: string; role: string } | null
}

type SubSubtask = { id: string; title: string; is_completed: boolean }
type Subtask = { id: string; title: string; is_completed: boolean; sub_subtasks?: SubSubtask[] }
type LogisticsData = {
  shootDate?: string
  editingDate?: string
  startTime?: string
  endTime?: string
  checklist?: ChecklistItem[]
  [key: string]: unknown
}
type Project = { title?: string | null; clients?: { company_name?: string | null } | null }
type Task = {
  id: string
  title: string
  status: string
  phase: string
  description?: string | null
  deadline?: string | null
  logistics?: LogisticsData | null
  projects?: Project | null
  subtasks?: Subtask[]
}

export function TaskCard({ task, commentsBySubtask }: { task: Task; commentsBySubtask: Record<string, Comment[]> }) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubtaskToggle = async (subtaskId: string, currentStatus: boolean) => {
    setLoading(subtaskId)
    const result = await toggleSubtask(subtaskId, !currentStatus)
    if (result.error) {
      toast.error('Failed to update: ' + result.error)
    }
    setLoading(null)
  }

  const handleMainStatusUpdate = async (status: string) => {
    setLoading('main')
    const result = await updateMainTaskStatus(task.id, status)
    if (result.error) {
      toast.error('Failed to update: ' + result.error)
    }
    setLoading(null)
  }

  const handleSubSubtaskToggle = async (subSubtaskId: string, currentStatus: boolean) => {
    setLoading(subSubtaskId)
    const result = await toggleSubSubtask(subSubtaskId, !currentStatus)
    if (result.error) {
      toast.error('Failed to update: ' + result.error)
    }
    setLoading(null)
  }

  const totalSubs = task.subtasks?.length || 0
  const completedSubs = task.subtasks?.filter(s => s.is_completed).length || 0
  const progress = totalSubs === 0 ? (task.status === 'completed' ? 100 : 0) : Math.round((completedSubs / totalSubs) * 100)
  const workspacePhase = isWorkspacePhase(task.phase) ? task.phase : null
  const phaseChipClass: Record<string, string> = {
    'Phase 1': 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    'Phase 2': 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',
    'Phase 3': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    'Phase 4': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    'Phase 5': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  }

  return (
    <Card className="bg-surface-container-lowest border-outline-variant/40 card-morph morph-fade-in">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-foreground text-lg">
              {(() => {
                const match = task.title.match(/^E5_Task_(\d+)\s*-\s*(.*)/);
                const clientName = task.projects?.clients?.company_name || 'Client';
                const projectName = task.projects?.title || 'Project';
                if (match) {
                  return `E5 - ${clientName} - ${projectName} - ${match[2]} - ${match[1]}`;
                }
                return `E5 - ${clientName} - ${projectName} - ${task.title}`;
              })()}
            </CardTitle>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className={`rounded-full px-2.5 py-1 text-xs font-medium ${phaseChipClass[task.phase] ?? 'bg-surface-container-high text-on-surface-variant border-outline-variant/40'}`}>
                {PHASE_LABELS[task.phase] ?? task.phase}
              </Badge>
            </div>
          </div>
          <Badge variant="outline" className={`
            ${task.status === 'completed' ? 'bg-tertiary-container/40 text-tertiary border-tertiary/30' : ''}
            ${task.status === 'in_progress' ? 'bg-primary-container/40 text-primary border-primary/30' : ''}
            ${task.status === 'pending' ? 'bg-surface-container-high text-on-surface-variant border-outline-variant/40' : ''}
          `}>
            {task.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {task.description && (
          <p className="text-on-surface-variant text-sm whitespace-pre-wrap">{task.description}</p>
        )}

        {/* Logistics Information */}
          <TaskLogisticsView
            logistics={task.logistics || {}}

          phase={task.phase}
        />

        {workspacePhase && (
          <TaskPhaseActions
            taskId={task.id}
            phase={workspacePhase}
            logistics={task.logistics || {}}
          />
        )}

        <div className="flex items-center gap-4 text-xs font-medium">
          {task.deadline && (
            <div className="flex items-center gap-1.5 text-tertiary bg-tertiary-container/30 px-2 py-1 rounded border border-tertiary/20">
              <Clock className="w-3.5 h-3.5" />
              Due: {new Date(task.deadline).toLocaleString()}
            </div>
          )}
        </div>

        {totalSubs > 0 && (
          <div className="pt-4 border-t border-outline-variant/40/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-foreground uppercase tracking-wider">Sub-Tasks</h4>
              <span className={`text-xs ${progress === 100 ? 'text-tertiary' : 'text-primary'}`}>
                {completedSubs} of {totalSubs} completed
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-surface-container-high h-1.5 mb-4 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-tertiary' : 'bg-primary'}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="space-y-2">
              {task.subtasks?.map(st => {
                const subComments = commentsBySubtask[st.id] || []
                return (
                  <div key={st.id} className="bg-surface-container-high rounded-md border border-outline-variant/40/80 overflow-hidden">
                    <div className="flex items-start gap-3 p-3 hover:bg-surface-container-highest transition-colors">
                      <Checkbox
                        id={`subtask-${st.id}`}
                        checked={st.is_completed}
                        disabled={loading === st.id}
                        onCheckedChange={() => handleSubtaskToggle(st.id, st.is_completed)}
                        className="mt-0.5 border-outline data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <label
                        htmlFor={`subtask-${st.id}`}
                        className={`text-sm cursor-pointer select-none leading-tight ${st.is_completed ? 'text-on-surface-variant line-through' : 'text-foreground font-medium'}`}
                      >
                        {st.title}
                      </label>
                    </div>

                    {/* Sub-sub-tasks */}
                    {st.sub_subtasks && st.sub_subtasks.length > 0 && (
                      <div className="pl-9 pr-3 pb-3 space-y-1.5 border-t border-outline-variant/20 pt-2">
                        {st.sub_subtasks?.map(sst => (
                          <div key={sst.id} className="flex items-start gap-2.5">
                            <Checkbox
                              id={`sst-${sst.id}`}
                              checked={sst.is_completed}
                              disabled={loading === sst.id}
                              onCheckedChange={() => handleSubSubtaskToggle(sst.id, sst.is_completed)}
                              className="mt-0.5 w-3.5 h-3.5 border-outline data-[state=checked]:bg-tertiary data-[state=checked]:border-tertiary"
                            />
                            <label
                              htmlFor={`sst-${sst.id}`}
                              className={`text-xs cursor-pointer select-none leading-tight ${sst.is_completed ? 'text-outline line-through' : 'text-on-surface-variant'}`}
                            >
                              {sst.title}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="px-3 pb-3">
                      <SubtaskCommentSection subtaskId={st.id} initialComments={subComments} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {totalSubs === 0 && (
          <div className="pt-4 border-t border-outline-variant/40/50 flex items-center justify-end">
            <button
              onClick={() => handleMainStatusUpdate(task.status === 'completed' ? 'in_progress' : 'completed')}
              disabled={loading === 'main'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${task.status === 'completed'
                ? 'text-on-surface-variant hover:text-foreground bg-surface-container-high'
                : 'text-tertiary bg-tertiary-container/40 hover:bg-tertiary-container/60 border border-tertiary/30'
                }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {task.status === 'completed' ? 'Mark as Incomplete' : 'Mark Task as Completed'}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
