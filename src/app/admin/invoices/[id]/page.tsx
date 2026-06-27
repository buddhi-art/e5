import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Printer, Pencil, AlertCircle, Send } from 'lucide-react'
import { RecordPaymentDialog } from './record-payment-dialog'
import { PrintButton } from './print-button'
import { format } from 'date-fns'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const resolvedParams = await params

  // Verify access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      clients(*),
      projects(title),
      invoice_items(*),
      payments(*, received_by_profile:profiles(full_name))
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (error || !invoice) {
    return <div className="p-6">Invoice not found.</div>
  }

  const isOverdue = new Date(invoice.due_date) < new Date() && ['sent', 'partially_paid', 'draft'].includes(invoice.status)

  // Sort items by creation date
  const items = invoice.invoice_items?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || []
  const payments = invoice.payments?.sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()) || []

  function getStatusBadge(status: string) {
    switch (status) {
      case 'paid': return <Badge className="bg-primary-container text-on-primary-container">Paid</Badge>
      case 'partially_paid': return <Badge variant="secondary" className="bg-tertiary-container text-[var(--md-sys-color-on-tertiary-container)]">Partial</Badge>
      case 'sent': return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400">Sent</Badge>
      case 'draft': return <Badge variant="outline">Draft</Badge>
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>
      case 'cancelled': return <Badge variant="destructive" className="bg-destructive/20 text-destructive hover:bg-destructive/30">Cancelled</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Bar - hidden on print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <Link href="/admin/invoices" className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-foreground transition-colors -ml-2 px-2 py-1 rounded-md hover:bg-surface-container-high">
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </Link>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {invoice.status === 'draft' && (
            <>
              <form action={async () => {
                'use server'
                const { sendInvoice } = await import('../actions')
                await sendInvoice(invoice.id)
              }}>
                <Button type="submit" variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800">
                  <Send className="w-4 h-4 mr-2" />
                  Send Invoice
                </Button>
              </form>
              <Link href={`/admin/invoices/${invoice.id}/edit`} className="inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-surface-container-lowest hover:bg-zinc-50 dark:hover:bg-zinc-800 h-8 px-2.5 text-sm font-medium gap-1.5">
                <Pencil className="w-4 h-4" />
                Edit
              </Link>
            </>
          )}
          <RecordPaymentDialog invoice={invoice} />
          {/* We will add a client-side print button using window.print() */}
          <PrintButton />
        </div>
      </div>

      {isOverdue && (
        <div className="bg-error-container/30 border border-destructive/20 rounded-lg p-4 flex items-start gap-3 print:hidden">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
          <div>
            <h4 className="font-medium text-destructive">This invoice is overdue</h4>
            <p className="text-sm text-destructive/80">Payment was due on {format(new Date(invoice.due_date), 'MMM d, yyyy')}.</p>
          </div>
        </div>
      )}

      {/* Invoice Document */}
      <div className="print-area bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-sm overflow-hidden print:border-none print:shadow-none print:bg-transparent card-morph morph-fade-in">
        <div className="p-8 sm:p-12 space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              {/* Logo placeholder */}
              <div className="w-16 h-16 bg-gradient-to-tr from-sky-500 to-orange-400 rounded-xl mb-6 shadow-sm flex items-center justify-center text-white font-bold text-2xl tracking-tighter">
                E5
              </div>
              <h2 className="text-lg font-semibold text-foreground">E5 Chronicles</h2>
              <p className="text-on-surface-variant text-sm mt-1">
                Kathmandu, Nepal<br />
                info@e5chronicles.com
              </p>
            </div>
            <div className="text-left md:text-right">
              <h1 className="text-4xl font-bold text-foreground mb-2 uppercase tracking-tight">Invoice</h1>
              <p className="text-xl font-medium text-on-surface-variant mb-4">{invoice.invoice_number}</p>
              <div className="flex items-center md:justify-end gap-2 mb-4 print:hidden">
                <span className="text-sm text-on-surface-variant font-medium">Status:</span>
                {getStatusBadge(invoice.status)}
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-y border-outline-variant/40">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">Billed To</p>
              <h3 className="font-semibold text-foreground text-lg">{invoice.clients?.company_name}</h3>
              <p className="text-on-surface-variant text-sm mt-1 whitespace-pre-wrap">
                {invoice.clients?.billing_address || 'No billing address provided.'}
              </p>
              {invoice.clients?.tax_id && (
                <p className="text-on-surface-variant text-sm mt-2">Tax ID: {invoice.clients.tax_id}</p>
              )}
            </div>
            <div className="space-y-4 md:text-right">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Issue Date</p>
                <p className="text-foreground font-medium">{format(new Date(invoice.issue_date), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Due Date</p>
                <p className="text-foreground font-medium">{format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>
              </div>
              {invoice.projects && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Project</p>
                  <p className="text-foreground font-medium">{invoice.projects.title}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-foreground text-lg">{invoice.title}</h4>
            {invoice.description && <p className="text-on-surface-variant mt-1">{invoice.description}</p>}
          </div>

          {/* Line Items */}
          <div>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-outline-variant/40 text-on-surface-variant">
                <tr>
                  <th className="pb-3 font-semibold w-full">Description</th>
                  <th className="pb-3 font-semibold text-right whitespace-nowrap px-4">Qty</th>
                  <th className="pb-3 font-semibold text-right whitespace-nowrap px-4">Unit Price</th>
                  <th className="pb-3 font-semibold text-right whitespace-nowrap pl-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-4 text-foreground">{item.description}</td>
                    <td className="py-4 text-right text-on-surface-variant px-4">{item.quantity}</td>
                    <td className="py-4 text-right text-on-surface-variant px-4">{Number(item.unit_price).toLocaleString()}</td>
                    <td className="py-4 text-right text-foreground font-medium pl-4">{Number(item.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end pt-6">
            <div className="w-full md:w-1/2 space-y-3">
              <div className="flex justify-between text-on-surface-variant text-sm">
                <span>Subtotal</span>
                <span>{Number(invoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {invoice.currency}</span>
              </div>
              {invoice.discount_value > 0 && (
                <div className="flex justify-between text-on-surface-variant text-sm">
                  <span>Discount {invoice.discount_type === 'percentage' ? `(${invoice.discount_value}%)` : ''}</span>
                  <span className="text-amber-600 dark:text-amber-400">- {Number(invoice.discount_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {invoice.currency}</span>
                </div>
              )}
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between text-on-surface-variant text-sm">
                  <span>Tax ({invoice.tax_rate}%)</span>
                  <span>{Number(invoice.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {invoice.currency}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-foreground pt-3 border-t border-outline-variant/40">
                <span>Grand Total</span>
                <span>{Number(invoice.grand_total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {invoice.currency}</span>
              </div>
              {invoice.advance_received > 0 && (
                <div className="flex justify-between text-sky-600 dark:text-sky-400 text-sm font-medium">
                  <span>Advance Received</span>
                  <span>- {Number(invoice.advance_received).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {invoice.currency}</span>
                </div>
              )}
              {invoice.paid_amount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-500 text-sm font-medium">
                  <span>Amount Paid</span>
                  <span>- {Number(invoice.paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {invoice.currency}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-foreground pt-2">
                <span>Balance Due</span>
                <span>{Number(invoice.balance_due || invoice.grand_total - invoice.paid_amount - invoice.advance_received).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {invoice.currency}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="pt-12 border-t border-outline-variant/40 text-sm">
              <p className="font-semibold text-foreground mb-2">Notes & Terms</p>
              <p className="text-on-surface-variant whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment History - Hidden on print */}
      {payments.length > 0 && (
        <div className="space-y-4 print:hidden">
          <h3 className="text-lg font-semibold text-foreground">Payment History</h3>
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container border-b border-outline-variant/40 text-on-surface-variant">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Method</th>
                  <th className="py-3 px-4 font-semibold">Reference</th>
                  <th className="py-3 px-4 font-semibold">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4">{format(new Date(p.payment_date), 'MMM d, yyyy')}</td>
                    <td className="py-3 px-4 font-medium text-emerald-600 dark:text-emerald-500">
                      {Number(p.amount).toLocaleString()} {invoice.currency}
                    </td>
                    <td className="py-3 px-4 capitalize">{p.payment_method.replace('_', ' ')}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{p.reference_number || '-'}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{p.received_by_profile?.full_name || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
