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
 const [clientType, setClientType] = useState<'personal' | 'company'>('company')

 const isCompany = clientType === 'company'

 async function handleSubmit(formData: FormData) {
 // The Select for clientType is controlled; make sure its value is submitted.
 formData.set('clientType', clientType)
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
 setClientType('company')
 }
 setLoading(false)
 }

 return (
 <form id="client-form" action={handleSubmit} className="space-y-6">
 <div className="space-y-2">
 <Label htmlFor="clientType" className="text-on-surface text-xs uppercase tracking-wider font-medium">Client Type *</Label>
 <Select value={clientType} onValueChange={(val) => setClientType((val as 'personal' | 'company') || 'company')}>
 <SelectTrigger className="bg-surface-container-high border-outline-variant text-on-surface">
 <SelectValue placeholder="Select client type" />
 </SelectTrigger>
 <SelectContent className="bg-surface-container-lowest border-outline-variant text-on-surface">
 <SelectItem value="personal">Personal</SelectItem>
 <SelectItem value="company">Company</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="companyName" className="text-on-surface text-xs uppercase tracking-wider font-medium">{isCompany ? 'Company Name *' : 'Name *'}</Label>
 <Input id="companyName" name="companyName" required className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>

 {isCompany && (
 <div className="space-y-2">
 <Label htmlFor="natureOfCompany" className="text-on-surface text-xs uppercase tracking-wider font-medium">Nature of Company</Label>
 <Select name="natureOfCompany" value={nature} onValueChange={(val) => setNature(val || '')}>
 <SelectTrigger className="bg-surface-container-high border-outline-variant text-on-surface">
 <SelectValue placeholder="Select or add new" />
 </SelectTrigger>
 <SelectContent className="bg-surface-container-lowest border-outline-variant text-on-surface">
 {companyNatures.map((n) => (
 <SelectItem key={n} value={n}>{n}</SelectItem>
 ))}
 <SelectItem value="ADD_NEW" className="text-primary font-medium">+ Add New...</SelectItem>
 </SelectContent>
 </Select>
 {nature === 'ADD_NEW' && (
 <Input name="newNatureOfCompany" placeholder="Enter new nature of company" className="mt-2 bg-surface-container-high border-outline-variant text-on-surface" autoFocus />
 )}
 </div>
 )}

 {isCompany && (
 <div className="space-y-2">
 <Label htmlFor="owner" className="text-on-surface text-xs uppercase tracking-wider font-medium">Owner Details</Label>
 <Input id="owner" name="owner" placeholder="Owner name" className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 )}

 <div className="space-y-2">
 <Label htmlFor="contactEmail" className="text-on-surface text-xs uppercase tracking-wider font-medium">Contact Email</Label>
 <Input id="contactEmail" name="contactEmail" type="email" className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>

 <div className="space-y-2">
 <Label htmlFor="phone" className="text-on-surface text-xs uppercase tracking-wider font-medium">Phone Number</Label>
 <Input id="phone" name="phone" type="tel" className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>

 {isCompany && (
 <div className="space-y-2">
 <Label htmlFor="frequentContactPerson" className="text-on-surface text-xs uppercase tracking-wider font-medium">Frequent Contact Person *</Label>
 <Input id="frequentContactPerson" name="frequentContactPerson" required={isCompany} className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 )}

 {isCompany && (
 <div className="space-y-2">
 <Label htmlFor="frequentContactNumber" className="text-on-surface text-xs uppercase tracking-wider font-medium">Frequent Contact Number *</Label>
 <Input id="frequentContactNumber" name="frequentContactNumber" type="tel" required={isCompany} className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 )}

 <div className="space-y-2">
 <Label htmlFor="location" className="text-on-surface text-xs uppercase tracking-wider font-medium">Location</Label>
 <Input id="location" name="location" className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>

 <div className="space-y-2">
 <Label htmlFor="panNumber" className="text-on-surface text-xs uppercase tracking-wider font-medium">PAN Number</Label>
 <Input id="panNumber" name="panNumber" placeholder="e.g. 123456789" className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>

 <div className="space-y-2">
 <Label htmlFor="vatId" className="text-on-surface text-xs uppercase tracking-wider font-medium">VAT ID</Label>
 <Input id="vatId" name="vatId" placeholder="e.g. VAT-123456" className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>

 <div className="space-y-2">
 <Label htmlFor="referralSource" className="text-on-surface text-xs uppercase tracking-wider font-medium">Referral Source</Label>
 <Select name="referralSource" value={referral} onValueChange={(val) => setReferral(val || '')}>
 <SelectTrigger className="bg-surface-container-high border-outline-variant text-on-surface">
 <SelectValue placeholder="Select or add new" />
 </SelectTrigger>
 <SelectContent className="bg-surface-container-lowest border-outline-variant text-on-surface">
 {referralSources.map((r) => (
 <SelectItem key={r} value={r}>{r}</SelectItem>
 ))}
 <SelectItem value="ADD_NEW" className="text-primary font-medium">+ Add New...</SelectItem>
 </SelectContent>
 </Select>
 {referral === 'ADD_NEW' && (
 <Input name="newReferralSource" placeholder="Enter new referral source" className="mt-2 bg-surface-container-high border-outline-variant text-on-surface" autoFocus />
 )}
 </div>

 <div className="space-y-2">
 <Label htmlFor="status" className="text-on-surface text-xs uppercase tracking-wider font-medium">Status</Label>
 <Select name="status" defaultValue="potential">
 <SelectTrigger className="bg-surface-container-high border-outline-variant text-on-surface">
 <SelectValue placeholder="Select status" />
 </SelectTrigger>
 <SelectContent className="bg-surface-container-lowest border-outline-variant text-on-surface">
 <SelectItem value="active">Active Client</SelectItem>
 <SelectItem value="potential">Potential Client</SelectItem>
 <SelectItem value="past">Past Client</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label htmlFor="logoUrl" className="text-on-surface text-xs uppercase tracking-wider font-medium">Logo URL (Optional)</Label>
 <Input id="logoUrl" name="logoUrl" placeholder="https://example.com/logo.png" className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 </div>

 <div className="border-t border-outline-variant pt-4 space-y-4">
 <h3 className="text-on-surface text-sm font-semibold tracking-wider uppercase">Social Links</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Globe className="h-4 w-4 text-outline" />
 </div>
 <Input name="facebook" placeholder="Facebook URL" className="pl-10 bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Camera className="h-4 w-4 text-outline" />
 </div>
 <Input name="instagram" placeholder="Instagram URL" className="pl-10 bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Music2 className="h-4 w-4 text-outline" />
 </div>
 <Input name="tiktok" placeholder="TikTok URL" className="pl-10 bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <MessageCircle className="h-4 w-4 text-outline" />
 </div>
 <Input name="threads" placeholder="Threads URL" className="pl-10 bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 </div>
 </div>

 <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-on-surface font-semibold shadow-[0_0_20px_rgba(249,115,22,0.15)] transition-all border-none" disabled={loading}>
 {loading ? 'Saving...' : 'Add Client'}
 </Button>
 </form>
 )
}
