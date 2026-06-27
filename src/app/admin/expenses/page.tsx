import { createClient } from '@/lib/supabase/server'

// Layer 2: ISR — Cache for 5 minutes
export const revalidate = 300
import { ExpenseTable } from './expense-table'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function ExpensesPage() {
  const supabase = await createClient()

  // Fetch expenses
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select(`
      *,
      projects(title),
      clients(company_name),
      submitted_by_profile:profiles!expenses_submitted_by_fkey(full_name),
      approved_by_profile:profiles!expenses_approved_by_fkey(full_name)
    `)
    .is('deleted_at', null)
    .order('expense_date', { ascending: false })

  if (error) console.error('Expenses fetch error:', error.message)

  // Fetch projects for filter
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title')
    .is('deleted_at', null)
    .order('title', { ascending: true })

  return (
    <div className="space-y-6 card-morph morph-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Expenses</h1>
          <p className="text-on-surface-variant">Review, approve, and track company expenses.</p>
        </div>
        <Button render={<Link href="/admin/expenses/new" />} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold border-none btn-morph">
          <Plus className="w-4 h-4 mr-2" />
          New Expense
        </Button>
      </div>

      <ExpenseTable
        initialExpenses={expenses || []}
        projects={(projects || []) as { id: string, title: string }[]}
      />
    </div>
  )
}
