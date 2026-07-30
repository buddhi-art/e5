// Next.js instrumentation hook.
// This is the ONLY place Next 13+/16 loads server- and edge-side Sentry config.
// Without it, sentry.server.config.ts is never evaluated and no server error is captured.
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.server.config')
  }
}

// Forward React Server Component / route-handler errors to Sentry.
export async function onRequestError(
  ...args: Parameters<typeof import('@sentry/nextjs').captureRequestError>
) {
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureRequestError(...args)
}
