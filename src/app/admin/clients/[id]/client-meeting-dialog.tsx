'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClientMeeting } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CalendarPlus } from 'lucide-react'

export function ClientMeetingDialog({ clientId }: { clientId: string }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [title, setTitle] = useState('')
    const [meetingDate, setMeetingDate] = useState('')
    const [duration, setDuration] = useState('')
    const [location, setLocation] = useState('')
    const [notes, setNotes] = useState('')

    async function handleSave() {
        if (!title || !meetingDate) {
            toast.error('Title and meeting date are required')
            return
        }
        setSaving(true)
        const formData = new FormData()
        formData.set('client_id', clientId)
        formData.set('title', title)
        formData.set('meeting_date', meetingDate)
        if (duration) formData.set('duration_minutes', duration)
        if (location) formData.set('location', location)
        if (notes) formData.set('notes', notes)

        const result = await createClientMeeting(formData)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Meeting scheduled')
            setOpen(false)
            setTitle('')
            setMeetingDate('')
            setDuration('')
            setLocation('')
            setNotes('')
            router.refresh()
        }
        setSaving(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
                <Button size="sm" className="bg-gradient-to-r from-sky-500 to-sky-400 text-white">
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    Schedule Meeting
                </Button>
            } />
            <DialogContent className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                <DialogHeader>
                    <DialogTitle>Schedule Client Meeting</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Meeting Title *</Label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Project Review" />
                    </div>
                    <div className="space-y-2">
                        <Label>Date & Time *</Label>
                        <Input type="datetime-local" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} className="[color-scheme:light] dark:[color-scheme:dark]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Duration (min)</Label>
                            <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="60" />
                        </div>
                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Office" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Agenda items..." />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Schedule'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
