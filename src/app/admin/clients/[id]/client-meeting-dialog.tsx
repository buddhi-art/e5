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

export function ClientMeetingDialog({ 
  clientId,
  clients
}: { 
  clientId?: string
  clients?: { id: string; company_name: string }[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState(clientId || '')
  const [title, setTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [duration, setDuration] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  const targetClientId = clientId || selectedClientId

  async function handleSave() {
    if (!targetClientId) {
      toast.error('Please select a client')
      return
    }
    if (!title || !meetingDate) {
      toast.error('Title and meeting date are required')
      return
    }
    setSaving(true)
    const formData = new FormData()
    formData.set('client_id', targetClientId)
    formData.set('title', title)
    formData.set('meeting_date', meetingDate)
    if (duration) formData.set('duration_minutes', duration)
    if (location) formData.set('location', location)
    if (notes) formData.set('notes', notes)

    const result = await createClientMeeting(formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Meeting scheduled successfully!')
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
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-semibold">
          <CalendarPlus className="w-4 h-4 mr-2" />
          Schedule Meeting
        </Button>
      } />
      <DialogContent className="bg-surface-container-lowest border-outline-variant">
        <DialogHeader>
          <DialogTitle>Schedule Client Meeting</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!clientId && clients && (
            <div className="space-y-2">
              <Label>Select Client *</Label>
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
              >
                <option value="">-- Choose Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Meeting Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Project Briefing / Concept Review" />
          </div>
          <div className="space-y-2">
            <Label>Date & Time *</Label>
            <Input type="datetime-local" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="60" />
            </div>
            <div className="space-y-2">
              <Label>Location / Link</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Office / Google Meet" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes / Agenda</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Agenda items, topics to cover..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Schedule Meeting'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
