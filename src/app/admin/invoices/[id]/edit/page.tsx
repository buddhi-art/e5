import { createClient } from '@/lib/supabase/server'
import { InvoiceForm } from '../../invoice-form'
import { redirect } from 'next/navigation'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const resolvedParams = await params

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/employee/dashboard')

  // Fetch invoice
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`*, invoice_items(*)`)
    .eq('id', resolvedParams.id)
    .single()

  if (error || !invoice) {
    return <div className="p-6">Invoice not found.</div>
  }

  if (invoice.status !== 'draft') {
    return <div className="p-6">Only draft invoices can be edited.</div>
  }

  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name, billing_address, tax_id')
    .is('deleted_at', null)
    .order('company_name', { ascending: true })

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, client_id')
    .is('deleted_at', null)
    .order('title', { ascending: true })

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Edit Invoice</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Update draft invoice {invoice.invoice_number}.</p>
      </div>

      <InvoiceForm
        clients={clients || []}
        projects={projects || []}
        initialData={invoice}
      />
    </div>
  )
}
