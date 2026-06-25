'use client'

import { useState } from 'react'
import { createClientRecord } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { Globe, Camera, Music2, MessageCircle } from 'lucide-react'

interface ClientFormProps {
  companyNatures?: string[]
  referralSources?: string[]
}

export function ClientForm({ companyNatures = [], referralSources = [] }: ClientFormProps) {
  const [loading, setLoading] = useState(false)
  const [nature, setNature] = useState<string>('')
  const [referral, setReferral] = useState<string>('')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await createClientRecord(formData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Client created successfully')
      const form = document.getElementById('client-form') as HTMLFormElement
      form.reset()
      setNature('')
      setReferral('')
    }
    setLoading(false)
  }

  return (
    <form id="client-form" action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Company Name *</Label>
          <Input id="companyName" name="companyName" required className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="natureOfCompany" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Nature of Company</Label>
          <Select name="natureOfCompany" value={nature} onValueChange={(val) => setNature(val || '')}>
            <SelectTrigger className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white">
              <SelectValue placeholder="Select or add new" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
              {companyNatures.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
              <SelectItem value="ADD_NEW" className="text-sky-600 dark:text-sky-400 font-medium">+ Add New...</SelectItem>
            </SelectContent>
          </Select>
          {nature === 'ADD_NEW' && (
            <Input name="newNatureOfCompany" placeholder="Enter new nature of company" className="mt-2 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" autoFocus />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="owner" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Owner</Label>
          <Input id="owner" name="owner" className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactEmail" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Contact Email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Phone Number</Label>
          <Input id="phone" name="phone" type="tel" className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Location</Label>
          <Input id="location" name="location" className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="panNumber" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">PAN Number</Label>
          <Input id="panNumber" name="panNumber" placeholder="e.g. 123456789" className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vatId" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">VAT ID</Label>
          <Input id="vatId" name="vatId" placeholder="e.g. VAT-123456" className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="referralSource" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Referral Source</Label>
          <Select name="referralSource" value={referral} onValueChange={(val) => setReferral(val || '')}>
            <SelectTrigger className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white">
              <SelectValue placeholder="Select or add new" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
              {referralSources.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
              <SelectItem value="ADD_NEW" className="text-sky-600 dark:text-sky-400 font-medium">+ Add New...</SelectItem>
            </SelectContent>
          </Select>
          {referral === 'ADD_NEW' && (
            <Input name="newReferralSource" placeholder="Enter new referral source" className="mt-2 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" autoFocus />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Status</Label>
          <Select name="status" defaultValue="potential">
            <SelectTrigger className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
              <SelectItem value="active">Active Client</SelectItem>
              <SelectItem value="potential">Potential Client</SelectItem>
              <SelectItem value="past">Past Client</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logoUrl" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Logo URL (Optional)</Label>
          <Input id="logoUrl" name="logoUrl" placeholder="https://example.com/logo.png" className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white" />
        </div>
      </div>

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

      <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-zinc-900 dark:text-white font-semibold shadow-[0_0_20px_rgba(249,115,22,0.15)] transition-all border-none" disabled={loading}>
        {loading ? 'Saving...' : 'Add Client'}
      </Button>
    </form>
  )
}
