'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { ImageOff } from 'lucide-react'
import { getStorageSignedUrl } from '@/app/actions/storage'

interface StorageImageProps {
  bucket: string
  filePath: string
  alt: string
  className?: string
  fallback?: ReactNode
  sizes?: string
}

/**
 * Resolves a private Supabase Storage path into a signed, responsive image.
 * Remounting per path keeps loading and failure state aligned without
 * synchronously resetting state inside an effect.
 */
export function StorageImage(props: StorageImageProps) {
  return <ResolvedStorageImage key={`${props.bucket}:${props.filePath}`} {...props} />
}

function ResolvedStorageImage({
  bucket,
  filePath,
  alt,
  className,
  fallback,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: StorageImageProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(!filePath)
  const [loading, setLoading] = useState(Boolean(filePath))

  useEffect(() => {
    if (!filePath) return
    let cancelled = false

    void getStorageSignedUrl(bucket, filePath)
      .then((signedUrl) => {
        if (cancelled) return
        setUrl(signedUrl)
        setFailed(!signedUrl)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [bucket, filePath])

  if (failed || !url) {
    if (loading) {
      return (
        <div className={`flex h-full w-full items-center justify-center bg-surface-container-high ${className || ''}`} aria-busy="true" aria-label={`Loading ${alt}`}>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      )
    }

    return fallback || (
      <div className={`flex h-full w-full flex-col items-center justify-center gap-1.5 bg-surface-container-high text-outline ${className || ''}`} role="img" aria-label={`${alt} unavailable`}>
        <ImageOff className="h-5 w-5" aria-hidden="true" />
        <span className="text-xs">Image unavailable</span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className || ''}`}>
      <Image
        src={url}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
