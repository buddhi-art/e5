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
                                    <p className="text-xs text-outline">{activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-xs text-outline hidden sm:flex items-center gap-4">
                                    {/* Aggregate stats could go here */}
                                </div>
                                {isExpanded ? <ChevronDown className="w-5 h-5 text-outline" /> : <ChevronRight className="w-5 h-5 text-outline" />}
                            </div>
                        </div>

                        {/* Projects List */}
                        {isExpanded && (
                            <div className="border-t border-outline-variant bg-surface-container-low p-2 space-y-2">
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
                                            className="block p-3 rounded-lg border border-outline-variant bg-surface-container-lowest hover:border-primary transition-colors card-morph"
                                        >
                                            <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                                                <div>
                                                    <h4 className="font-medium text-sm text-on-surface">{project.title}</h4>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant border border-outline-variant">
                                                            {project.status.replace('_', ' ')}
                                                        </span>

                                                        {nextDeadline && (
                                                            <span className="text-xs flex items-center gap-1 text-primary">
                                                                <CalendarIcon className="w-3 h-3" />
                                                                Next deadline: {nextDeadline.toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="w-full sm:w-auto flex items-center gap-4">
                                                    <div className="w-32">
                                                        <div className="flex justify-between text-[10px] text-outline mb-1 font-medium">
                                                            <span>Progress</span>
                                                            <span className={progress === 100 ? 'text-m3-success' : ''}>{progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-m3-success' : 'bg-primary'}`}
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
