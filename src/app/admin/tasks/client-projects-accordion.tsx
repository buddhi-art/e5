'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronRight, FolderKanban, Calendar as CalendarIcon, CheckSquare } from 'lucide-react'

interface TaskOverview {
    id: string
    status: string
    deadline: string | null
}

interface ProjectOverview {
    id: string
    title: string
    status: string
    deleted_at?: string | null
    tasks: TaskOverview[]
}

interface ClientOverview {
    id: string
    company_name: string
    projects: ProjectOverview[]
}

export function ClientProjectsAccordion({ clients }: { clients: ClientOverview[] }) {
    const [expandedClient, setExpandedClient] = useState<string | null>(null)

    if (clients.length === 0) {
        return (
            <CardContent>
                <div className="text-center py-12">
                    <div className="text-zinc-500 mb-2">No active projects found.</div>
                    <p className="text-sm text-zinc-600">Create projects and assign tasks to see them here.</p>
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

                return (
                    <div key={client.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950/50">
                        {/* Client Header */}
                        <div 
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                            onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isExpanded ? 'bg-sky-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                    <FolderKanban className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900 dark:text-white">{client.company_name}</h3>
                                    <p className="text-xs text-zinc-500">{activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-xs text-zinc-500 hidden sm:flex items-center gap-4">
                                    {/* Aggregate stats could go here */}
                                </div>
                                {isExpanded ? <ChevronDown className="w-5 h-5 text-zinc-400" /> : <ChevronRight className="w-5 h-5 text-zinc-400" />}
                            </div>
                        </div>

                        {/* Projects List */}
                        {isExpanded && (
                            <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 p-2 space-y-2">
                                {activeProjects.map(project => {
                                    const totalTasks = project.tasks.length
                                    const completedTasks = project.tasks.filter(t => t.status === 'completed').length
                                    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)
                                    
                                    // Find next deadline
                                    const upcomingDeadlines = project.tasks
                                        .filter(t => t.deadline && t.status !== 'completed')
                                        .map(t => new Date(t.deadline!))
                                        .sort((a, b) => a.getTime() - b.getTime())
                                    
                                    const nextDeadline = upcomingDeadlines.length > 0 ? upcomingDeadlines[0] : null

                                    return (
                                        <Link 
                                            href={`/admin/projects/${project.id}`} 
                                            key={project.id}
                                            className="block p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-sky-300 dark:hover:border-sky-700/50 transition-colors"
                                        >
                                            <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                                                <div>
                                                    <h4 className="font-medium text-sm text-zinc-900 dark:text-white">{project.title}</h4>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                                            {project.status.replace('_', ' ')}
                                                        </span>
                                                        
                                                        {nextDeadline && (
                                                            <span className="text-xs flex items-center gap-1 text-orange-500">
                                                                <CalendarIcon className="w-3 h-3" />
                                                                Next deadline: {nextDeadline.toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="w-full sm:w-auto flex items-center gap-4">
                                                    <div className="w-32">
                                                        <div className="flex justify-between text-[10px] text-zinc-500 mb-1 font-medium">
                                                            <span>Progress</span>
                                                            <span className={progress === 100 ? 'text-emerald-500' : ''}>{progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-sky-500'}`} 
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 min-w-[80px] justify-end">
                                                        <CheckSquare className="w-3.5 h-3.5" />
                                                        {completedTasks} / {totalTasks}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )
            })}
        </CardContent>
    )
}
