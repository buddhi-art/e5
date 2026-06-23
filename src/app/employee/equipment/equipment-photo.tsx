'use client'

import { useState, useEffect } from 'react'
import { getStorageSignedUrl } from '@/app/actions/storage'
import { Image as ImageIcon } from 'lucide-react'

export function EquipmentPhoto({ imageUrl, name }: { imageUrl: string; name: string }) {
    const [url, setUrl] = useState<string | null>(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        let cancelled = false
        getStorageSignedUrl('equipment-photos', imageUrl).then((signedUrl) => {
            if (!cancelled) {
                if (signedUrl) setUrl(signedUrl)
                else setError(true)
            }
        })
        return () => { cancelled = true }
    }, [imageUrl])

    if (error || !url) {
        return <ImageIcon className="w-6 h-6 text-zinc-400" />
    }

    return <img src={url} alt={name} className="w-full h-full object-cover" />
}
