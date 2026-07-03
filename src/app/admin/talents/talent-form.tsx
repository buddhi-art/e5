'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTalent, updateTalent, addTalentType } from './actions'
import { Talent } from '@/types/talent'

const GENDERS = ['male', 'female', 'other'] as const
const RATE_TYPES = ['per_project', 'per_day', 'per_hour'] as const
const CURRENCIES = ['NPR', 'USD', 'EUR'] as const

export function TalentForm({ initialData }: { initialData?: Talent }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [file, setFile] = useState<File | null>(null)
    const [talentTypes, setTalentTypes] = useState<string[]>([
        'model', 'actor', 'voice_artist', 'dancer', 'makeup_artist',
        'stylist', 'photographer', 'freelance_editor', 'freelance_videographer',
        'sound_engineer', 'colorist', 'motion_designer', 'other',
    ])
    const [showNewType, setShowNewType] = useState(false)
    const [newType, setNewType] = useState('')

    const [fullName, setFullName] = useState(initialData?.full_name || '')
    const [stageName, setStageName] = useState(initialData?.stage_name || '')
    const [talentType, setTalentType] = useState(initialData?.talent_type || '')
    const [phoneNumber, setPhoneNumber] = useState(initialData?.phone_number || '')
    const [email, setEmail] = useState(initialData?.email || '')
    const [gender, setGender] = useState(initialData?.gender || '')
    const [dateOfBirth, setDateOfBirth] = useState(initialData?.date_of_birth ? initialData.date_of_birth.split('T')[0] : '')
    const [location, setLocation] = useState(initialData?.location || '')
    const [heightCm, setHeightCm] = useState(initialData?.height_cm ? String(initialData.height_cm) : '')
    const [languagesStr, setLanguagesStr] = useState(initialData?.languages?.join(', ') || '')
    const [skillsStr, setSkillsStr] = useState(initialData?.skills?.join(', ') || '')
    const [rateType, setRateType] = useState(initialData?.rate_type || 'per_project')
    const [rateAmount, setRateAmount] = useState(initialData?.rate_amount ? String(initialData.rate_amount) : '')
    const [currency, setCurrency] = useState(initialData?.currency || 'NPR')
    const [portfolioInstagram, setPortfolioInstagram] = useState(
        initialData?.portfolio_urls && typeof initialData.portfolio_urls === 'object'
            ? (initialData.portfolio_urls as Record<string, string>).instagram || ''
            : ''
    )
    const [portfolioWebsite, setPortfolioWebsite] = useState(
        initialData?.portfolio_urls && typeof initialData.portfolio_urls === 'object'
            ? (initialData.portfolio_urls as Record<string, string>).website || ''
            : ''
    )
    const [portfolioPdf, setPortfolioPdf] = useState(
        initialData?.portfolio_urls && typeof initialData.portfolio_urls === 'object'
            ? (initialData.portfolio_urls as Record<string, string>).pdf || ''
            : ''
    )
    const [notes, setNotes] = useState(initialData?.notes || '')

    useEffect(() => {
        fetch('/admin/talents/api/types')
            .then(res => res.json())
            .then(data => { if (data?.length) setTalentTypes(data) })
            .catch(() => { })
    }, [])

    async function handleAddType() {
        if (!newType.trim()) return
        const result = await addTalentType(newType.trim())
        if (result.error) {
            toast.error(result.error)
        } else {
            setTalentTypes(prev => [...prev, newType.trim()])
            setTalentType(newType.trim())
            setShowNewType(false)
            setNewType('')
            toast.success('Talent type added')
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!fullName || !talentType) {
            toast.error('Full name and talent type are required')
            return
        }

        startTransition(async () => {
            const formData = new FormData()
            formData.append('full_name', fullName)
            formData.append('talent_type', talentType)
            if (stageName) formData.append('stage_name', stageName)
            if (phoneNumber) formData.append('phone_number', phoneNumber)
            if (email) formData.append('email', email)
            if (gender) formData.append('gender', gender)
            if (dateOfBirth) formData.append('date_of_birth', dateOfBirth)
            if (location) formData.append('location', location)
            if (heightCm) formData.append('height_cm', heightCm)
            if (languagesStr) formData.append('languages', languagesStr)
            if (skillsStr) formData.append('skills', skillsStr)
            formData.append('rate_type', rateType)
            if (rateAmount) formData.append('rate_amount', rateAmount)
            formData.append('currency', currency)
            if (notes) formData.append('notes', notes)
            if (file) formData.append('photo', file)

            const portfolioUrls: Record<string, string> = {}
            if (portfolioInstagram) portfolioUrls.instagram = portfolioInstagram
            if (portfolioWebsite) portfolioUrls.website = portfolioWebsite
            if (portfolioPdf) portfolioUrls.pdf = portfolioPdf
            if (Object.keys(portfolioUrls).length > 0) {
                formData.append('portfolio_urls', JSON.stringify(portfolioUrls))
            }

            let result
            if (initialData) {
                result = await updateTalent(initialData.id, formData)
            } else {
                result = await createTalent(formData)
            }

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(initialData ? 'Talent updated' : 'Talent added')
                router.push(initialData ? `/admin/talents/${initialData.id}` : '/admin/talents')
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Full Name *</label>
                    <Input placeholder="e.g. John Doe" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Stage / Professional Name</label>
                    <Input placeholder="e.g. Johnny D" value={stageName} onChange={e => setStageName(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Talent Type *</label>
                    {showNewType ? (
                        <div className="flex gap-2">
                            <Input value={newType} onChange={e => setNewType(e.target.value)} placeholder="New talent type" />
                            <Button type="button" size="sm" onClick={handleAddType}>Add</Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setShowNewType(false)}>Cancel</Button>
                        </div>
                    ) : (
                        <Select value={talentType} onValueChange={(v: string | null) => {
                            if (v === '__ADD_NEW__') setShowNewType(true)
                            else setTalentType(v || '')
                        }}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {talentTypes.map(type => (
                                    <SelectItem key={type} value={type} className="capitalize">{type.replace(/_/g, ' ')}</SelectItem>
                                ))}
                                <SelectItem value="__ADD_NEW__" className="text-primary font-medium">+ Add New</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Gender</label>
                    <Select value={gender} onValueChange={(v: string | null) => v && setGender(v)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            {GENDERS.map(g => (
                                <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Phone Number</label>
                    <Input type="tel" placeholder="+977-98XXXXXXXX" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Email</label>
                    <Input type="email" placeholder="talent@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Date of Birth</label>
                    <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Location</label>
                    <Input placeholder="e.g. Kathmandu" value={location} onChange={e => setLocation(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Height (cm)</label>
                    <Input type="number" step="0.1" placeholder="e.g. 170" value={heightCm} onChange={e => setHeightCm(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Languages (comma separated)</label>
                    <Input placeholder="e.g. Nepali, English, Hindi" value={languagesStr} onChange={e => setLanguagesStr(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Skills (comma separated)</label>
                    <Input placeholder="e.g. Dancing, Singing, Stunts" value={skillsStr} onChange={e => setSkillsStr(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Rate Type</label>
                    <Select value={rateType} onValueChange={(v: string | null) => v && setRateType(v)}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {RATE_TYPES.map(rt => (
                                <SelectItem key={rt} value={rt} className="capitalize">{rt.replace(/_/g, ' ')}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Rate Amount</label>
                    <Input type="number" step="0.01" placeholder="e.g. 5000" value={rateAmount} onChange={e => setRateAmount(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Currency</label>
                    <Select value={currency} onValueChange={(v: string | null) => v && setCurrency(v)}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CURRENCIES.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Photo</label>
                    <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>
            </div>

            {/* Portfolio URLs */}
            <div className="pt-4 border-t border-outline-variant">
                <h3 className="text-sm font-semibold text-on-surface mb-3">Portfolio Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-outline">Instagram URL</label>
                        <Input placeholder="https://instagram.com/..." value={portfolioInstagram} onChange={e => setPortfolioInstagram(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-outline">Website / Portfolio</label>
                        <Input placeholder="https://..." value={portfolioWebsite} onChange={e => setPortfolioWebsite(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-outline">Portfolio PDF</label>
                        <Input placeholder="https://..." value={portfolioPdf} onChange={e => setPortfolioPdf(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-on-surface">Notes</label>
                <Textarea placeholder="Additional notes, measurements, special requirements..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving...' : (initialData ? 'Update Talent' : 'Add Talent')}
                </Button>
            </div>
        </form>
    )
}
