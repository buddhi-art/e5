/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
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
 return <div className="p-6 text-outline">Project not found.</div>
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
 <Link href={`/admin/projects/${resolvedParams.id}`} className="inline-flex items-center gap-2 text-sm text-outline hover:text-on-surface dark:hover:text-white transition-colors -ml-2 px-2 py-1 rounded-md hover:bg-surface-container-high dark:hover:bg-surface-container">
 <ArrowLeft className="w-4 h-4" />
 Back to Project
 </Link>
 <div>
 <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-1">Budget</h1>
 <p className="text-on-surface-variant text-sm">{project.title} — {project.clients?.company_name}</p>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Budget Form */}
 <div className="lg:col-span-2 space-y-6">
 <BudgetForm key={budget ? `budget-${budget.updated_at}` : 'no-budget'} projectId={resolvedParams.id} initialBudget={budget} />

 {/* Recent Expenses for this project */}
 {projectExpenses && projectExpenses.length > 0 && (
 <div className="bg-surface-container-lowest dark:bg-surface-container-lowest/50 border border-outline-variant rounded-xl shadow-sm overflow-hidden">
 <div className="px-6 py-4 border-b border-outline-variant" >
 <h3 className="font-semibold text-on-surface">Project Expenses</h3>
 </div>
 <div className="divide-y divide-outline-variant" >
 {projectExpenses.map((exp: any) => (
 <div key={exp.id} className="px-6 py-3 flex items-center justify-between">
 <div>
 <p className="text-sm font-medium text-on-surface">{exp.description}</p>
 <p className="text-xs text-outline">{new Date(exp.expense_date).toLocaleDateString()} — <span className="capitalize">{exp.category.replace('_', '')}</span></p>
 </div>
 <div className="text-right">
 <p className="text-sm font-semibold text-on-surface">{Number(exp.amount).toLocaleString()} NPR</p>
 <p className="text-xs capitalize text-outline">{exp.status}</p>
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
 <div className="bg-surface-container-lowest dark:bg-surface-container-lowest/50 border border-outline-variant rounded-xl shadow-sm p-6 space-y-4">
 <h3 className="font-semibold text-on-surface">Budget Overview</h3>

 {budget ? (
 <>
 <div className="space-y-3">
 <div className="flex justify-between text-sm">
 <span className="text-outline">Budget</span>
 <span className="font-semibold text-on-surface">{Number(budget.budget_amount).toLocaleString()} NPR</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-outline">Contingency</span>
 <span className="font-semibold text-on-surface">{budget.contingency_percent}%</span>
 </div>
 <div className="flex justify-between text-sm pt-2 border-t border-outline-variant" >
 <span className="text-outline">Total Budget</span>
 <span className="font-semibold text-m3-success">
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
 <div className="pt-2 border-t border-outline-variant" >
 <p className="text-xs text-outline mb-1">Notes</p>
 <p className="text-sm text-on-surface whitespace-pre-wrap">{budget.notes}</p>
 </div>
 )}
 </>
 ) : (
 <p className="text-sm text-outline">No budget set yet. Use the form to set one.</p>
 )}
 </div>

 {/* Financial Stats */}
 <div className="bg-surface-container-lowest dark:bg-surface-container-lowest/50 border border-outline-variant rounded-xl shadow-sm p-6 space-y-4">
 <h3 className="font-semibold text-on-surface">Financials</h3>

 <div className="space-y-3">
 <div className="flex justify-between text-sm">
 <span className="text-outline">Total Invoiced</span>
 <span className="font-semibold text-primary dark:text-primary">{total_invoiced.toLocaleString()} NPR</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-outline">Amount Paid</span>
 <span className="font-semibold text-m3-success">{total_paid.toLocaleString()} NPR</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-outline">Total Expenses</span>
 <span className="font-semibold text-primary" >{total_expenses.toLocaleString()} NPR</span>
 </div>

 <div className={`flex justify-between text-sm pt-3 border-t border-outline-variant ${margin > 40 ? 'text-m3-success' : margin > 20 ? 'text-m3-warning' : 'text-m3-error '}`}>
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
