import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ExternalLink, Calendar, User, FolderKanban, DollarSign } from 'lucide-react'
import { ExpenseActions } from './expense-actions'

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const resolvedParams = await params

  // Verify access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: expense, error } = await supabase
    .from('expenses')
    .select(`
      *,
      projects(title),
      clients(company_name),
      submitted_by_profile:profiles!expenses_submitted_by_fkey(full_name, email),
      approved_by_profile:profiles!expenses_approved_by_fkey(full_name)
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (error || !expense) {
    return <div className="p-6">Expense not found.</div>
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-500">Approved</Badge>
      case 'reimbursed': return <Badge variant="secondary" className="bg-sky-100 text-sky-800 border-sky-200 border">Reimbursed</Badge>
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>
      case 'pending': return <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="ghost" render={<Link href="/admin/expenses" />} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Expenses
        </Button>
        <ExpenseActions expenseId={expense.id} currentStatus={expense.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <CardTitle className="text-2xl font-bold">{Number(expense.amount).toLocaleString()} NPR</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(expense.status)}
                  <span className="text-sm text-zinc-500 capitalize px-2 border-l border-zinc-200 dark:border-zinc-800">{expense.category.replace('_', ' ')}</span>
                  {expense.is_billable && (
                    <span className="text-sm text-sky-600 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-900">Billable</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-zinc-900 dark:text-white text-lg">{expense.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="space-y-1">
                  <div className="flex items-center text-zinc-500 text-sm mb-1">
                    <User className="w-4 h-4 mr-2" /> Submitted By
                  </div>
                  <p className="font-medium text-zinc-900 dark:text-white">{expense.submitted_by_profile?.full_name}</p>
                  <p className="text-xs text-zinc-500">{expense.submitted_by_profile?.email}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-zinc-500 text-sm mb-1">
                    <Calendar className="w-4 h-4 mr-2" /> Expense Date
                  </div>
                  <p className="font-medium text-zinc-900 dark:text-white">{new Date(expense.expense_date).toLocaleDateString()}</p>
                  <p className="text-xs text-zinc-500">Recorded {new Date(expense.created_at).toLocaleDateString()}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-zinc-500 text-sm mb-1">
                    <FolderKanban className="w-4 h-4 mr-2" /> Project
                  </div>
                  <p className="font-medium text-zinc-900 dark:text-white">{expense.projects?.title || 'None'}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-zinc-500 text-sm mb-1">
                    <DollarSign className="w-4 h-4 mr-2" /> Client
                  </div>
                  <p className="font-medium text-zinc-900 dark:text-white">{expense.clients?.company_name || 'None'}</p>
                </div>
              </div>

              {expense.notes && (
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Notes</h3>
                  <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{expense.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm sticky top-24">
            <CardHeader>
              <CardTitle>Receipt</CardTitle>
            </CardHeader>
            <CardContent>
              {expense.receipt_url ? (
                <div className="space-y-4">
                  <a href={expense.receipt_url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:opacity-90 transition-opacity">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={expense.receipt_url} alt="Receipt preview" className="w-full object-cover" />
                  </a>
                  <Button render={<a href={expense.receipt_url} target="_blank" rel="noreferrer" />} variant="outline" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Full Size
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                  No receipt attached.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
