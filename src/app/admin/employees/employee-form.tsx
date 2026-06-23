'use client'

import { useState } from 'react'
import { createEmployee } from './actions'
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
import { toast } from 'sonner'
import { Globe, Camera, Music2, MessageCircle } from 'lucide-react'

interface EmployeeFormProps {
  designations?: string[]
}

export function EmployeeForm({ designations = [] }: EmployeeFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedDesignation, setSelectedDesignation] = useState('')

  async function handleSubmit(formData: FormData) {
    if (!selectedDesignation) {
      toast.error('Please select a designation')
      return
    }
    formData.set('designation', selectedDesignation)
    setLoading(true)
    const result = await createEmployee(formData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Employee created successfully')
      const form = document.getElementById('employee-form') as HTMLFormElement
      form.reset()
      setSelectedDesignation('')
    }
    setLoading(false)
  }

  return (
    <form id="employee-form" action={handleSubmit} className="space-y-5">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Full Name</Label>
        <Input
          id="fullName"
          name="fullName"
          required
          placeholder="e.g. Ram Bahadur"
          className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-zinc-500"
        />
      </div>

      {/* Login ID (email used for authentication) */}
      <div className="space-y-2">
        <Label htmlFor="loginId" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Login ID</Label>
        <Input
          id="loginId"
          name="loginId"
          type="text"
          required
          placeholder="e.g. ram123"
          className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-zinc-500"
        />
      </div>

      {/* Temporary Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Temporary Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          placeholder="Minimum 6 characters"
          className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-zinc-500"
        />
      </div>

      {/* Contact Email */}
      <div className="space-y-2">
        <Label htmlFor="contactEmail" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Contact Email</Label>
        <Input
          id="contactEmail"
          name="contactEmail"
          type="email"
          required
          placeholder="e.g. ram.contact@gmail.com"
          className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-zinc-500"
        />
      </div>



      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Location</Label>
        <Input
          id="location"
          name="location"
          placeholder="e.g. Kathmandu, Nepal"
          className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-zinc-500"
        />
      </div>

      {/* Joining Date */}
      <div className="space-y-2">
        <Label htmlFor="joiningDate" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Joining Date</Label>
        <Input
          id="joiningDate"
          name="joiningDate"
          type="date"
          className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white [color-scheme:dark]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Designation Dropdown */}
        <div className="space-y-2">
          <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Designation</Label>
          <Select name="designation" value={selectedDesignation} onValueChange={(val) => setSelectedDesignation(val || '')}>
            <SelectTrigger className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white">
              <SelectValue placeholder="Select or add new" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
              {designations.map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
              <SelectItem value="ADD_NEW" className="text-sky-600 dark:text-sky-400 font-medium">+ Add New...</SelectItem>
            </SelectContent>
          </Select>
          {selectedDesignation === 'ADD_NEW' && (
            <Input name="newDesignation" placeholder="Enter new designation" className="mt-2 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" autoFocus />
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="e.g. 9800000000"
            className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-zinc-500"
          />
        </div>
      </div>

      {/* Date of Birth */}
      <div className="space-y-2">
        <Label htmlFor="dob" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Date of Birth</Label>
        <Input
          id="dob"
          name="dob"
          type="date"
          className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
        />
      </div>

      {/* CV URL */}
      <div className="space-y-2">
        <Label htmlFor="cvUrl" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">CV Link (URL)</Label>
        <Input
          id="cvUrl"
          name="cvUrl"
          type="url"
          placeholder="e.g. Google Drive/Dropbox link"
          className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-zinc-500"
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
            <Input name="facebook" placeholder="Facebook URL" className="pl-10 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Camera className="h-4 w-4 text-zinc-500 dark:text-zinc-500" />
            </div>
            <Input name="instagram" placeholder="Instagram URL" className="pl-10 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Music2 className="h-4 w-4 text-zinc-500 dark:text-zinc-500" />
            </div>
            <Input name="tiktok" placeholder="TikTok URL" className="pl-10 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MessageCircle className="h-4 w-4 text-zinc-500 dark:text-zinc-500" />
            </div>
            <Input name="threads" placeholder="Threads URL" className="pl-10 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-zinc-900 dark:text-white font-semibold shadow-[0_0_20px_rgba(249,115,22,0.15)] hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all border-none" disabled={loading}>
        {loading ? 'Creating...' : 'Create Employee'}
      </Button>
    </form>
  )
}
