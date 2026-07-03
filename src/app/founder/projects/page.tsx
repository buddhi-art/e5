import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ProjectForm } from '@/app/admin/projects/project-form'
import { ProjectStatusSelect } from '@/app/admin/projects/project-status-select'
import { ProjectActionsMenu } from '@/app/admin/projects/project-actions-menu'
import { Archive, FolderKanban, CheckCircle, Clock, AlertTriangle, User } from 'lucide-react'

export const revalidate = 300

export default async function FounderProjectsPage() {
    const supabase = await createClient()

    const { data: allProjects, error } = await supabase
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
        .order('created_at', { ascending: false })

    if (error) console.error('Projects fetch error:', error.message)

    // Split active vs archived
    const activeProjects = (allProjects || []).filter((p: any) => !p.deleted_at)
    const archivedProjects = (allProjects || []).filter((p: any) => !!p.deleted_at)

    const { data: clients, error: clientsErr } = await supabase
        .from('clients')
        .select('id, company_name')
        .order('company_name', { ascending: true })

    if (clientsErr) console.error('Clients fetch error:', clientsErr.message)

    const typedClients = (clients || []) as { id: string; company_name: string }[]

    // Compute stats per active project
    const activeProjectStats = activeProjects.map((project: any) => {
        const tasks = project.tasks || []
        const totalTasks = tasks.length
        const completedTasks = tasks.filter((t: any) => t.status === 'completed').length
        const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress').length
        const overdueTasks = tasks.filter((t: any) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length
        const assignees = [...new Set(tasks.filter((t: any) => t.profiles?.full_name).map((t: any) => t.profiles.full_name))]
        return { ...project, totalTasks, completedTasks, inProgressTasks, overdueTasks, assignees }
    })

    return (
        <div className="space-y-6">
            <div className="morph-fade-in">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight flex items-center gap-3">
                    <FolderKanban className="w-8 h-8 text-primary" />
                    Projects
                </h1>
                <p className="text-base text-on-surface-variant mt-2">
                    Manage client projects — {activeProjects.length} active, {archivedProjects.length} archived.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 morph-fade-in morph-delay-2">
                        <Tabs defaultValue="active">
                            <CardHeader className="pb-0">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-on-surface">All Projects</CardTitle>
                                    <TabsList className="bg-surface-container-high border-outline-variant/50">
                                        <TabsTrigger value="active" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-on-surface">
                                            Active ({activeProjects?.length || 0})
                                        </TabsTrigger>
                                        <TabsTrigger value="archived" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-on-surface">
                                            Archived ({archivedProjects?.length || 0})
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                                <CardDescription className="text-on-surface-variant mt-2">List of all production projects.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <TabsContent value="active" className="mt-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-outline-variant/50 hover:bg-surface-container-high">
                                                <TableHead className="text-on-surface-variant">Project Title</TableHead>
                                                <TableHead className="text-on-surface-variant">Client</TableHead>
                                                <TableHead className="text-on-surface-variant">Progress</TableHead>
                                                <TableHead className="text-on-surface-variant">Status</TableHead>
                                                <TableHead className="text-on-surface-variant text-right w-[60px]">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {activeProjectStats && activeProjectStats.length > 0 ? (
                                                activeProjectStats.map((project: any) => (
                                                    <TableRow key={project.id} className="border-outline-variant/50 hover:bg-surface-container-high transition-colors">
                                                        <TableCell className="font-medium text-on-surface">{project.title}</TableCell>
                                                        <TableCell className="text-on-surface">{project.clients?.company_name || 'Unknown'}</TableCell>
                                                        <TableCell>
                                                            {project.totalTasks > 0 ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-20 h-2 bg-surface-container-high rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-m3-success rounded-full transition-all"
                                                                            style={{ width: `${Math.round((project.completedTasks / project.totalTasks) * 100)}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs text-outline">{project.completedTasks}/{project.totalTasks}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-outline">No tasks</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <ProjectStatusSelect projectId={project.id} currentStatus={project.status} />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <ProjectActionsMenu project={project} clients={typedClients} />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow><TableCell colSpan={5} className="text-center py-6 text-outline">No active projects found.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TabsContent>
                                <TabsContent value="archived" className="mt-0">
                                    {archivedProjects && archivedProjects.length > 0 ? (
                                        <div className="space-y-3">
                                            {archivedProjects.map((project: any) => (
                                                <div key={project.id} className="flex items-center justify-between p-3 shape-medium bg-surface-container-low border border-outline-variant/50 card-morph">
                                                    <div className="flex items-center gap-3">
                                                        <Archive className="w-4 h-4 text-outline shrink-0" />
                                                        <div>
                                                            <div className="font-medium text-on-surface">{project.title}</div>
                                                            <div className="text-xs text-outline">{project.clients?.company_name || 'Unknown'} &middot; Archived {new Date(project.deleted_at).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                    <ProjectActionsMenu project={project} clients={typedClients} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-outline">No archived projects.</div>
                                    )}
                                </TabsContent>
                            </CardContent>
                        </Tabs>
                    </Card>
                </div>

                <div>
                    <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 sticky top-24 morph-fade-in morph-delay-3">
                        <CardHeader>
                            <CardTitle className="text-on-surface">New Project</CardTitle>
                            <CardDescription className="text-on-surface-variant">Start a new project for a client.</CardDescription>
                        </CardHeader>
                        <CardContent><ProjectForm clients={clients || []} /></CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
