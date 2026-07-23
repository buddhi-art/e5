/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, FolderKanban, DollarSign, Users, Calendar, Clock, Plus, CheckSquare } from 'lucide-react'
import { ProjectActionsMenu } from '../project-actions-menu'
import { TaskActionsMenu } from '@/app/admin/tasks/task-actions-menu'
import { SubtaskCommentSection } from '@/components/subtask-comment-section'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const resolvedParams = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/employee/dashboard')

    const { data: project, error: projectErr } = await supabase
        .from('projects')
        .select('*, clients(company_name, contact_person, phone_number)')
        .eq('id', resolvedParams.id)
        .single()

    if (projectErr) console.error('Project fetch error:', projectErr.message)
    if (!project || project.deleted_at) return <div className="p-6 text-outline">Project not found.</div>

    // Fetch tasks for this project
    const { data: tasks } = await supabase
        .from('tasks')
        .select('*, profiles(full_name), projects(title), subtasks(*, sub_subtasks(*))')
        .eq('project_id', resolvedParams.id)
        .order('created_at', { ascending: false })

    // Fetch all subtask comments for the loaded tasks
    const subtaskIds = (tasks || []).flatMap(t => (t.subtasks || []).map((s: any) => s.id))
    
    let allComments: any[] = []
    if (subtaskIds.length > 0) {
      const { data } = await supabase
        .from('subtask_comments')
        .select('*, profiles(full_name, role)')
        .in('subtask_id', subtaskIds)
        .order('created_at', { ascending: true })
      allComments = data || []
    }

    const commentsBySubtask = new Map<string, any[]>()
    for (const comment of allComments) {
      const existing = commentsBySubtask.get(comment.subtask_id) || []
      existing.push(comment)
      commentsBySubtask.set(comment.subtask_id, existing)
    }

    // Fetch employees assigned to tasks in this project
    const assignedEmployeeIds = [...new Set((tasks || []).map(t => t.assigned_to).filter(Boolean))]
    const { data: employees } = await supabase.from('profiles').select('*').eq('role', 'employee')

    // Fetch budget data
    const { data: budget } = await supabase
        .from('project_budgets')
        .select('*')
        .eq('project_id', resolvedParams.id)
        .single()

    // Fetch expense totals
    const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount, status')
        .eq('project_id', resolvedParams.id)

    const totalExpenses = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
    const approvedExpenses = expensesData?.filter(e => ['approved', 'reimbursed'].includes(e.status)).reduce((sum, e) => sum + Number(e.amount), 0) || 0

    // Fetch invoice totals
    const { data: invoiceData } = await supabase
        .from('invoices')
        .select('grand_total, paid_amount')
        .eq('project_id', resolvedParams.id)

    // Fetch clients
    const { data: clients } = await supabase
        .from('clients')
        .select('*')

    const totalInvoiced = invoiceData?.reduce((sum, inv) => sum + Number(inv.grand_total), 0) || 0
    const totalPaid = invoiceData?.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0) || 0

    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0
    const totalTasks = tasks?.length || 0

    function getStatusBadge(status: string) {
        switch (status) {
            case 'not_started': return <Badge variant="outline" className="text-outline">Not Started</Badge>
            case 'in_progress': return <Badge variant="secondary" className="bg-m3-info-subtle text-m3-info border-m3-info">In Progress</Badge>
            case 'completed': return <Badge className="bg-m3-success">Completed</Badge>
            case 'on_hold': return <Badge variant="secondary" className="bg-m3-warning-subtle text-m3-warning border-m3-warning">On Hold</Badge>
            case 'cancelled': return <Badge variant="destructive" className="bg-surface-container-highest">Cancelled</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm text-outline hover:text-on-surface transition-colors -ml-2 px-2 py-1 rounded-md hover:bg-surface-container-high">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Projects
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-1">{project.title}</h1>
                        <p className="text-on-surface-variant text-sm">{project.clients?.company_name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/admin/projects/${resolvedParams.id}/budget`}>
                        <Button variant="outline" className="bg-surface-container-lowest">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Budget
                        </Button>
                    </Link>
                    <ProjectActionsMenu project={project} clients={clients || []} />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-outline">Status</CardTitle>
                        <FolderKanban className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>{getStatusBadge(project.status)}</CardContent>
                </Card>

                <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-outline">Tasks</CardTitle>
                        <Clock className="h-4 w-4 text-m3-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedTasks}/{totalTasks}</div>
                        <p className="text-xs text-outline">completed</p>
                    </CardContent>
                </Card>

                <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-outline">Invoiced</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalInvoiced.toLocaleString()}</div>
                        <p className="text-xs text-outline">NPR ({totalPaid.toLocaleString()} paid)</p>
                    </CardContent>
                </Card>

                <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-outline">Expenses</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalExpenses.toLocaleString()}</div>
                        <p className="text-xs text-outline">NPR ({approvedExpenses.toLocaleString()} approved)</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1">
                        <CardHeader>
                            <CardTitle>Project Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs font-semibold text-outline uppercase tracking-wider mb-1">Client</p>
                                    <p className="text-on-surface font-medium">{project.clients?.company_name}</p>
                                    {project.clients?.contact_person && <p className="text-sm text-outline">{project.clients.contact_person}</p>}
                                    {project.clients?.phone_number && <p className="text-sm text-outline">{project.clients.phone_number}</p>}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-outline uppercase tracking-wider mb-1">Dates</p>
                                    {project.start_date && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-3.5 h-3.5 text-outline" />
                                            <span className="text-on-surface">Start: {new Date(project.start_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {project.end_date && (
                                        <div className="flex items-center gap-2 text-sm mt-1">
                                            <Calendar className="w-3.5 h-3.5 text-outline" />
                                            <span className="text-on-surface">End: {new Date(project.end_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {!project.start_date && !project.end_date && (
                                        <p className="text-sm text-outline">No dates set</p>
                                    )}
                                </div>
                            </div>

                            {project.description && (
                                <div className="pt-4 border-t border-outline-variant">
                                    <p className="text-xs font-semibold text-outline uppercase tracking-wider mb-2">Description</p>
                                    <p className="text-on-surface whitespace-pre-wrap">{project.description}</p>
                                </div>
                            )}

                            {/* Budget Info */}
                            {budget && (
                                <div className="pt-4 border-t border-outline-variant">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-semibold text-outline uppercase tracking-wider">Budget Overview</p>
                                        <Link href={`/admin/projects/${resolvedParams.id}/budget`} className="text-xs text-primary hover:text-primary/80">Edit</Link>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-outline">Budget</span>
                                            <span className="font-medium">{Number(budget.budget_amount).toLocaleString()} NPR</span>
                                        </div>
                                        <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((approvedExpenses / budget.budget_amount) * 100, 100)}%` }} />
                                        </div>
                                        <div className="flex justify-between text-xs text-outline">
                                            <span>{approvedExpenses.toLocaleString()} NPR spent</span>
                                            <span>{Math.round((approvedExpenses / budget.budget_amount) * 100)}%</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tasks List */}
                    <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-primary" />
                                Tasks ({totalTasks})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tasks && tasks.length > 0 ? (
                                <div className="space-y-4">
                                    {tasks.map((task: any) => {
                                        const completedSubs = task.subtasks?.filter((s: any) => s.is_completed).length || 0
                                        const totalSubs = task.subtasks?.length || 0
                                        const progress = totalSubs === 0 ? (task.status === 'completed' ? 100 : 0) : Math.round((completedSubs / totalSubs) * 100)

                                        return (
                                            <div key={task.id} className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/50 morph-fade-in">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-on-surface">
                                                            {(() => {
                                                                const match = task.title.match(/^E5_Task_(\d+)\s*-\s*(.*)/);
                                                                const clientName = project.clients?.company_name || 'Client';
                                                                const projectName = project.title || 'Project';
                                                                if (match) {
                                                                    return `E5 - ${clientName} - ${projectName} - ${match[2]} - ${match[1]}`;
                                                                }
                                                                return `E5 - ${clientName} - ${projectName} - ${task.title}`;
                                                            })()}
                                                        </h3>
                                                        <div className="text-xs text-on-surface-variant mt-1 flex items-center gap-2">
                                                            <span>{
                                                                task.phase === 'Phase 1' ? 'Phase 1: Client Requirement' :
                                                                task.phase === 'Phase 2' ? 'Phase 2: Pre-Production' :
                                                                task.phase === 'Phase 3' ? 'Phase 3: Production' :
                                                                task.phase === 'Phase 4' ? 'Phase 4: Post-Production' :
                                                                task.phase === 'Phase 5' ? 'Phase 5: Delivery & SEO' : task.phase
                                                            }</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className={`
                                                            ${task.status === 'completed' ? 'bg-m3-success-subtle text-m3-success border-m3-success' : ''}
                                                            ${task.status === 'in_progress' ? 'bg-m3-info-subtle text-m3-info border-m3-info' : ''}
                                                            ${task.status === 'pending' ? 'bg-surface-container-high text-on-surface-variant border-outline-variant' : ''}
                                                        `}>
                                                            {task.status.replace('_', ' ')}
                                                        </Badge>
                                                        <TaskActionsMenu task={task} projects={[{ ...project, clients: project.clients }]} employees={employees || []} />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 mt-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                                                            {(task.profiles?.full_name || '?').charAt(0)}
                                                        </div>
                                                        <span className="text-on-surface">{task.profiles?.full_name || 'Unassigned'}</span>
                                                    </div>

                                                    {task.deadline && (
                                                        <div className="flex items-center gap-1.5 text-primary">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {new Date(task.deadline).toLocaleDateString()}
                                                        </div>
                                                    )}

                                                    <div className="ml-auto text-on-surface-variant text-xs">
                                                        {totalSubs > 0 ? (
                                                            <span className={progress === 100 ? 'text-m3-success' : ''}>
                                                                {completedSubs} / {totalSubs} sub-tasks
                                                            </span>
                                                        ) : (
                                                            <span>No sub-tasks</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Progress bar */}
                                                {totalSubs > 0 && (
                                                    <div className="w-full bg-surface-container-highest h-1.5 mt-3 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-m3-success' : 'bg-primary'}`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                )}

                                                {/* Subtask list with comments */}
                                                {task.subtasks && task.subtasks.length > 0 && (
                                                    <div className="mt-3 space-y-2">
                                                        {task.subtasks.map((st: any) => {
                                                            const subComments = commentsBySubtask.get(st.id) || []
                                                            return (
                                                                <div key={st.id} className="pl-3 border-l-2 border-outline-variant">
                                                                    <div className="flex items-center gap-2 py-1">
                                                                        <div className={`w-2 h-2 rounded-full shrink-0 ${st.is_completed ? 'bg-m3-success' : 'bg-surface-container-highest'}`} />
                                                                        <span className={`text-xs ${st.is_completed ? 'text-outline line-through' : 'text-on-surface'}`}>
                                                                            {st.title}
                                                                        </span>
                                                                        {st.is_completed && (
                                                                            <span className="text-[10px] text-m3-success font-medium">done</span>
                                                                        )}
                                                                    </div>

                                                                    {st.sub_subtasks && st.sub_subtasks.length > 0 && (
                                                                        <div className="pl-4 py-1 space-y-1">
                                                                            {st.sub_subtasks.map((sst: any) => (
                                                                                <div key={sst.id} className="flex items-center gap-2">
                                                                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${sst.is_completed ? 'bg-m3-success' : 'bg-surface-container-highest'}`} />
                                                                                    <span className={`text-[11px] ${sst.is_completed ? 'text-outline line-through' : 'text-on-surface-variant'}`}>
                                                                                        {sst.title}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    <SubtaskCommentSection subtaskId={st.id} initialComments={subComments} />
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-outline text-center py-6">No tasks assigned to this project yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar info */}
                <div className="space-y-6">
                    <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1">
                        <CardHeader>
                            <CardTitle className="text-sm">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button render={<Link href="/admin/tasks" />} variant="outline" className="w-full justify-start">
                                <Plus className="w-4 h-4 mr-2" />
                                Assign Task
                            </Button>
                            <Button render={<Link href={`/admin/invoices/new?project_id=${resolvedParams.id}`} />} variant="outline" className="w-full justify-start">
                                <DollarSign className="w-4 h-4 mr-2" />
                                Create Invoice
                            </Button>
                            <Button render={<Link href={`/admin/expenses/new?project_id=${resolvedParams.id}`} />} variant="outline" className="w-full justify-start">
                                <DollarSign className="w-4 h-4 mr-2" />
                                Log Expense
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1">
                        <CardHeader>
                            <CardTitle className="text-sm">Team</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {assignedEmployeeIds.length > 0 ? (
                                <div className="space-y-2">
                                    {assignedEmployeeIds.map((empId: string) => {
                                        const emp = tasks?.find(t => t.assigned_to === empId)?.profiles
                                        return (
                                            <div key={empId} className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                                                    {(emp?.full_name || '?').charAt(0)}
                                                </div>
                                                <span className="text-sm text-on-surface">{emp?.full_name || 'Unknown'}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-outline">No team members assigned.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
