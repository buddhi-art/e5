/**
 * Centralised error reporting for server actions.
 *
 * Every server-action catch block should call `captureActionError` instead of
 * `console.error` so errors make it into Sentry (if configured) rather than
 * disappearing into unstructured server logs.
 */

// Dynamic import to avoid bundling Sentry when it's not configured.
// `undefined` = not yet attempted; `null` = attempted and unavailable.
let _Sentry: typeof import('@sentry/nextjs') | null | undefined = undefined
async function getSentry() {
    if (_Sentry === undefined) {
        try {
            _Sentry = await import('@sentry/nextjs')
        } catch {
            _Sentry = null
        }
    }
    return _Sentry
}

/**
 * Report a caught error to Sentry (when available) and return the user-safe
 * message string suitable for a `return { error: ... }` response.
 */
export async function captureActionError(
    context: string,
    caught: unknown,
): Promise<string> {
    // Always emit a structured console line so the error is grep-able.
    const message = caught instanceof Error ? caught.message : String(caught)
    console.error(
        `[action error] ${context}:`,
        caught instanceof Error ? caught : message,
    )

    // Route to Sentry when the SDK is present.
    const Sentry = await getSentry()
    if (Sentry) {
        Sentry.captureException(
            caught instanceof Error ? caught : new Error(`${context}: ${message}`),
            { tags: { context, source: 'server-action' } },
        )
    }

    return message || 'An unexpected error occurred'
}
