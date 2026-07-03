import { createClient } from '@/lib/supabase/server'
import { getSignedUrl } from '@/lib/supabase/storage'
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

  // The `receipts` bucket is private — receipt_url stores the storage path,
  // so we must generate a signed URL before using it as an <img>/<a> source.
  const receiptUrl = expense.receipt_url
    ? await getSignedUrl('receipts', expense.receipt_url)
    : null

  function getStatusBadge(status: string) {
    switch (status) {
      case 'approved': return <Badge className="bg-m3-success">Approved</Badge>
      case 'reimbursed': return <Badge variant="secondary" className="bg-m3-info-subtle text-m3-info border-m3-info border">Reimbursed</Badge>
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>
      case 'pending': return <Badge variant="outline" className="text-m3-warning border-m3-warning">Pending</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="ghost" render={<Link href="/admin/expenses" />} className="text-outline hover:text-on-surface -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Expenses
        </Button>
        <ExpenseActions expenseId={expense.id} currentStatus={expense.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1">
            <CardHeader className="flex flex-row items-start justify-between pb-4 border-b border-outline-variant/50">
              <div>
                <CardTitle className="text-2xl font-bold">{Number(expense.amount).toLocaleString()} NPR</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(expense.status)}
                  <span className="text-sm text-outline capitalize px-2 border-l border-outline-variant">{expense.category.replace('_', ' ')}</span>
                  {expense.is_billable && (
                    <span className="text-sm text-m3-info bg-m3-info-subtle px-2 py-0.5 rounded border border-m3-info">Billable</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-outline uppercase tracking-wider mb-2">Description</h3>
                <p className="text-on-surface text-lg">{expense.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-outline-variant">
                <div className="space-y-1">
                  <div className="flex items-center text-outline text-sm mb-1">
                    <User className="w-4 h-4 mr-2" /> Submitted By
                  </div>
                  <p className="font-medium text-on-surface">{expense.submitted_by_profile?.full_name}</p>
                  <p className="text-xs text-outline">{expense.submitted_by_profile?.email}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-outline text-sm mb-1">
                    <Calendar className="w-4 h-4 mr-2" /> Expense Date
                  </div>
                  <p className="font-medium text-on-surface">{new Date(expense.expense_date).toLocaleDateString()}</p>
                  <p className="text-xs text-outline">Recorded {new Date(expense.created_at).toLocaleDateString()}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-outline text-sm mb-1">
                    <FolderKanban className="w-4 h-4 mr-2" /> Project
                  </div>
                  <p className="font-medium text-on-surface">{expense.projects?.title || 'None'}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-outline text-sm mb-1">
                    <DollarSign className="w-4 h-4 mr-2" /> Client
                  </div>
                  <p className="font-medium text-on-surface">{expense.clients?.company_name || 'None'}</p>
                </div>
              </div>

              {expense.notes && (
                <div className="pt-4 border-t border-outline-variant">
                  <h3 className="text-sm font-semibold text-outline uppercase tracking-wider mb-2">Notes</h3>
                  <p className="text-on-surface whitespace-pre-wrap">{expense.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 sticky top-24">
            <CardHeader>
              <CardTitle>Receipt</CardTitle>
            </CardHeader>
            <CardContent>
              {receiptUrl ? (
                <div className="space-y-4">
                  <a href={receiptUrl} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-outline-variant hover:opacity-90 transition-opacity">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={receiptUrl} alt="Receipt preview" className="w-full object-cover" />
                  </a>
                  <Button render={<a href={receiptUrl} target="_blank" rel="noreferrer" />} variant="outline" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Full Size
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-outline border-2 border-dashed border-outline-variant rounded-lg">
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
