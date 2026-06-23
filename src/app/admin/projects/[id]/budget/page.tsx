import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { BudgetForm } from './budget-form'
import { BudgetChart } from './budget-chart'

export default async function ProjectBudgetPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const resolvedParams = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/employee/dashboard')

    const { data: project } = await supabase
        .from('projects')
        .select('*, clients(company_name)')
        .eq('id', resolvedParams.id)
        .single()

    if (!project) {
        return <div className="p-6 text-zinc-500">Project not found.</div>
    }

    const { data: budget } = await supabase
        .from('project_budgets')
        .select('*')
        .eq('project_id', resolvedParams.id)
        .single()

    // Get financials
    const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount')
        .eq('project_id', resolvedParams.id)
        .in('status', ['approved', 'reimbursed'])

    const { data: invoiceData } = await supabase
        .from('invoices')
        .select('grand_total, paid_amount')
        .eq('project_id', resolvedParams.id)

    const total_expenses = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
    const total_invoiced = invoiceData?.reduce((sum, inv) => sum + Number(inv.grand_total), 0) || 0
    const total_paid = invoiceData?.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0) || 0
    const profit = total_invoiced - total_expenses
    const margin = total_invoiced > 0 ? (profit / total_invoiced) * 100 : 0

    // Fetch expenses for this project for the list below
    const { data: projectExpenses } = await supabase
        .from('expenses')
        .select('*, projects(title)')
        .eq('project_id', resolvedParams.id)
        .order('expense_date', { ascending: false })
        .limit(20)

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href={`/admin/projects/${resolvedParams.id}`} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors -ml-2 px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Project
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1">Budget</h1>
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm">{project.title} — {project.clients?.company_name}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Budget Form */}
                <div className="lg:col-span-2 space-y-6">
                    <BudgetForm key={budget ? `budget-${budget.updated_at}` : 'no-budget'} projectId={resolvedParams.id} initialBudget={budget} />

                    {/* Recent Expenses for this project */}
                    {projectExpenses && projectExpenses.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                                <h3 className="font-semibold text-zinc-900 dark:text-white">Project Expenses</h3>
                            </div>
                            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {projectExpenses.map((exp: any) => (
                                    <div key={exp.id} className="px-6 py-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-zinc-900 dark:text-white">{exp.description}</p>
                                            <p className="text-xs text-zinc-500">{new Date(exp.expense_date).toLocaleDateString()} — <span className="capitalize">{exp.category.replace('_', ' ')}</span></p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{Number(exp.amount).toLocaleString()} NPR</p>
                                            <p className="text-xs capitalize text-zinc-500">{exp.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Financial Summary */}
                <div className="space-y-6">
                    {/* Budget Card */}
                    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 space-y-4">
                        <h3 className="font-semibold text-zinc-900 dark:text-white">Budget Overview</h3>

                        {budget ? (
                            <>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Budget</span>
                                        <span className="font-semibold text-zinc-900 dark:text-white">{Number(budget.budget_amount).toLocaleString()} NPR</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Contingency</span>
                                        <span className="font-semibold text-zinc-900 dark:text-white">{budget.contingency_percent}%</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                        <span className="text-zinc-500">Total Budget</span>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            {Number(budget.budget_amount * (1 + budget.contingency_percent / 100)).toLocaleString()} NPR
                                        </span>
                                    </div>
                                </div>

                                {/* Budget Consumption Chart */}
                                <BudgetChart
                                    consumed={total_expenses}
                                    remaining={budget.budget_amount - total_expenses}
                                />

                                {budget.notes && (
                                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                        <p className="text-xs text-zinc-500 mb-1">Notes</p>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{budget.notes}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-zinc-500">No budget set yet. Use the form to set one.</p>
                        )}
                    </div>

                    {/* Financial Stats */}
                    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 space-y-4">
                        <h3 className="font-semibold text-zinc-900 dark:text-white">Financials</h3>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Total Invoiced</span>
                                <span className="font-semibold text-sky-600 dark:text-sky-400">{total_invoiced.toLocaleString()} NPR</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Amount Paid</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{total_paid.toLocaleString()} NPR</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Total Expenses</span>
                                <span className="font-semibold text-orange-600 dark:text-orange-400">{total_expenses.toLocaleString()} NPR</span>
                            </div>

                            <div className={`flex justify-between text-sm pt-3 border-t border-zinc-200 dark:border-zinc-800 ${margin > 40 ? 'text-emerald-600 dark:text-emerald-400' : margin > 20 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                <span className="font-semibold">Profit / Margin</span>
                                <span className="font-semibold">{profit.toLocaleString()} NPR ({margin.toFixed(1)}%)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
