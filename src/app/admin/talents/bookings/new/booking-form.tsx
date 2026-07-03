'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createBooking } from '../../actions'

const RATE_TYPES = ['per_project', 'per_day', 'per_hour'] as const

export function BookingForm({
    talents,
    projects,
    preselectedTalentId,
}: {
    talents: { id: string; full_name: string; talent_type: string }[]
    projects: { id: string; title: string }[]
    preselectedTalentId?: string
}) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const [talentId, setTalentId] = useState(preselectedTalentId || '')
    const [projectId, setProjectId] = useState('')
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState('')
    const [rateType, setRateType] = useState('per_project')
    const [rateAmount, setRateAmount] = useState('')
    const [totalCompensation, setTotalCompensation] = useState(0)
    const [description, setDescription] = useState('')
    const [location, setLocation] = useState('')
    const [notes, setNotes] = useState('')

    function calculateCompensation(type: string, amount: number, start: string, end: string) {
        if (type === 'per_day' && start && end) {
            const s = new Date(start)
            const e = new Date(end)
            const days = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1)
            return amount * days
        }
        return amount
    }

    function handleRateChange(type: string, amount: string, start: string, end: string) {
        setRateType(type)
        setRateAmount(amount)
        const numAmount = Number(amount) || 0
        setTotalCompensation(calculateCompensation(type, numAmount, start, end))
    }

    function handleDateChange(field: 'start' | 'end', value: string) {
        if (field === 'start') {
            setBookingDate(value)
            setTotalCompensation(calculateCompensation(rateType, Number(rateAmount) || 0, value, endDate || value))
        } else {
            setEndDate(value)
            setTotalCompensation(calculateCompensation(rateType, Number(rateAmount) || 0, bookingDate, value || bookingDate))
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!talentId || !bookingDate || !rateType || !rateAmount) {
            toast.error('Talent, booking date, rate type, and rate amount are required')
            return
        }

        startTransition(async () => {
            const formData = new FormData()
            formData.append('talent_id', talentId)
            formData.append('booking_date', bookingDate)
            formData.append('rate_type', rateType)
            formData.append('rate_amount', rateAmount)
            if (projectId) formData.append('project_id', projectId)
            if (endDate) formData.append('end_date', endDate)
            if (description) formData.append('description', description)
            if (location) formData.append('location', location)
            if (notes) formData.append('notes', notes)

            const result = await createBooking(formData)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Booking created')
                router.push('/admin/talents/bookings')
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Talent *</label>
                    <Select value={talentId} onValueChange={(v: string | null) => v && setTalentId(v)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select talent">
                                {talentId ? talents.find(t => t.id === talentId)?.full_name : null}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {talents.map(t => (
                                <SelectItem key={t.id} value={t.id}>
                                    {t.full_name} ({t.talent_type.replace(/_/g, ' ')})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Project</label>
                    <Select value={projectId} onValueChange={(v: string | null) => v && setProjectId(v)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select project">
                                {projectId ? projects.find(p => p.id === projectId)?.title : null}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Booking Date *</label>
                    <Input type="date" value={bookingDate} onChange={e => handleDateChange('start', e.target.value)} required />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">End Date</label>
                    <Input type="date" value={endDate} onChange={e => handleDateChange('end', e.target.value)} />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Rate Type *</label>
                    <Select value={rateType} onValueChange={(v: string | null) => v && handleRateChange(v, rateAmount, bookingDate, endDate)}>
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
                    <label className="block text-sm font-medium text-on-surface">Rate Amount (NPR) *</label>
                    <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 5000"
                        value={rateAmount}
                        onChange={e => handleRateChange(rateType, e.target.value, bookingDate, endDate)}
                        required
                    />
                </div>
            </div>

            {totalCompensation > 0 && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary">
                    <p className="text-sm text-on-surface-variant">Total Compensation</p>
                    <p className="text-xl font-bold text-on-surface">NPR {totalCompensation.toLocaleString('ne-NP')}</p>
                </div>
            )}

            <div className="space-y-2">
                <label className="block text-sm font-medium text-on-surface">Role / Description</label>
                <Input placeholder="e.g. Lead actor for commercial shoot" value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-on-surface">Location</label>
                <Input placeholder="e.g. On location, Kathmandu" value={location} onChange={e => setLocation(e.target.value)} />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-on-surface">Notes</label>
                <Textarea placeholder="Additional booking notes..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Creating...' : 'Create Booking'}
                </Button>
            </div>
        </form>
    )
}
