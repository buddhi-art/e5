/* eslint-disable @typescript-eslint/no-explicit-any */
export type InvoiceTimelineEvent = 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'

export interface InvoiceTimelineEntry {
    id: string
    invoice_id: string
    event: InvoiceTimelineEvent
    occurred_at: string
    metadata: Record<string, any> | null
}
