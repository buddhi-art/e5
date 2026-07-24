'use client'

import { useState } from 'react'
import {
  Video, Link2, Send, CheckCircle2, Clock, AlertTriangle,
  History, ExternalLink, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { submitDeliverableDriveLink } from '@/app/admin/packages/actions'
import { ProjectAssetsCard } from '@/components/project-assets-card'
import { ProjectDiscussion } from '@/components/project-discussion'

interface RevisionHistoryItem {
  id: string
  revisionNumber: number
  submittedDriveLink: string
  founderComment?: string
  createdAt: string
}

interface DeliverableItem {
  id: string
  package_id: string
  title: string
  drive_link?: string
  status: 'UNASSIGNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'REVISION_REQUESTED' | 'APPROVED'
  revision_count: number
  revision_history?: RevisionHistoryItem[]
  packages?: {
    package_number: string
    title: string
    projects?: {
      id: string
      raw_footage_link?: string
      brand_assets_link?: string
      client_brief_notes?: string
    }
    clients?: { company_name: string }
  }
}

export function DeliverableWorkspace({
  deliverables,
  currentUserId,
  onRefresh
}: {
  deliverables: DeliverableItem[]
  currentUserId: string
  onRefresh?: () => void
}) {
  const [links, setLinks] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  const handleSubmit = async (delId: string) => {
    const driveLink = links[delId] || ''
    if (!driveLink.trim()) {
      toast.error('Please enter a Google Drive link before submitting.')
      return
    }

    setSubmittingId(delId)
    try {
      const res = await submitDeliverableDriveLink(delId, driveLink)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Deliverable submitted for Founder review!')
        if (onRefresh) onRefresh()
      }
    } catch {
      toast.error('Failed to submit link.')
    } finally {
      setSubmittingId(null)
    }
  }

  if (deliverables.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40">
        <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mx-auto mb-3">
          <Video className="w-6 h-6 text-on-surface-variant" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No Package Deliverables Assigned</h3>
        <p className="text-xs text-on-surface-variant mt-1">You currently have no package editing deliverables assigned to you.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {deliverables.map((del) => {
        const isLocked = del.status === 'UNDER_REVIEW' || del.status === 'APPROVED'
        const isRevisionRequested = del.status === 'REVISION_REQUESTED'
        const isApproved = del.status === 'APPROVED'
        const history = Array.isArray(del.revision_history) ? del.revision_history : []
        const latestRevision = history[0]

        return (
          <div
            key={del.id}
            className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5 shadow-sm space-y-4 transition-all hover:border-outline-variant"
          >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/40 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant border border-outline-variant/50">
                    {del.packages?.package_number || 'PACKAGE'}
                  </span>
                  <span className="text-xs font-medium text-on-surface-variant">
                    {del.packages?.clients?.company_name || 'Client'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground mt-1 flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary shrink-0" />
                  {del.title}
                </h3>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20">
                  Revision #{del.revision_count || 0}
                </span>

                <span
                  className={`px-3 py-1 text-xs font-extrabold uppercase tracking-wide rounded-full border ${
                    isApproved
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      : isRevisionRequested
                      ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                      : del.status === 'UNDER_REVIEW'
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                      : 'bg-sky-500/10 text-sky-600 border-sky-500/30'
                  }`}
                >
                  {del.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Revision Feedback Banner */}
            {isRevisionRequested && latestRevision && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5 uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4" />
                    Revision #{latestRevision.revisionNumber} Feedback
                  </span>
                  <span className="text-[11px] text-rose-600/80 font-medium">
                    Requested by Founder
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground bg-surface-container-lowest/80 p-3 rounded-lg border border-rose-500/20">
                  &ldquo;{latestRevision.founderComment}&rdquo;
                </p>
                {latestRevision.submittedDriveLink && (
                  <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                    <span>Previous Link:</span>
                    <a
                      href={latestRevision.submittedDriveLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline truncate max-w-md inline-block"
                    >
                      {latestRevision.submittedDriveLink}
                    </a>
                  </p>
                )}
              </div>
            )}

            {/* Approved Banner */}
            {isApproved && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-600 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                This deliverable has been approved by the Founder! Work is locked.
              </div>
            )}

            {/* Under Review Banner */}
            {del.status === 'UNDER_REVIEW' && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-600 text-xs font-bold">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Submitted & Under Founder Review
                </span>
                {del.drive_link && (
                  <a
                    href={del.drive_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                  >
                    View Drive Link <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Submission Input Box */}
            {!isApproved && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-on-surface-variant">
                  {isRevisionRequested ? 'Submit Revised Google Drive Link:' : 'Google Drive Deliverable Link:'}
                </label>

                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="relative flex-1">
                    <Link2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      type="url"
                      disabled={isLocked}
                      value={links[del.id] !== undefined ? links[del.id] : del.drive_link || ''}
                      onChange={(e) => setLinks(prev => ({ ...prev, [del.id]: e.target.value }))}
                      placeholder="https://drive.google.com/file/d/..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground disabled:opacity-60"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isLocked || submittingId === del.id}
                    onClick={() => handleSubmit(del.id)}
                    className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                  >
                    {submittingId === del.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    {isRevisionRequested ? 'Submit Revised Link' : 'Submit for Founder Review'}
                  </button>
                </div>
              </div>
            )}

            {del.packages?.projects && (
                <div className="mt-4 mb-4 space-y-4">
                  <ProjectAssetsCard 
                    projectId={del.packages.projects.id}
                    isAdmin={false}
                    initialRawFootage={del.packages.projects.raw_footage_link}
                    initialBrandAssets={del.packages.projects.brand_assets_link}
                    initialClientBrief={del.packages.projects.client_brief_notes}
                  />
                  <ProjectDiscussion 
                    projectId={del.packages.projects.id}
                    currentUserId={currentUserId}
                  />
                </div>
            )}

            {/* Link History Accordion */}
            {history.length > 0 && (
              <details className="text-xs group">
                <summary className="cursor-pointer font-semibold text-on-surface-variant hover:text-foreground flex items-center gap-1.5 list-none py-1">
                  <History className="w-3.5 h-3.5 text-primary" />
                  <span>Revision Link History ({history.length})</span>
                </summary>
                <div className="mt-2 space-y-2 pl-2 border-l-2 border-outline-variant/40">
                  {history.map((rev) => (
                    <div key={rev.id} className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
                        <span>Revision #{rev.revisionNumber}</span>
                        <span className="text-on-surface-variant font-normal">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {rev.submittedDriveLink && (
                        <a
                          href={rev.submittedDriveLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-primary hover:underline block truncate"
                        >
                          {rev.submittedDriveLink}
                        </a>
                      )}
                      {rev.founderComment && (
                        <p className="text-[11px] text-on-surface-variant italic bg-surface-container-high/40 p-1.5 rounded">
                          &ldquo;{rev.founderComment}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )
      })}
    </div>
  )
}
