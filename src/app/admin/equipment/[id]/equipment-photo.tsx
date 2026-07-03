'use client'

import { useState, useEffect } from 'react'
import { getStorageSignedUrl } from '@/app/actions/storage'
import { Image as ImageIcon, Search, ScanLine } from 'lucide-react'
import { lookupByAssetId } from '../actions'

export function EquipmentPhoto({ imageUrl, name }: { imageUrl: string; name: string }) {
    const [url, setUrl] = useState<string | null>(null)
    const [error, setError] = useState(!imageUrl)
    const [assetIdInput, setAssetIdInput] = useState('')
    const [lookupResult, setLookupResult] = useState<{ id: string; name: string; status: string } | null>(null)
    const [lookupError, setLookupError] = useState<string | null>(null)
    const [lookupLoading, setLookupLoading] = useState(false)

    useEffect(() => {
        if (!imageUrl) return
        let cancelled = false
        getStorageSignedUrl('equipment-photos', imageUrl).then((signedUrl) => {
            if (!cancelled) {
                if (signedUrl) setUrl(signedUrl)
                else setError(true)
            }
        })
        return () => { cancelled = true }
    }, [imageUrl])

    const handleAssetLookup = async () => {
        if (!assetIdInput.trim()) return
        setLookupLoading(true)
        setLookupError(null)
        setLookupResult(null)
        try {
            const result = await lookupByAssetId(assetIdInput.trim())
            if (result.error) {
                setLookupError(result.error)
            } else if (result.data) {
                setLookupResult(result.data)
            }
        } catch {
            setLookupError('Lookup failed. Check the asset ID and try again.')
        } finally {
            setLookupLoading(false)
        }
    }

    return (
        <div className="space-y-3">
            {/* Photo display */}
            {error || !url ? (
                <div className="w-full aspect-square rounded-xl bg-surface-container-high flex flex-col items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-outline mb-2" />
                    <span className="text-xs text-outline">No photo</span>
                </div>
            ) : (
                <img src={url} alt={name} className="w-full aspect-square object-cover rounded-xl" />
            )}

            {/* Manual asset-ID lookup fallback for QR failures */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5">
                    <ScanLine className="w-3.5 h-3.5" />
                    Asset ID Lookup (QR fallback)
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={assetIdInput}
                        onChange={(e) => setAssetIdInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAssetLookup()}
                        placeholder="Scan QR or type serial/asset ID..."
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-outline-variant bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                        onClick={handleAssetLookup}
                        disabled={lookupLoading || !assetIdInput.trim()}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all"
                    >
                        {lookupLoading ? (
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Search className="w-4 h-4" />
                        )}
                    </button>
                </div>
                {lookupError && (
                    <p className="text-xs text-m3-error">{lookupError}</p>
                )}
                {lookupResult && (
                    <div className="text-xs bg-m3-success-subtle text-m3-success rounded-lg p-2">
                        Found: <strong>{lookupResult.name}</strong> — {lookupResult.status}
                    </div>
                )}
            </div>
        </div>
    )
}
