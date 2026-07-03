import { createClient } from '@/lib/supabase/server'
import { InvoiceForm } from '../invoice-form'
import { redirect } from 'next/navigation'

export default async function NewInvoicePage() {
  const supabase = await createClient()

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/employee/dashboard')

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
        <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">New Invoice</h1>
        <p className="text-on-surface-variant">Create a draft invoice to send to a client.</p>
      </div>

      <InvoiceForm
        clients={clients || []}
        projects={projects || []}
      />
    </div>
  )
}
