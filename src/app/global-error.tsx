'use client'

// Global error boundary — catches errors thrown in the root layout itself.
// Must render its own <html>/<body> because it replaces the root layout.
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
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
        <html lang="en">
            <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
                <div
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        padding: '2rem',
                        textAlign: 'center',
                    }}
                >
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Something went wrong</h1>
                    <p style={{ color: '#666', maxWidth: '32rem' }}>
                        An unexpected error occurred. The team has been notified. You can try again.
                    </p>
                    <button
                        onClick={() => reset()}
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: '#111',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                        }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    )
}
