import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FolderKanban, CheckCircle, Clock, AlertTriangle, User } from 'lucide-react'

export const revalidate = 300

export default async function FounderProjectsPage() {
    const supabase = await createClient()

    // Fetch all projects with their tasks and employee assignments
    const { data: projects, error } = await supabase
        .from('projects')
        .select(`
            *,
            clients(company_name),
            tasks(
                id,
                title,
                status,
                deadline,
                profiles(full_name)
            )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (error) console.error('Projects fetch error:', error.message)

    const projectList = projects || []

    // Compute stats per project
    const projectStats = projectList.map((project: any) => {
        const tasks = project.tasks || []
        const totalTasks = tasks.length
        const completedTasks = tasks.filter((t: any) => t.status === 'completed').length
        const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress').length
        const overdueTasks = tasks.filter((t: any) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length
        const assignees = [...new Set(tasks.filter((t: any) => t.profiles?.full_name).map((t: any) => t.profiles.full_name))]
        return { ...project, totalTasks, completedTasks, inProgressTasks, overdueTasks, assignees }
    })

    const activeProjects = projectStats.filter((p: any) => p.status !== 'completed')
    const completedProjects = projectStats.filter((p: any) => p.status === 'completed')

    return (
        <div className="space-y-8">
            <div className="morph-fade-in">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight flex items-center gap-3">
                    <FolderKanban className="w-8 h-8 text-amber-500" />
                    Projects Overview
                </h1>
                <p className="text-base text-on-surface-variant mt-2">
                    {activeProjects.length} active projects, {completedProjects.length} completed — with task progress and assignments.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 morph-fade-in morph-delay-2">
                <Card className="bg-surface-container-lowest ring-1 ring-outline-variant/40 card-morph">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-foreground">{projectList.length}</div>
                        <div className="text-xs text-on-surface-variant font-medium">Total Projects</div>
                    </CardContent>
                </Card>
                <Card className="bg-surface-container-lowest ring-1 ring-outline-variant/40 card-morph">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-emerald-500">{activeProjects.filter((p: any) => p.status === 'in_progress').length}</div>
                        <div className="text-xs text-on-surface-variant font-medium">In Progress</div>
                    </CardContent>
                </Card>
                <Card className="bg-surface-container-lowest ring-1 ring-outline-variant/40 card-morph">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-tertiary">{completedProjects.length}</div>
                        <div className="text-xs text-on-surface-variant font-medium">Completed</div>
                    </CardContent>
                </Card>
                <Card className="bg-surface-container-lowest ring-1 ring-outline-variant/40 card-morph">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-amber-500">{activeProjects.filter((p: any) => p.status === 'not_started').length}</div>
                        <div className="text-xs text-on-surface-variant font-medium">Not Started</div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Projects */}
            <section className="morph-fade-in morph-delay-3">
                <h2 className="text-xl font-bold text-foreground mb-4">Active Projects</h2>
                <div className="grid grid-cols-1 gap-4">
                    {activeProjects.map((project: any, i: number) => (
                        <div key={project.id}
                            className="rounded-2xl bg-surface-container-lowest ring-1 ring-outline-variant/40 p-5 card-morph morph-fade-in"
                            style={{ animationDelay: `${i * 80}ms` }}>
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-foreground text-lg">{project.title}</h3>
                                        <Badge variant="outline"
                                            className={
                                                project.status === 'in_progress'
                                                    ? 'bg-primary-container text-primary border-primary/30'
                                                    : 'bg-surface-container-high text-on-surface-variant border-outline-variant/30'
                                            }>
                                            {project.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-on-surface-variant mb-2">
                                        Client: <span className="font-medium text-foreground">{project.clients?.company_name || 'N/A'}</span>
                                    </p>

                                    {/* Task progress */}
                                    {project.totalTasks > 0 && (
                                        <div className="flex items-center gap-4 text-xs text-on-surface-variant flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <CheckCircle className="w-3.5 h-3.5 text-tertiary" />
                                                {project.completedTasks}/{project.totalTasks} done
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-primary" />
                                                {project.inProgressTasks} in progress
                                            </span>
                                            {project.overdueTasks > 0 && (
                                                <span className="flex items-center gap-1 text-destructive">
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    {project.overdueTasks} overdue
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <User className="w-3.5 h-3.5" />
                                                {project.assignees.length || 0} assignees
                                            </span>
                                        </div>
                                    )}
                                    {project.totalTasks === 0 && (
                                        <p className="text-xs text-on-surface-variant italic">No tasks assigned yet.</p>
                                    )}
                                </div>

                                {/* Progress ring */}
                                {project.totalTasks > 0 && (
                                    <div className="shrink-0 flex items-center gap-3">
                                        <div className="relative w-14 h-14">
                                            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3"
                                                    className="text-surface-container-high" />
                                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3"
                                                    strokeDasharray={`${(project.completedTasks / project.totalTasks) * 97.4} 97.4`}
                                                    strokeLinecap="round"
                                                    className="text-tertiary transition-all duration-700" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[10px] font-bold text-foreground">
                                                    {Math.round((project.completedTasks / project.totalTasks) * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-on-surface-variant leading-tight">
                                            <span className="block font-medium text-foreground">Progress</span>
                                            {project.completedTasks}/{project.totalTasks} tasks
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {activeProjects.length === 0 && (
                        <div className="text-center py-12 text-on-surface-variant">No active projects.</div>
                    )}
                </div>
            </section>

            {/* Completed Projects */}
            {completedProjects.length > 0 && (
                <section className="morph-fade-in morph-delay-4">
                    <h2 className="text-xl font-bold text-foreground mb-4">Completed Projects</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {completedProjects.map((project: any) => (
                            <div key={project.id}
                                className="rounded-2xl bg-surface-container-lowest ring-1 ring-outline-variant/40 p-4 card-morph">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className="w-4 h-4 text-tertiary shrink-0" />
                                    <h3 className="font-medium text-foreground truncate">{project.title}</h3>
                                </div>
                                <p className="text-xs text-on-surface-variant">
                                    {project.clients?.company_name || 'N/A'}
                                </p>
                                <p className="text-[10px] text-outline mt-2">
                                    {project.totalTasks} tasks · {project.completedTasks} completed
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
