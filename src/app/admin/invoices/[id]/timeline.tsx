'use client'

import { Clock, Send, Eye, CreditCard, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InvoiceTimelineEntry } from '@/types/invoice-timeline'

const eventConfig: Record<string, { icon: any; label: string; color: string }> = {
    draft: { icon: Clock, label: 'Draft Created', color: 'text-outline bg-surface-container-high' },
    sent: { icon: Send, label: 'Sent to Client', color: 'text-primary bg-primary-container' },
    viewed: { icon: Eye, label: 'Viewed by Client', color: 'text-tertiary bg-tertiary-container' },
    partially_paid: { icon: CreditCard, label: 'Partial Payment', color: 'text-m3-warning bg-m3-warning-subtle' },
    paid: { icon: CreditCard, label: 'Paid in Full', color: 'text-m3-success bg-m3-success-subtle' },
    overdue: { icon: AlertTriangle, label: 'Marked Overdue', color: 'text-m3-error bg-m3-error-subtle' },
    cancelled: { icon: XCircle, label: 'Cancelled', color: 'text-destructive bg-destructive/10' },
}

export function InvoiceTimeline({ entries }: { entries: InvoiceTimelineEntry[] }) {
    if (!entries || entries.length === 0) {
        return (
            <div className="rounded-2xl bg-surface-container-lowest ring-1 ring-outline-variant/40 p-5">
                <h3 className="font-semibold text-foreground text-sm mb-3">Status Timeline</h3>
                <p className="text-xs text-on-surface-variant">No timeline entries yet.</p>
            </div>
        )
    }

    // Sort by occurred_at ascending
    const sorted = [...entries].sort(
        (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
    )

    return (
        <div className="rounded-2xl bg-surface-container-lowest ring-1 ring-outline-variant/40 p-5">
            <h3 className="font-semibold text-foreground text-sm mb-4">Status Timeline</h3>
            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-outline-variant/50" />

                <div className="space-y-4">
                    {sorted.map((entry, i) => {
                        const cfg = eventConfig[entry.event] || eventConfig.draft
                        const Icon = cfg.icon
                        const isLast = i === sorted.length - 1

                        return (
                            <div key={entry.id} className="relative flex items-start gap-4">
                                {/* Dot */}
                                <div className={cn(
                                    'relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                                    cfg.color
                                )}>
                                    <Icon className="w-4 h-4" />
                                </div>

                                <div className={cn('flex-1 min-w-0 pb-1', isLast && 'pb-0')}>
                                    <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                                    <p className="text-xs text-on-surface-variant mt-0.5">
                                        {new Date(entry.occurred_at).toLocaleString('en-US', {
                                            year: 'numeric', month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                    {entry.metadata?.previous_status && (
                                        <p className="text-[11px] text-outline mt-0.5">
                                            from {entry.metadata.previous_status.replace('_', ' ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
