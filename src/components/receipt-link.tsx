'use client'

import { useState, useEffect } from 'react'
import { getStorageSignedUrl } from '@/app/actions/storage'
import { ExternalLink } from 'lucide-react'

export function ReceiptLink({ filePath }: { filePath: string | null }) {
    const [url, setUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(!!filePath)

    useEffect(() => {
        let cancelled = false
        if (!filePath) return
        getStorageSignedUrl('receipts', filePath).then((signedUrl) => {
            if (!cancelled) {
                setUrl(signedUrl)
                setLoading(false)
            }
        })
        return () => { cancelled = true }
    }, [filePath])

    if (!filePath) return <span className="text-zinc-400 text-sm">None</span>
    if (loading) return <span className="text-zinc-400 text-sm">Loading...</span>
    if (!url) return <span className="text-zinc-400 text-sm">Error</span>

    return (
        <a href={url} target="_blank" rel="noreferrer" className="text-sky-500 hover:text-sky-600 flex items-center gap-1 text-sm">
            View <ExternalLink className="w-3 h-3" />
        </a>
    )
}
