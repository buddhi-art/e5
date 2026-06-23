'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Clock, Building2, CheckCircle2 } from 'lucide-react'
import { toggleSubtask, toggleSubSubtask, updateMainTaskStatus } from './actions'
import { toast } from 'sonner'
import { SubtaskCommentSection } from '@/components/subtask-comment-section'

type Comment = {
  id: string
  subtask_id: string
  author_id: string
  content: string
  created_at: string
  profiles: { full_name: string; role: string } | null
}

export function TaskCard({ task, commentsBySubtask }: { task: any; commentsBySubtask: Record<string, Comment[]> }) {
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
  const completedSubs = task.subtasks?.filter((s: any) => s.is_completed).length || 0
  const progress = totalSubs === 0 ? (task.status === 'completed' ? 100 : 0) : Math.round((completedSubs / totalSubs) * 100)

  return (
    <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-zinc-900 dark:text-white text-lg">
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
            <div className="flex items-center gap-2 mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span>{
                task.phase === 'Phase 1' ? 'Phase 1: Client Requirement' :
                task.phase === 'Phase 2' ? 'Phase 2: Pre-Production' :
                task.phase === 'Phase 3' ? 'Phase 3: Production' :
                task.phase === 'Phase 4' ? 'Phase 4: Post-Production' :
                task.phase === 'Phase 5' ? 'Phase 5: Delivery & SEO' : task.phase
              }</span>
            </div>
          </div>
          <Badge variant="outline" className={`
            ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
            ${task.status === 'in_progress' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' : ''}
            ${task.status === 'pending' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700' : ''}
          `}>
            {task.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {task.description && (
          <p className="text-zinc-600 dark:text-zinc-400 text-sm whitespace-pre-wrap">{task.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs font-medium">
          {task.deadline && (
            <div className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
              <Clock className="w-3.5 h-3.5" />
              Due: {new Date(task.deadline).toLocaleString()}
            </div>
          )}
        </div>

        {totalSubs > 0 && (
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Sub-Tasks</h4>
              <span className={`text-xs ${progress === 100 ? 'text-emerald-400' : 'text-sky-600 dark:text-sky-400'}`}>
                {completedSubs} of {totalSubs} completed
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 mb-4 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-sky-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="space-y-2">
              {task.subtasks.map((st: any) => {
                const subComments = commentsBySubtask[st.id] || []
                return (
                  <div key={st.id} className="bg-zinc-50 dark:bg-zinc-950/30 rounded-md border border-zinc-200 dark:border-zinc-800/80 overflow-hidden">
                    <div className="flex items-start gap-3 p-3 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-colors">
                      <Checkbox
                        id={`subtask-${st.id}`}
                        checked={st.is_completed}
                        disabled={loading === st.id}
                        onCheckedChange={() => handleSubtaskToggle(st.id, st.is_completed)}
                        className="mt-0.5 border-zinc-600 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                      />
                      <label
                        htmlFor={`subtask-${st.id}`}
                        className={`text-sm cursor-pointer select-none leading-tight ${st.is_completed ? 'text-zinc-500 dark:text-zinc-500 line-through' : 'text-zinc-700 dark:text-zinc-300 font-medium'}`}
                      >
                        {st.title}
                      </label>
                    </div>
                    
                    {/* Sub-sub-tasks */}
                    {st.sub_subtasks && st.sub_subtasks.length > 0 && (
                      <div className="pl-9 pr-3 pb-3 space-y-1.5 border-t border-zinc-100 dark:border-zinc-800/50 pt-2">
                        {st.sub_subtasks.map((sst: any) => (
                          <div key={sst.id} className="flex items-start gap-2.5">
                            <Checkbox
                              id={`sst-${sst.id}`}
                              checked={sst.is_completed}
                              disabled={loading === sst.id}
                              onCheckedChange={() => handleSubSubtaskToggle(sst.id, sst.is_completed)}
                              className="mt-0.5 w-3.5 h-3.5 border-zinc-400 dark:border-zinc-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                            />
                            <label
                              htmlFor={`sst-${sst.id}`}
                              className={`text-xs cursor-pointer select-none leading-tight ${sst.is_completed ? 'text-zinc-400 dark:text-zinc-600 line-through' : 'text-zinc-600 dark:text-zinc-400'}`}
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
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/50 flex items-center justify-end">
            <button
              onClick={() => handleMainStatusUpdate(task.status === 'completed' ? 'in_progress' : 'completed')}
              disabled={loading === 'main'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${task.status === 'completed'
                  ? 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800'
                  : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20'
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
