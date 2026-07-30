// Root loading UI — shown during server-component navigation transitions.
export default function Loading() {
    return (
        <div
            style={{
                minHeight: '60vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
            }}
            role="status"
            aria-live="polite"
            aria-label="Loading"
        >
            <span
                style={{
                    width: '2rem',
                    height: '2rem',
                    border: '3px solid #ddd',
                    borderTopColor: '#111',
                    borderRadius: '50%',
                    animation: 'e5-spin 0.7s linear infinite',
                }}
            />
            <style>{`@keyframes e5-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
