import { createClient } from '@/lib/supabase/server'
import { InvoiceTable } from './invoice-table'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function InvoicesPage() {
  const supabase = await createClient()

  // Business Logic: Overdue detection
  const today = new Date().toISOString().split('T')[0]
  await supabase
    .from('invoices')
    .update({ status: 'overdue' })
    .lt('due_date', today)
    .in('status', ['sent', 'partially_paid'])
    .is('deleted_at', null)

  // Fetch invoices
  const { data: invoices, error: invoicesErr } = await supabase
    .from('invoices')
    .select('*, clients(company_name), projects(title)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (invoicesErr) console.error('Invoices fetch error:', invoicesErr.message)

  // Fetch clients for filter
  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name')
    .is('deleted_at', null)
    .order('company_name', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Invoices</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Manage client billing and track payments.</p>
        </div>
        <Button render={<Link href="/admin/invoices/new" />} className="bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-white font-semibold border-none">
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      <InvoiceTable 
        initialInvoices={invoices || []} 
        clients={(clients || []) as { id: string, company_name: string }[]} 
      />
    </div>
  )
}
