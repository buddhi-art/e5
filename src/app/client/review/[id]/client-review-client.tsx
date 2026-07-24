'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Video, CheckCircle2, AlertTriangle, ExternalLink, MessageSquare } from 'lucide-react'
import { submitClientReview } from '@/app/actions/client-reviews'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function ClientReviewClient({
  deliverable,
  reviews
}: {
  deliverable: any
  reviews: any[]
}) {
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isApproved = deliverable.status === 'APPROVED'
  const isRevisionRequested = deliverable.status === 'REVISION_REQUESTED'
  
  // The client sees the latest link in the revision history, or the drive_link
  const history = Array.isArray(deliverable.revision_history) ? deliverable.revision_history : []
  const latestRevision = history[0]
  const currentLink = latestRevision ? latestRevision.submittedDriveLink : deliverable.drive_link

  const handleAction = async (status: 'APPROVED' | 'REVISION_REQUESTED') => {
    if (status === 'REVISION_REQUESTED' && !feedback.trim()) {
      toast.error('Please provide feedback for the revision.')
      return
    }

    setSubmitting(true)
    const res = await submitClientReview(deliverable.id, status, feedback)
    if (res.error) {
      toast.error(res.error)
      setSubmitting(false)
    } else {
      toast.success(status === 'APPROVED' ? 'Deliverable approved!' : 'Revision requested!')
      // Page will revalidate and reload via server action
    }
  }

  return (
    <div className="space-y-6">
      {/* Current File Preview Card */}
      <Card className="bg-surface-container border-outline-variant/50 elevation-1 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                Latest Deliverable Version
              </h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Please review the video/asset from the link below.
              </p>
              
              {currentLink ? (
                <div className="mt-4">
                  <a
                    href={currentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-semibold transition-all border border-primary/20"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Deliverable Link
                  </a>
                </div>
              ) : (
                <p className="mt-4 text-sm text-amber-600 font-medium p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 inline-block">
                  The team has not submitted a link yet.
                </p>
              )}
            </div>
            
            {/* Status Badge */}
            <div className="shrink-0">
              {isApproved && (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-m3-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-m3-success" />
                  </div>
                  <span className="text-xs font-bold text-m3-success">APPROVED</span>
                </div>
              )}
              {isRevisionRequested && (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-xs font-bold text-amber-600">REVISION REQUESTED</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions (Only show if link exists and not approved) */}
      {currentLink && !isApproved && (
        <Card className="bg-surface-container-low border-outline-variant/60">
          <CardContent className="p-6 space-y-6">
            <h3 className="text-lg font-bold text-foreground">Your Decision</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-on-surface mb-2 block">
                  Feedback / Revision Notes
                </label>
                <Textarea 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="If requesting a revision, please detail what needs to be changed (e.g., 'At 0:15 change the font size')."
                  className="min-h-[120px] bg-surface-container"
                  disabled={submitting}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => handleAction('APPROVED')}
                  disabled={submitting}
                  className="bg-m3-success text-white hover:bg-m3-success/90 h-12 flex-1 font-bold text-base"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Approve Deliverable
                </Button>
                <Button 
                  onClick={() => handleAction('REVISION_REQUESTED')}
                  disabled={submitting || !feedback.trim()}
                  variant="outline"
                  className="h-12 flex-1 font-bold text-base border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Request Revision
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review History */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-outline" />
            Previous Feedback History
          </h3>
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 flex gap-4">
                <div className="shrink-0 mt-1">
                  {r.status === 'APPROVED' ? (
                    <CheckCircle2 className="w-5 h-5 text-m3-success" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-xs font-bold uppercase",
                      r.status === 'APPROVED' ? 'text-m3-success' : 'text-amber-600'
                    )}>
                      {r.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-outline">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  {r.feedback && (
                    <p className="text-sm text-on-surface whitespace-pre-wrap">{r.feedback}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
