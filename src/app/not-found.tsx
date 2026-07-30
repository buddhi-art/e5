import Link from 'next/link'

// Root 404 boundary — rendered for unmatched routes and notFound() calls.
export default function NotFound() {
    return (
        <div
            style={{
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                padding: '2rem',
                textAlign: 'center',
            }}
        >
            <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>404</h1>
            <p style={{ color: '#666' }}>We couldn&apos;t find the page you were looking for.</p>
            <Link
                href="/"
                style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '0.5rem',
                    background: '#111',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                }}
            >
                Back to home
            </Link>
        </div>
    )
}
