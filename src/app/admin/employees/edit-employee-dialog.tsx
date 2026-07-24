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
 const [vehicle, setVehicle] = useState(social.vehicle || 'no')
 const [vehicleDetails, setVehicleDetails] = useState(social.vehicle_details || '')

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
 setVehicle(s.vehicle || 'no')
 setVehicleDetails(s.vehicle_details || '')
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
 threads,
 vehicle,
 vehicle_details: vehicleDetails
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
 <DialogTrigger className="inline-flex items-center justify-center rounded-md w-9 h-9 btn-morph text-outline hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer">
 <Pencil className="w-4 h-4" />
 </DialogTrigger>
 <DialogContent className="bg-surface-container-low border-outline-variant text-on-surface sm:max-w-md max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>Edit Employee: {employee.full_name}</DialogTitle>
 <DialogDescription className="sr-only">
 Update details for {employee.full_name}.
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-4 py-2">
 {/* Full Name */}
 <div className="space-y-2">
 <Label className="text-on-surface text-xs uppercase tracking-wider font-medium">Full Name</Label>
 <Input
 value={fullName}
 onChange={(e) => setFullName(e.target.value)}
 placeholder="e.g. Ram Bahadur"
 className="bg-surface-container-high border-outline-variant text-on-surface placeholder:text-outline"
 />
 </div>

 {/* Login ID */}
 <div className="space-y-2">
 <Label className="text-on-surface text-xs uppercase tracking-wider font-medium">Login ID</Label>
 <Input
 value={loginId}
 onChange={(e) => setLoginId(e.target.value)}
 type="text"
 placeholder="e.g. ram123"
 className="bg-surface-container-high border-outline-variant text-on-surface placeholder:text-outline"
 />
 </div>

 {/* Contact Email */}
 <div className="space-y-2">
 <Label className="text-on-surface text-xs uppercase tracking-wider font-medium">Contact Email</Label>
 <Input
 value={contactEmail}
 onChange={(e) => setContactEmail(e.target.value)}
 type="email"
 placeholder="e.g. ram.contact@gmail.com"
 className="bg-surface-container-high border-outline-variant text-on-surface placeholder:text-outline"
 />
 </div>

 {/* New Password */}
 <div className="space-y-2">
 <Label className="text-on-surface text-xs uppercase tracking-wider font-medium">New Password <span className="text-outline font-normal normal-case">(leave blank to keep current)</span></Label>
 <Input
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 type="password"
 placeholder="Minimum 6 characters"
 className="bg-surface-container-high border-outline-variant text-on-surface placeholder:text-outline"
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {/* Designation */}
 <div className="space-y-2">
 <Label className="text-on-surface text-xs uppercase tracking-wider font-medium">Designation</Label>
 <Select value={isAddingNewDesignation ? 'ADD_NEW' : designation} onValueChange={(val) => {
 if (val === 'ADD_NEW') {
 setIsAddingNewDesignation(true)
 setNewDesignation('')
 } else {
 setIsAddingNewDesignation(false)
 setDesignation(val || '')
 }
 }}>
 <SelectTrigger className="bg-surface-container-high border-outline-variant text-on-surface">
 <SelectValue placeholder="Select or add new" />
 </SelectTrigger>
 <SelectContent className="bg-surface-container-lowest border-outline-variant text-on-surface">
 {designations.map(role => (
 <SelectItem key={role} value={role}>{role}</SelectItem>
 ))}
 {employee.designation && !designations.includes(employee.designation) && (
 <SelectItem value={employee.designation}>{employee.designation}</SelectItem>
 )}
 <SelectItem value="ADD_NEW" className="text-primary font-medium">+ Add New...</SelectItem>
 </SelectContent>
 </Select>
 {isAddingNewDesignation && (
 <Input value={newDesignation} onChange={(e) => setNewDesignation(e.target.value)} placeholder="Enter new designation" className="mt-2 bg-surface-container-high border-outline-variant text-on-surface" autoFocus />
 )}
 </div>

 {/* Phone */}
 <div className="space-y-2">
 <Label className="text-on-surface text-xs uppercase tracking-wider font-medium">Phone Number</Label>
 <Input
 value={phone}
 onChange={(e) => setPhone(e.target.value)}
 type="tel"
 placeholder="e.g. 9800000000"
 className="bg-surface-container-high border-outline-variant text-on-surface placeholder:text-outline"
 />
 </div>
 </div>

 {/* Location */}
 <div className="space-y-2">
 <Label className="text-on-surface text-xs uppercase tracking-wider font-medium">Location</Label>
 <Input
 value={location}
 onChange={(e) => setLocation(e.target.value)}
 placeholder="e.g. Kathmandu, Nepal"
 className="bg-surface-container-high border-outline-variant text-on-surface placeholder:text-outline"
 />
 </div>

 {/* Vehicle Section */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
   <div className="space-y-2">
     <Label className="text-on-surface text-xs uppercase tracking-wider font-medium">Owns Vehicle?</Label>
     <Select value={vehicle} onValueChange={(val) => setVehicle(val || 'no')}>
       <SelectTrigger className="bg-surface-container-high border-outline-variant text-on-surface">
         <SelectValue placeholder="Select Yes or No" />
       </SelectTrigger>
       <SelectContent className="bg-surface-container-lowest border-outline-variant text-on-surface">
         <SelectItem value="yes">Yes (Bike / Scooter / Car)</SelectItem>
         <SelectItem value="no">No Vehicle</SelectItem>
       </SelectContent>
     </Select>
   </div>

   {vehicle === 'yes' && (
     <div className="space-y-2">
       <Label className="text-on-surface text-xs uppercase tracking-wider font-medium">Vehicle Name & License Plate</Label>
       <Input
         value={vehicleDetails}
         onChange={(e) => setVehicleDetails(e.target.value)}
         placeholder="e.g. Royal Enfield Bullet - BA 99 PA 1234"
         className="bg-surface-container-high border-outline-variant text-on-surface placeholder:text-outline"
       />
     </div>
   )}
 </div>

 {/* Date of Birth */}
 <div className="space-y-2">
 <Label className="text-on-surface text-xs uppercase tracking-wider font-medium">Date of Birth</Label>
 <Input
 value={dob}
 onChange={(e) => setDob(e.target.value)}
 type="date"
 className="bg-surface-container-high border-outline-variant text-on-surface" 
 />
 </div>

 {/* Joining Date */}
 <div className="space-y-2">
 <Label className="text-on-surface text-xs uppercase tracking-wider font-medium">Joining Date</Label>
 <Input
 value={joiningDate}
 onChange={(e) => setJoiningDate(e.target.value)}
 type="date"
 className="bg-surface-container-high border-outline-variant text-on-surface" 
 />
 </div>

 {/* CV URL */}
 <div className="space-y-2">
 <Label className="text-on-surface text-xs uppercase tracking-wider font-medium">CV Link (URL)</Label>
 <Input
 value={cvUrl}
 onChange={(e) => setCvUrl(e.target.value)}
 type="url"
 placeholder="e.g. Google Drive/Dropbox link"
 className="bg-surface-container-high border-outline-variant text-on-surface placeholder:text-outline"
 />
 </div>

 {/* Social Links */}
 <div className="border-t border-outline-variant pt-4 space-y-4">
 <h3 className="text-on-surface text-sm font-semibold tracking-wider uppercase">Social Links</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Globe className="h-4 w-4 text-outline" />
 </div>
 <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Facebook URL" className="pl-10 bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Camera className="h-4 w-4 text-outline" />
 </div>
 <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram URL" className="pl-10 bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Music2 className="h-4 w-4 text-outline" />
 </div>
 <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="TikTok URL" className="pl-10 bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <MessageCircle className="h-4 w-4 text-outline" />
 </div>
 <Input value={threads} onChange={(e) => setThreads(e.target.value)} placeholder="Threads URL" className="pl-10 bg-surface-container-high border-outline-variant text-on-surface" />
 </div>
 </div>
 </div>
 </div>

 <DialogFooter>
 <Button
 variant="outline"
 onClick={() => setOpen(false)}
 className="bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container-high"
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
