import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, Receipt, Wallet, TrendingUp, AlertTriangle, CheckSquare, FileText, Percent } from 'lucide-react'
import { cn } from '@/lib/utils'

export const revalidate = 300

export default async function FounderFinancesPage() {
    const supabase = await createClient()

    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
    const startOfYear = new Date(currentYear, 0, 1).toISOString().split('T')[0]

    // Parallel queries
    const [
        { data: invoices } = { data: [] },
        { data: thisMonthInvoices } = { data: [] },
        { data: lastMonthInvoices } = { data: [] },
        { data: expenses } = { data: [] },
        { data: expenseByCategory } = { data: [] },
        { data: projectBudgets } = { data: [] },
        { data: monthlyInvoices } = { data: [] },
        { data: invoicesByClient } = { data: [] },
    ] = await Promise.all([
        supabase.from('invoices').select('status, grand_total, paid_amount, amount, client_id, issue_date')
            .is('deleted_at', null),
        supabase.from('invoices').select('grand_total, status')
            .is('deleted_at', null)
            .gte('issue_date', startOfMonth).lte('issue_date', endOfMonth)
            .neq('status', 'cancelled').neq('status', 'draft'),
        supabase.from('invoices').select('grand_total')
            .is('deleted_at', null)
            .gte('issue_date', new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0])
            .lte('issue_date', new Date(currentYear, currentMonth, 0).toISOString().split('T')[0])
            .neq('status', 'cancelled').neq('status', 'draft'),
        supabase.from('expenses').select('amount, status, expense_date, category, description')
            .is('deleted_at', null).order('expense_date', { ascending: false }),
        supabase.from('expenses').select('category, amount')
            .is('deleted_at', null)
            .gte('expense_date', startOfMonth).lte('expense_date', endOfMonth),
        supabase.from('project_budgets').select('budget_amount'),
        supabase.from('invoices').select('issue_date, grand_total, status')
            .is('deleted_at', null)
            .gte('issue_date', startOfYear).lte('issue_date', endOfMonth)
            .neq('status', 'cancelled').neq('status', 'draft')
            .order('issue_date', { ascending: true }),
        supabase.from('invoices').select('grand_total, client_id, clients(company_name)')
            .is('deleted_at', null).neq('status', 'cancelled').neq('status', 'draft'),
    ])

    // ── Compute metrics ──
    const invoiceList = invoices || []
    const draftInvoices = invoiceList.filter(i => i.status === 'draft').length
    const activeInvoices = invoiceList.filter(i => i.status === 'sent' || i.status === 'partially_paid').length
    const overdueInvoices = invoiceList.filter(i => i.status === 'overdue').length
    const paidInvoices = invoiceList.filter(i => i.status === 'paid').length

    const totalReceivable = invoiceList
        .filter(i => i.status === 'sent' || i.status === 'overdue' || i.status === 'partially_paid')
        .reduce((s: number, inv: any) => s + (Number(inv.grand_total) - Number(inv.paid_amount || 0)), 0)

    const revenueThisMonth = (thisMonthInvoices || []).reduce((s: number, i: any) => s + Number(i.grand_total || 0), 0)
    const revenueLastMonth = (lastMonthInvoices || []).reduce((s: number, i: any) => s + Number(i.grand_total || 0), 0)
    const revenueChange = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth * 100).toFixed(1) : '0'

    const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0)
    const totalBudget = (projectBudgets || []).reduce((s: number, b: any) => s + Number(b.budget_amount || 0), 0)
    const budgetUtilization = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0

    const pendingExpenses = (expenses || []).filter((e: any) => e.status === 'pending').length
    const totalInvoiceCount = invoiceList.length
    const collectionRate = totalInvoiceCount > 0 ? Math.round((paidInvoices / totalInvoiceCount) * 100) : 0

    // Monthly revenue for chart
    const monthlyMap = new Map<string, number>()
    for (const inv of monthlyInvoices || []) {
        const d = new Date(inv.issue_date)
        const key = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(inv.grand_total || 0))
    }
    const monthlyRevenueData = Array.from(monthlyMap.entries())

    // Expense by category
    const catMap = new Map<string, number>()
    for (const exp of expenseByCategory || []) {
        const cat = exp.category || 'Other'
        catMap.set(cat, (catMap.get(cat) || 0) + Number(exp.amount || 0))
    }
    const expenseByCategoryData = Array.from(catMap.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total)

    // Top clients
    const clientRevMap = new Map<string, number>()
    for (const inv of invoicesByClient || []) {
        const name = (inv as any).clients?.company_name || 'Unknown'
        clientRevMap.set(name, (clientRevMap.get(name) || 0) + Number(inv.grand_total || 0))
    }
    const topClients = Array.from(clientRevMap.entries())
        .map(([name, rev]) => ({ name, rev }))
        .sort((a, b) => b.rev - a.rev)
        .slice(0, 5)

    // Recent expenses
    const recentExpenses = (expenses || []).slice(0, 10)

    return (
        <div className="space-y-8">
            <div className="morph-fade-in">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-primary" />
                    Finances
                </h1>
                <p className="text-base text-on-surface-variant mt-2">
                    Revenue, expenses, invoices — full financial picture at a glance.
                </p>
            </div>

            {/* Revenue & Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 morph-fade-in morph-delay-2">
                <div className="rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-outline-variant/40 card-morph">
                    <div className="w-9 h-9 rounded-xl bg-m3-success-subtle text-m3-success flex items-center justify-center mb-2">
                        <TrendingUp className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-xl font-bold text-foreground tabular-nums">{revenueThisMonth.toLocaleString()}</div>
                    <div className="text-xs text-on-surface-variant font-medium">Revenue This Month</div>
                    <div className={cn('text-[10px] font-medium mt-0.5', Number(revenueChange) >= 0 ? 'text-m3-success' : 'text-m3-error')}>
                        {Number(revenueChange) >= 0 ? '+' : ''}{revenueChange}% vs last month
                    </div>
                </div>

                <div className="rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-outline-variant/40 card-morph">
                    <div className="w-9 h-9 rounded-xl bg-m3-warning-subtle text-m3-warning flex items-center justify-center mb-2">
                        <Receipt className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-xl font-bold text-foreground tabular-nums">{totalReceivable.toLocaleString()}</div>
                    <div className="text-xs text-on-surface-variant font-medium">Outstanding Receivables</div>
                </div>

                <div className="rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-outline-variant/40 card-morph">
                    <div className="w-9 h-9 rounded-xl bg-secondary-container text-secondary flex items-center justify-center mb-2">
                        <Wallet className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-xl font-bold text-foreground tabular-nums">{totalExpenses.toLocaleString()}</div>
                    <div className="text-xs text-on-surface-variant font-medium">Total Expenses</div>
                </div>

                <div className="rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-outline-variant/40 card-morph">
                    <div className="w-9 h-9 rounded-xl bg-primary-container text-primary flex items-center justify-center mb-2">
                        <Percent className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-xl font-bold text-foreground">{budgetUtilization}%</div>
                    <div className="text-xs text-on-surface-variant font-medium">Budget Used</div>
                </div>

                <div className="rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-outline-variant/40 card-morph">
                    <div className="w-9 h-9 rounded-xl bg-m3-success-subtle text-m3-success flex items-center justify-center mb-2">
                        <CheckSquare className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-xl font-bold text-foreground">{collectionRate}%</div>
                    <div className="text-xs text-on-surface-variant font-medium">Collection Rate</div>
                </div>

                <div className="rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-outline-variant/40 card-morph">
                    <div className="w-9 h-9 rounded-xl bg-m3-warning-subtle text-m3-warning flex items-center justify-center mb-2">
                        <AlertTriangle className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-xl font-bold text-foreground">{overdueInvoices}</div>
                    <div className="text-xs text-on-surface-variant font-medium">Overdue Invoices</div>
                    <div className="text-[10px] text-destructive mt-0.5">{pendingExpenses} pending expenses</div>
                </div>
            </div>

            {/* Monthly Revenue Chart */}
            <section className="morph-fade-in morph-delay-3">
                <div className="rounded-2xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/40 card-morph">
                    <h2 className="font-semibold text-foreground text-sm mb-4">Monthly Revenue Trend</h2>
                    {monthlyRevenueData.length > 0 ? (
                        <div className="flex items-end gap-2 h-32">
                            {monthlyRevenueData.map(([month, revenue]) => {
                                const maxRev = Math.max(...monthlyRevenueData.map(([, r]) => r), 1)
                                const heightPct = (revenue / maxRev) * 100
                                return (
                                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                                        <span className="text-[9px] text-on-surface-variant tabular-nums font-medium">
                                            {revenue >= 1000 ? `${(revenue / 1000).toFixed(1)}k` : revenue}
                                        </span>
                                        <div className="w-full rounded-md bg-primary/20 relative overflow-hidden" style={{ height: `${Math.max(heightPct, 4)}%` }}>
                                            <div className="absolute bottom-0 w-full bg-primary rounded-md transition-all duration-700" style={{ height: `${heightPct}%` }} />
                                        </div>
                                        <span className="text-[8px] text-outline font-medium truncate w-full text-center">{month}</span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-on-surface-variant py-8 text-center">No revenue data available.</p>
                    )}
                </div>
            </section>

            {/* Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Invoices Breakdown */}
                <section className="morph-fade-in morph-delay-4">
                    <div className="rounded-2xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/40 card-morph h-full">
                        <h2 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-primary" />
                            Invoices
                        </h2>
                        <div className="space-y-3">
                            {[
                                { label: 'Draft', value: draftInvoices, color: 'text-outline', bg: 'bg-surface-container-high' },
                                { label: 'Active (Sent)', value: activeInvoices, color: 'text-primary', bg: 'bg-primary-container' },
                                { label: 'Overdue', value: overdueInvoices, color: 'text-m3-error', bg: 'bg-m3-error-subtle' },
                                { label: 'Paid', value: paidInvoices, color: 'text-m3-success', bg: 'bg-m3-success-subtle' },
                            ].map(item => {
                                const pct = totalInvoiceCount > 0 ? Math.round((item.value / totalInvoiceCount) * 100) : 0
                                return (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <span className={cn('w-2 h-2 rounded-full shrink-0', item.bg.replace('bg-', 'bg-').includes('bg-surface') ? 'bg-outline' : '')} />
                                        <span className="flex-1 text-sm text-foreground">{item.label}</span>
                                        <span className={cn('text-sm font-bold tabular-nums', item.color)}>{item.value}</span>
                                        <span className="text-xs text-on-surface-variant w-10 text-right">{pct}%</span>
                                    </div>
                                )
                            })}
                            <div className="pt-2 border-t border-outline-variant/30">
                                <div className="flex justify-between text-sm">
                                    <span className="text-on-surface-variant">Total Invoices</span>
                                    <span className="font-bold text-foreground">{totalInvoiceCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Top Clients */}
                <section className="morph-fade-in morph-delay-5">
                    <div className="rounded-2xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/40 card-morph h-full">
                        <h2 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Top Clients by Revenue
                        </h2>
                        {topClients.length > 0 ? (
                            <div className="space-y-3">
                                {topClients.map(({ name, rev }, i) => {
                                    const maxRev = topClients[0]?.rev || 1
                                    const pct = (rev / maxRev) * 100
                                    return (
                                        <div key={name} className="flex items-center gap-3">
                                            <span className="w-5 text-xs font-bold text-on-surface-variant text-right">{i + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between text-xs mb-0.5">
                                                    <span className="font-medium text-foreground truncate">{name}</span>
                                                    <span className="text-on-surface-variant tabular-nums">{rev.toLocaleString()}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-on-surface-variant py-8 text-center">No invoice data yet.</p>
                        )}
                    </div>
                </section>
            </div>

            {/* Expense Breakdown */}
            <section className="morph-fade-in morph-delay-6">
                <div className="rounded-2xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/40 card-morph">
                    <h2 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-primary" />
                        Expense by Category
                    </h2>
                    {expenseByCategoryData.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {expenseByCategoryData.map(({ category, total }) => {
                                const totalCat = expenseByCategoryData.reduce((s, c) => s + c.total, 0)
                                const pct = totalCat > 0 ? Math.round((total / totalCat) * 100) : 0
                                return (
                                    <div key={category} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-container-high">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-foreground truncate">{category}</span>
                                                <span className="text-[11px] font-bold text-on-surface-variant tabular-nums">{total.toLocaleString()} ({pct}%)</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-on-surface-variant py-8 text-center">No expenses recorded.</p>
                    )}
                </div>
            </section>

            {/* Recent Expenses */}
            {recentExpenses.length > 0 && (
                <section className="morph-fade-in morph-delay-7">
                    <div className="rounded-2xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/40 card-morph">
                        <h2 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Recent Expenses
                        </h2>
                        <div className="divide-y divide-outline-variant/20">
                            {recentExpenses.map((exp: any) => (
                                <div key={exp.id} className="flex items-center justify-between py-2.5">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-foreground truncate">{exp.description || 'Untitled'}</div>
                                        <div className="text-xs text-on-surface-variant">
                                            {exp.category || 'Uncategorized'} · {new Date(exp.expense_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                        <div className="text-sm font-bold text-foreground tabular-nums">{Number(exp.amount).toLocaleString()}</div>
                                        <div className={cn(
                                            'text-[10px] font-medium',
                                            exp.status === 'approved' ? 'text-m3-success' : exp.status === 'pending' ? 'text-m3-warning' : 'text-on-surface-variant'
                                        )}>{exp.status}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}
