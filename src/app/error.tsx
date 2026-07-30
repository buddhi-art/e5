'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'

// Route-segment error boundary. Catches render/data errors in the app tree and
// forwards them to Sentry (via the global handler wired in instrumentation.ts).
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. You can try again; if the problem persists, contact an administrator.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
      <Button type="button" onClick={reset}>Try again</Button>
    </div>
  )
}
