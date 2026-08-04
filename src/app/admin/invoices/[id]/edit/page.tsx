import { InvoiceForm } from '../../invoice-form'
import { requireAdminOrFounder } from '@/lib/auth/page-guard'
import type { InvoiceStatus } from '@/lib/constants/statuses'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminOrFounder()
  const resolvedParams = await params


  // Fetch invoice
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`*, invoice_items(*)`)
    .eq('id', resolvedParams.id)
    .single()

  if (error || !invoice) {
    return <div className="p-6">Invoice not found.</div>
  }

  if ((invoice.status as InvoiceStatus) !== 'draft') {
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
      <div className="morph-fade-in">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Edit Invoice</h1>
        <p className="text-on-surface-variant">Update draft invoice {invoice.invoice_number}.</p>
      </div>

      <InvoiceForm
        clients={clients || []}
        projects={projects || []}
        initialData={invoice}
      />
    </div>
  )
}
