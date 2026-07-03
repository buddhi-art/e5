'use client'

import { useState } from 'react'
import { updateEmployeeProfile } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Globe, Camera, Music2, MessageCircle, Lock, ExternalLink } from 'lucide-react'
import { normalizeUrl } from '@/lib/utils'

export function ProfileForm({ profile }: { profile: any }) {
    const [loading, setLoading] = useState(false)

    // Editable fields — use state so UI updates immediately after save
    const [location, setLocation] = useState(profile.location || '')
    const [dob, setDob] = useState(profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '')
    const [cvUrl, setCvUrl] = useState(profile.cv_url || '')

    const socialUrls = profile.social_urls || {}
    const [facebook, setFacebook] = useState(socialUrls.facebook || '')
    const [instagram, setInstagram] = useState(socialUrls.instagram || '')
    const [tiktok, setTiktok] = useState(socialUrls.tiktok || '')
    const [threads, setThreads] = useState(socialUrls.threads || '')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData()
        formData.set('location', location)
        formData.set('dob', dob)
        formData.set('cvUrl', cvUrl)
        formData.set('facebook', facebook)
        formData.set('instagram', instagram)
        formData.set('tiktok', tiktok)
        formData.set('threads', threads)

        const result = await updateEmployeeProfile(formData)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Profile updated successfully')
        }
        setLoading(false)
    }

    const disabledInputClass = " bg-surface-container-highest border-outline-variant text-outline cursor-not-allowed"
    const editableInputClass = " bg-surface-container-high border-outline-variant text-on-surface"

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Read-only notice */}
            <div className="flex items-center gap-2 text-xs text-outline bg-surface-container-high rounded-md px-3 py-2 border border-outline-variant">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Fields marked with a lock icon are managed by admin and cannot be edited.</span>
            </div>

            {/* Full Name (Locked) */}
            <div className="space-y-2">
                <Label className="text-on-surface text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-outline" /> Full Name
                </Label>
                <Input
                    value={profile.full_name || ''}
                    disabled
                    className={disabledInputClass}
                />
            </div>

            {/* Login ID (Locked) */}
            <div className="space-y-2">
                <Label className="text-on-surface text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-outline" /> Login ID
                </Label>
                <Input
                    value={profile.email || ''}
                    disabled
                    className={disabledInputClass}
                />
            </div>

            {/* Designation (Locked) */}
            <div className="space-y-2">
                <Label className="text-on-surface text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-outline" /> Designation
                </Label>
                <Input
                    value={profile.designation || ''}
                    disabled
                    className={disabledInputClass}
                />
            </div>

            {/* Contact Email (Locked) */}
            <div className="space-y-2">
                <Label className="text-on-surface text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-outline" /> Contact Email
                </Label>
                <Input
                    value={profile.contact_email || ''}
                    disabled
                    className={disabledInputClass}
                />
            </div>

            {/* Phone Number (Locked) */}
            <div className="space-y-2">
                <Label className="text-on-surface text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-outline" /> Phone Number
                </Label>
                <Input
                    value={profile.phone_number || ''}
                    disabled
                    className={disabledInputClass}
                />
            </div>

            {/* Joining Date (Locked) */}
            <div className="space-y-2">
                <Label className="text-on-surface text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-outline" /> Joining Date
                </Label>
                <Input
                    value={profile.joining_date ? new Date(profile.joining_date).toLocaleDateString() : 'Not set'}
                    disabled
                    className={disabledInputClass}
                />
            </div>

            {/* Divider */}
            <div className="border-t border-outline-variant pt-4">
                <h3 className="text-on-surface text-sm font-semibold tracking-wider uppercase mb-4">Editable Information</h3>
            </div>

            {/* Location (Editable) */}
            <div className="space-y-2">
                <Label htmlFor="location" className="text-on-surface text-xs uppercase tracking-wider font-medium">Location</Label>
                <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Kathmandu, Nepal"
                    className={editableInputClass}
                />
            </div>

            {/* Date of Birth (Editable) */}
            <div className="space-y-2">
                <Label htmlFor="dob" className="text-on-surface text-xs uppercase tracking-wider font-medium">Date of Birth</Label>
                <Input
                    id="dob"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    type="date"
                    className={`${editableInputClass} `}
                />
            </div>

            {/* CV URL (Editable) */}
            <div className="space-y-2">
                <Label htmlFor="cvUrl" className="text-on-surface text-xs uppercase tracking-wider font-medium">CV Link (URL)</Label>
                <Input
                    id="cvUrl"
                    value={cvUrl}
                    onChange={(e) => setCvUrl(e.target.value)}
                    type="url"
                    placeholder="e.g. Google Drive/Dropbox link"
                    className={editableInputClass}
                />
            </div>

            {/* Current Social Links (Display) */}
            {(socialUrls.facebook || socialUrls.instagram || socialUrls.tiktok || socialUrls.threads) && (
                <div className="border-t border-outline-variant pt-4 space-y-3">
                    <h3 className="text-on-surface text-sm font-semibold tracking-wider uppercase">Your Social Profiles</h3>
                    <div className="flex gap-2">
                        {socialUrls.facebook && (
                            <a href={normalizeUrl(socialUrls.facebook)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-container-high rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors text-sm">
                                <Globe className="w-4 h-4" /> Facebook <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                        {socialUrls.instagram && (
                            <a href={normalizeUrl(socialUrls.instagram)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-container-high rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors text-sm">
                                <Camera className="w-4 h-4" /> Instagram <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                        {socialUrls.tiktok && (
                            <a href={normalizeUrl(socialUrls.tiktok)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-container-high rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors text-sm">
                                <Music2 className="w-4 h-4" /> TikTok <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                        {socialUrls.threads && (
                            <a href={normalizeUrl(socialUrls.threads)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-container-high rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors text-sm">
                                <MessageCircle className="w-4 h-4" /> Threads <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Social Links (Editable) */}
            <div className="border-t border-outline-variant pt-4 space-y-4">
                <h3 className="text-on-surface text-sm font-semibold tracking-wider uppercase">Edit Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Globe className="h-4 w-4 text-outline" />
                        </div>
                        <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Facebook URL" className={`pl-10 ${editableInputClass}`} />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Camera className="h-4 w-4 text-outline" />
                        </div>
                        <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram URL" className={`pl-10 ${editableInputClass}`} />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Music2 className="h-4 w-4 text-outline" />
                        </div>
                        <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="TikTok URL" className={`pl-10 ${editableInputClass}`} />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MessageCircle className="h-4 w-4 text-outline" />
                        </div>
                        <Input value={threads} onChange={(e) => setThreads(e.target.value)} placeholder="Threads URL" className={`pl-10 ${editableInputClass}`} />
                    </div>
                </div>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-on-surface font-semibold shadow-[0_0_20px_rgba(249,115,22,0.15)] hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all border-none" disabled={loading}>
                {loading ? 'Saving...' : 'Save Profile'}
            </Button>
        </form>
    )
}
