'use client'

import { useState } from 'react'
import { updateClientRecord } from './actions'
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
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Pencil, Globe, Camera, Music2, MessageCircle } from 'lucide-react'

type Client = {
 id: string
 client_type: string | null
 company_name: string
 nature_of_company: string | null
 contact_person: string | null
 contact_email: string | null
 phone_number: string | null
 frequent_contact_person: string | null
 frequent_contact_number: string | null
 logo_url: string | null
 location: string | null
 status: string | null
 referral_source: string | null
 social_urls: Record<string, string> | null
 pan_number: string | null
 vat_id: string | null
}

interface EditClientDialogProps {
 client: Client
 companyNatures?: string[]
 referralSources?: string[]
}

export function EditClientDialog({ client, companyNatures = [], referralSources = [] }: EditClientDialogProps) {
 const [open, setOpen] = useState(false)
 const [loading, setLoading] = useState(false)
 const [nature, setNature] = useState<string>(client.nature_of_company || '')
 const [referral, setReferral] = useState<string>(client.referral_source || '')
 const [clientType, setClientType] = useState<'personal' | 'company'>(client.client_type === 'personal' ? 'personal' : 'company')

 const isCompany = clientType === 'company'

 async function handleSubmit(formData: FormData) {
 formData.set('clientType', clientType)
 setLoading(true)
 const result = await updateClientRecord(client.id, formData)
 if (result?.error) {
 toast.error(result.error)
 } else {
 toast.success('Client updated successfully')
 setOpen(false)
 }
 setLoading(false)
 }

 const social = client.social_urls || {}

 return (
 <Dialog open={open} onOpenChange={setOpen}>
 <DialogTrigger className="inline-flex items-center justify-center rounded-md w-9 h-9 btn-morph text-outline hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer">
 <Pencil className="w-4 h-4" />
 </DialogTrigger>
 <DialogContent className="sm:max-w-[600px] bg-surface-container-low border-outline-variant text-on-surface max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>Edit Client</DialogTitle>
 </DialogHeader>
 <form action={handleSubmit} className="space-y-6 mt-4">
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
 <Input id="companyName" name="companyName" defaultValue={client.company_name} required className="bg-surface-container-high border-outline-variant text-on-surface" />
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
 {client.nature_of_company && !companyNatures.includes(client.nature_of_company) && (
 <SelectItem value={client.nature_of_company}>{client.nature_of_company}</SelectItem>
 )}
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
 <Input id="owner" name="owner" defaultValue={client.contact_person || ''} placeholder="Owner name" className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 )}
 <div className="space-y-2">
 <Label htmlFor="contactEmail" className="text-on-surface text-xs uppercase tracking-wider font-medium">Contact Email</Label>
 <Input id="contactEmail" name="contactEmail" type="email" defaultValue={client.contact_email || ''} className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="phone" className="text-on-surface text-xs uppercase tracking-wider font-medium">Phone Number</Label>
 <Input id="phone" name="phone" type="tel" defaultValue={client.phone_number || ''} className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 {isCompany && (
 <div className="space-y-2">
 <Label htmlFor="frequentContactPerson" className="text-on-surface text-xs uppercase tracking-wider font-medium">Frequent Contact Person *</Label>
 <Input id="frequentContactPerson" name="frequentContactPerson" defaultValue={client.frequent_contact_person || ''} required={isCompany} className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 )}
 {isCompany && (
 <div className="space-y-2">
 <Label htmlFor="frequentContactNumber" className="text-on-surface text-xs uppercase tracking-wider font-medium">Frequent Contact Number *</Label>
 <Input id="frequentContactNumber" name="frequentContactNumber" type="tel" defaultValue={client.frequent_contact_number || ''} required={isCompany} className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 )}
 <div className="space-y-2">
 <Label htmlFor="location" className="text-on-surface text-xs uppercase tracking-wider font-medium">Location</Label>
 <Input id="location" name="location" defaultValue={client.location || ''} className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="panNumber" className="text-on-surface text-xs uppercase tracking-wider font-medium">PAN Number</Label>
 <Input id="panNumber" name="panNumber" defaultValue={client.pan_number || ''} placeholder="e.g. 123456789" className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="vatId" className="text-on-surface text-xs uppercase tracking-wider font-medium">VAT ID</Label>
 <Input id="vatId" name="vatId" defaultValue={client.vat_id || ''} placeholder="e.g. VAT-123456" className="bg-surface-container-high border-outline-variant text-on-surface" />
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
 {client.referral_source && !referralSources.includes(client.referral_source) && (
 <SelectItem value={client.referral_source}>{client.referral_source}</SelectItem>
 )}
 <SelectItem value="ADD_NEW" className="text-primary font-medium">+ Add New...</SelectItem>
 </SelectContent>
 </Select>
 {referral === 'ADD_NEW' && (
 <Input name="newReferralSource" placeholder="Enter new referral source" className="mt-2 bg-surface-container-high border-outline-variant text-on-surface" autoFocus />
 )}
 </div>
 <div className="space-y-2">
 <Label htmlFor="status" className="text-on-surface text-xs uppercase tracking-wider font-medium">Status</Label>
 <Select name="status" defaultValue={client.status || 'potential'}>
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
 <Label htmlFor="logoUrl" className="text-on-surface text-xs uppercase tracking-wider font-medium">Logo URL</Label>
 <Input id="logoUrl" name="logoUrl" defaultValue={client.logo_url || ''} className="bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 </div>

 <div className="border-t border-outline-variant pt-4 space-y-4">
 <h3 className="text-on-surface text-sm font-semibold tracking-wider uppercase">Social Links</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Globe className="h-4 w-4 text-outline" />
 </div>
 <Input name="facebook" defaultValue={social.facebook || ''} placeholder="Facebook URL" className="pl-10 bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Camera className="h-4 w-4 text-outline" />
 </div>
 <Input name="instagram" defaultValue={social.instagram || ''} placeholder="Instagram URL" className="pl-10 bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Music2 className="h-4 w-4 text-outline" />
 </div>
 <Input name="tiktok" defaultValue={social.tiktok || ''} placeholder="TikTok URL" className="pl-10 bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <MessageCircle className="h-4 w-4 text-outline" />
 </div>
 <Input name="threads" defaultValue={social.threads || ''} placeholder="Threads URL" className="pl-10 bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 </div>
 </div>

 <Button type="submit" className="w-full bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-primary-foreground font-semibold border-none" disabled={loading}>
 {loading ? 'Saving...' : 'Save Changes'}
 </Button>
 </form>
 </DialogContent>
 </Dialog>
 )
}
