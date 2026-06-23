'use client'

import { useState, useEffect } from 'react'
import { getStorageSignedUrl } from '@/app/actions/storage'

interface StorageImageProps {
    bucket: string
    filePath: string
    alt: string
    className?: string
    fallback?: React.ReactNode
}

export function StorageImage({ bucket, filePath, alt, className, fallback }: StorageImageProps) {
    const [url, setUrl] = useState<string | null>(null)
    const [error, setError] = useState(!filePath)

    useEffect(() => {
        let cancelled = false
        if (!filePath) return
        getStorageSignedUrl(bucket, filePath).then((signedUrl) => {
            if (!cancelled) {
                if (signedUrl) {
                    setUrl(signedUrl)
                } else {
                    setError(true)
                }
            }
        })
        return () => { cancelled = true }
    }, [bucket, filePath])

    if (error || !url) {
        return fallback || <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <span className="text-zinc-400 text-xs">No image</span>
        </div>
    }

    return <img src={url} alt={alt} className={className} />
}
