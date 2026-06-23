'use client'

import { useState } from 'react'
import { Pencil, Globe, Camera, Music2, MessageCircle } from 'lucide-react'
import { updateEmployee } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

type Employee = {
  id: string
  full_name: string
  email: string | null
  contact_email: string | null
  designation: string | null
  phone_number: string | null
  location: string | null
  joining_date: string | null
  dob: string | null
  cv_url: string | null
  social_urls: Record<string, string> | null
}

interface EditEmployeeDialogProps {
  employee: Employee
  designations?: string[]
}

export function EditEmployeeDialog({ employee, designations = [] }: EditEmployeeDialogProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState(employee.full_name || '')
  const [loginId, setLoginId] = useState(employee.email?.replace('@e5chronicles.com', '') || '')
  const [contactEmail, setContactEmail] = useState(employee.contact_email || '')
  const [password, setPassword] = useState('')
  const [designation, setDesignation] = useState(employee.designation || '')
  const [newDesignation, setNewDesignation] = useState('')
  const [isAddingNewDesignation, setIsAddingNewDesignation] = useState(false)
  const [phone, setPhone] = useState(employee.phone_number || '')
  const [location, setLocation] = useState(employee.location || '')
  const [joiningDate, setJoiningDate] = useState(employee.joining_date || '')
  const [dob, setDob] = useState(employee.dob || '')
  const [cvUrl, setCvUrl] = useState(employee.cv_url || '')
  
  const social = employee.social_urls || {}
  const [facebook, setFacebook] = useState(social.facebook || '')
  const [instagram, setInstagram] = useState(social.instagram || '')
  const [tiktok, setTiktok] = useState(social.tiktok || '')
  const [threads, setThreads] = useState(social.threads || '')

  // Reset form when dialog opens
  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setFullName(employee.full_name || '')
      setLoginId(employee.email?.replace('@e5chronicles.com', '') || '')
      setContactEmail(employee.contact_email || '')
      setPassword('')
      setDesignation(employee.designation || '')
      setNewDesignation('')
      setIsAddingNewDesignation(false)
      setPhone(employee.phone_number || '')
      setLocation(employee.location || '')
      setJoiningDate(employee.joining_date || '')
      setDob(employee.dob || '')
      setCvUrl(employee.cv_url || '')
      
      const s = employee.social_urls || {}
      setFacebook(s.facebook || '')
      setInstagram(s.instagram || '')
      setTiktok(s.tiktok || '')
      setThreads(s.threads || '')
    }
    setOpen(isOpen)
  }

  async function handleSave() {
    if (!fullName.trim()) {
      toast.error('Full Name is required')
      return
    }
    if (!loginId.trim()) {
      toast.error('Login ID is required')
      return
    }
    if (!contactEmail.trim()) {
      toast.error('Contact Email is required')
      return
    }
    const finalDesignation = isAddingNewDesignation ? newDesignation.trim() : designation
    if (!finalDesignation) {
      toast.error('Designation is required')
      return
    }

    setSaving(true)
    const result = await updateEmployee(employee.id, {
      full_name: fullName.trim(),
      login_id: loginId.trim(),
      contact_email: contactEmail || null,
      password: password || null,
      designation: finalDesignation,
      phone_number: phone || null,
      location: location || null,
      joining_date: joiningDate || null,
      dob: dob || null,
      cv_url: cvUrl || null,
      social_urls: {
        facebook,
        instagram,
        tiktok,
        threads
      }
    })

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(`${fullName} updated successfully`)
      setOpen(false)
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-md w-9 h-9 text-zinc-500 hover:text-sky-500 hover:bg-sky-500/10 transition-colors cursor-pointer">
        <Pencil className="w-4 h-4" />
      </DialogTrigger>
      <DialogContent className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee: {employee.full_name}</DialogTitle>
          <DialogDescription className="sr-only">
            Update details for {employee.full_name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Full Name */}
          <div className="space-y-2">
            <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Full Name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ram Bahadur"
              className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Login ID */}
          <div className="space-y-2">
            <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Login ID</Label>
            <Input
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              type="text"
              placeholder="e.g. ram123"
              className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Contact Email</Label>
            <Input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              type="email"
              placeholder="e.g. ram.contact@gmail.com"
              className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500"
            />
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">New Password <span className="text-zinc-500 font-normal normal-case">(leave blank to keep current)</span></Label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Minimum 6 characters"
              className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Designation */}
            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Designation</Label>
              <Select value={isAddingNewDesignation ? 'ADD_NEW' : designation} onValueChange={(val) => {
                if (val === 'ADD_NEW') {
                  setIsAddingNewDesignation(true)
                  setNewDesignation('')
                } else {
                  setIsAddingNewDesignation(false)
                  setDesignation(val || '')
                }
              }}>
                <SelectTrigger className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white">
                  <SelectValue placeholder="Select or add new" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
                  {designations.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                  {employee.designation && !designations.includes(employee.designation) && (
                      <SelectItem value={employee.designation}>{employee.designation}</SelectItem>
                  )}
                  <SelectItem value="ADD_NEW" className="text-sky-600 dark:text-sky-400 font-medium">+ Add New...</SelectItem>
                </SelectContent>
              </Select>
              {isAddingNewDesignation && (
                  <Input value={newDesignation} onChange={(e) => setNewDesignation(e.target.value)} placeholder="Enter new designation" className="mt-2 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" autoFocus />
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Phone Number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                placeholder="e.g. 9800000000"
                className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kathmandu, Nepal"
              className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Date of Birth</Label>
            <Input
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              type="date"
              className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          {/* Joining Date */}
          <div className="space-y-2">
            <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Joining Date</Label>
            <Input
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              type="date"
              className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          {/* CV URL */}
          <div className="space-y-2">
            <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">CV Link (URL)</Label>
            <Input
              value={cvUrl}
              onChange={(e) => setCvUrl(e.target.value)}
              type="url"
              placeholder="e.g. Google Drive/Dropbox link"
              className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Social Links */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-4">
            <h3 className="text-zinc-700 dark:text-zinc-300 text-sm font-semibold tracking-wider uppercase">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-4 w-4 text-zinc-500 dark:text-zinc-500" />
                </div>
                <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Facebook URL" className="pl-10 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Camera className="h-4 w-4 text-zinc-500 dark:text-zinc-500" />
                </div>
                <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram URL" className="pl-10 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Music2 className="h-4 w-4 text-zinc-500 dark:text-zinc-500" />
                </div>
                <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="TikTok URL" className="pl-10 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MessageCircle className="h-4 w-4 text-zinc-500 dark:text-zinc-500" />
                </div>
                <Input value={threads} onChange={(e) => setThreads(e.target.value)} placeholder="Threads URL" className="pl-10 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-white font-semibold border-none"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
