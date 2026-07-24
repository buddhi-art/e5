'use client'

import { useState } from 'react'
import {
  Video, ExternalLink, CheckCircle2, AlertTriangle,
  RotateCcw, RefreshCw, Clock, ShieldCheck, X
} from 'lucide-react'
import { toast } from 'sonner'
import { approveDeliverable, requestDeliverableRevision } from '@/app/admin/packages/actions'
import { ProjectAssetsCard } from '@/components/project-assets-card'
import { ProjectDiscussion } from '@/components/project-discussion'

interface ReviewItem {
  id: string
  package_id: string
  title: string
  drive_link?: string
  status: string
  revision_count: number
  revision_history?: { id: string; revisionNumber: number; submittedDriveLink: string; founderComment?: string; createdAt: string }[]
  profiles?: { full_name: string }
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

export function ReviewQueueClient({
  initialReviews,
  currentUserId
}: {
  initialReviews: ReviewItem[]
  currentUserId: string
}) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Revision Modal State
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [revisionSubmitting, setRevisionSubmitting] = useState(false)

  const handleApprove = async (delId: string, pkgId: string) => {
    setLoadingId(delId)
    try {
      const res = await approveDeliverable(delId, pkgId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Deliverable approved! Status updated to DONE.')
        setReviews(prev => prev.filter(r => r.id !== delId))
      }
    } catch {
      toast.error('Failed to approve deliverable.')
    } finally {
      setLoadingId(null)
    }
  }

  const handleConfirmRevision = async () => {
    if (!selectedReview) return
    if (!feedbackComment.trim()) {
      toast.error('Feedback comment is mandatory when requesting a revision.')
      return
    }

    setRevisionSubmitting(true)
    try {
      const res = await requestDeliverableRevision(
        selectedReview.id,
        selectedReview.package_id,
        feedbackComment
      )
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Revision #${(selectedReview.revision_count || 0) + 1} requested! Employee notified.`)
        setReviews(prev => prev.filter(r => r.id !== selectedReview.id))
        setSelectedReview(null)
        setFeedbackComment('')
      }
    } catch {
      toast.error('Failed to submit revision request.')
    } finally {
      setRevisionSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Review Queue Summary Card */}
      <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Pending Founder Reviews</h2>
            <p className="text-xs text-on-surface-variant">Review submitted Google Drive links and approve or request revisions.</p>
          </div>
        </div>
        <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-extrabold">
          {reviews.length} Pending
        </span>
      </div>

      {/* Review Cards Grid */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-surface-container-lowest border border-outline-variant/40">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground">All Reviews Clear!</h3>
          <p className="text-xs text-on-surface-variant mt-1">There are no submitted package deliverables currently waiting for Founder review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Package & Client Info */}
                <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
                  <div className="truncate">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                      {rev.packages?.package_number || 'PKG'}
                    </span>
                    <span className="text-xs font-semibold text-primary ml-2 truncate">
                      {rev.packages?.clients?.company_name || 'Client'}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-purple-500/10 text-purple-600 border border-purple-500/20 shrink-0">
                    Rev #{rev.revision_count || 0}
                  </span>
                </div>

                {/* Deliverable Title & Assigned Editor */}
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Video className="w-4 h-4 text-primary shrink-0" />
                    {rev.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Assigned Editor: <span className="font-semibold text-foreground">{rev.profiles?.full_name || 'Unassigned'}</span>
                  </p>
                </div>

                {/* Drive Link Preview Button */}
                {rev.drive_link && (
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Submitted Link</span>
                    <a
                      href={rev.drive_link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-all truncate border border-primary/20"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{rev.drive_link}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Project Assets Card */}
              {rev.packages?.projects && (
                <div className="mt-4 px-4 pb-4 space-y-4">
                  <ProjectAssetsCard 
                    projectId={rev.packages.projects.id}
                    isAdmin={true}
                    initialRawFootage={rev.packages.projects.raw_footage_link}
                    initialBrandAssets={rev.packages.projects.brand_assets_link}
                    initialClientBrief={rev.packages.projects.client_brief_notes}
                  />
                  <ProjectDiscussion 
                    projectId={rev.packages.projects.id}
                    currentUserId={currentUserId}
                  />
                </div>
              )}

              {/* Action / State Section */}
              <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/40">
                <button
                  type="button"
                  disabled={loadingId === rev.id}
                  onClick={() => handleApprove(rev.id, rev.package_id)}
                  className="flex-1 px-3 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loadingId === rev.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Done (Approve)
                </button>

                <button
                  type="button"
                  disabled={loadingId === rev.id}
                  onClick={() => {
                    setSelectedReview(rev)
                    setFeedbackComment('')
                  }}
                  className="flex-1 px-3 py-2 text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/30 hover:bg-rose-500/20 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Revise (Request Changes)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revision Feedback Dialog Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 morph-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Request Revision #{ (selectedReview.revision_count || 0) + 1 }
              </h3>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="text-on-surface-variant hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <p className="font-semibold text-foreground">{selectedReview.title}</p>
              <p className="text-on-surface-variant">Editor: {selectedReview.profiles?.full_name || 'Assigned Editor'}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Mandatory Founder Feedback Comment: <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={4}
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="e.g. Please fix the lower-third graphics at 0:15 and adjust audio level on voiceover."
                className="w-full p-3 text-xs bg-surface-container-low border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/40 text-foreground"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revisionSubmitting || !feedbackComment.trim()}
                onClick={handleConfirmRevision}
                className="px-5 py-2 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {revisionSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm Revision Request (+1)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
