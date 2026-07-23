/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Pencil, Trash, FileDown } from "lucide-react"
import Link from 'next/link'
import { deleteInvoice } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function InvoiceTable({ initialInvoices, clients }: { initialInvoices: any[], clients: any[] }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const router = useRouter()

  const filteredInvoices = initialInvoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false
    if (clientFilter !== 'all' && inv.client_id !== clientFilter) return false
    if (dateFrom && new Date(inv.issue_date) < new Date(dateFrom)) return false
    if (dateTo && new Date(inv.issue_date) > new Date(dateTo)) return false
    return true
  })

  function handleExportCsv() {
    const headers = ['Invoice #', 'Client', 'Project', 'Amount', 'Currency', 'Status', 'Due Date', 'Paid Amount']
    const csvContent = [
      headers.join(','),
      ...filteredInvoices.map(inv => [
        inv.invoice_number,
        `"${inv.clients?.company_name || 'N/A'}"`,
        `"${inv.projects?.title || 'N/A'}"`,
        inv.grand_total,
        inv.currency,
        inv.status,
        inv.due_date,
        inv.paid_amount
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `invoices_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to cancel this invoice?')) return
    const res = await deleteInvoice(id)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Invoice cancelled.')
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'paid': return <Badge className="bg-primary-container text-on-primary-container">Paid</Badge>
      case 'partially_paid': return <Badge variant="secondary" className="bg-tertiary-container text-[var(--md-sys-color-on-tertiary-container)]">Partial</Badge>
      case 'sent': return <Badge variant="secondary" className="bg-m3-warning-subtle text-m3-warning">Sent</Badge>
      case 'draft': return <Badge variant="outline" className="text-on-surface-variant">Draft</Badge>
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>
      case 'cancelled': return <Badge variant="destructive" className="bg-destructive/20 text-destructive hover:bg-destructive/30">Cancelled</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 card-morph">
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Status</label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'all')}>
            <SelectTrigger className="bg-surface-container-high">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Client</label>
          <Select value={clientFilter} onValueChange={(v) => setClientFilter(v || 'all')}>
            <SelectTrigger className="bg-surface-container-high">
              <SelectValue placeholder="All Clients">
                {clientFilter !== 'all' ? clients.find(c => c.id === clientFilter)?.company_name : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 flex-1 min-w-[150px]">
          <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">From Date</label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-surface-container-high [color-scheme:light] dark:[color-scheme:dark]" />
        </div>

        <div className="space-y-1.5 flex-1 min-w-[150px]">
          <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">To Date</label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-surface-container-high [color-scheme:light] dark:[color-scheme:dark]" />
        </div>

        <Button variant="outline" onClick={handleExportCsv} className="bg-surface-container-lowest border-outline-variant btn-morph">
          <FileDown className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl overflow-hidden card-morph">
        <Table>
          <TableHeader className="bg-surface-container">
            <TableRow>
              <TableHead className="font-semibold text-on-surface-variant">Invoice #</TableHead>
              <TableHead className="font-semibold text-on-surface-variant">Client</TableHead>
              <TableHead className="font-semibold text-on-surface-variant">Project</TableHead>
              <TableHead className="font-semibold text-on-surface-variant">Amount</TableHead>
              <TableHead className="font-semibold text-on-surface-variant">Due Date</TableHead>
              <TableHead className="font-semibold text-on-surface-variant">Status</TableHead>
              <TableHead className="text-right font-semibold text-on-surface-variant">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-surface-container-high transition-colors">
                  <TableCell className="font-medium text-primary">
                    <Link href={`/admin/invoices/${inv.id}`}>{inv.invoice_number}</Link>
                  </TableCell>
                  <TableCell className="text-foreground">{inv.clients?.company_name || 'N/A'}</TableCell>
                  <TableCell className="text-on-surface-variant">{inv.projects?.title || '-'}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    {Number(inv.grand_total).toLocaleString()} {inv.currency}
                  </TableCell>
                  <TableCell className="text-on-surface-variant">{new Date(inv.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(inv.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0 btn-morph" />}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem render={<Link href={`/admin/invoices/${inv.id}`} />}>
                          <Eye className="w-4 h-4 mr-2 text-on-surface-variant" />
                          View Details
                        </DropdownMenuItem>
                        {inv.status === 'draft' && (
                          <DropdownMenuItem render={<Link href={`/admin/invoices/${inv.id}/edit`} />}>
                            <Pencil className="w-4 h-4 mr-2 text-primary" />
                            Edit Invoice
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(inv.id)} className="text-destructive focus:bg-error-container/30 focus:text-destructive">
                          <Trash className="w-4 h-4 mr-2" />
                          Cancel Invoice
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-on-surface-variant">
                  No invoices found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
