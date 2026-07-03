'use client'

import { useState } from 'react'
import { checkIn, checkOut } from './actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { LogIn, LogOut, Clock } from 'lucide-react'

interface AttendanceFormProps {
 hasCheckedIn: boolean
 hasCheckedOut: boolean
 checkInTime: string | null
}

export function AttendanceForm({ hasCheckedIn, hasCheckedOut, checkInTime }: AttendanceFormProps) {
 const [checkingIn, setCheckingIn] = useState(false)
 const [checkingOut, setCheckingOut] = useState(false)
 const [daySummary, setDaySummary] = useState('')
 const [localCheckedIn, setLocalCheckedIn] = useState(hasCheckedIn)

 async function handleCheckIn() {
 setCheckingIn(true)
 setLocalCheckedIn(true)
 const result = await checkIn()
 if (result?.error) {
 toast.error(result.error)
 setLocalCheckedIn(false)
 } else {
 toast.success('Checked in successfully!')
 }
 setCheckingIn(false)
 }

 async function handleCheckOut() {
 const wordCount = daySummary.trim().split(/\s+/).filter(Boolean).length
 if (wordCount < 20) {
 toast.error(`Please write at least 20 words about your day (currently ${wordCount} words).`)
 return
 }
 setCheckingOut(true)
 const result = await checkOut(daySummary)
 if (result?.error) {
 toast.error(result.error)
 } else {
 toast.success('Checked out successfully! Have a great evening.')
 }
 setCheckingOut(false)
 }

 const formatTime = (isoString: string) => {
 return new Date(isoString).toLocaleTimeString('en-US', {
 hour: '2-digit',
 minute: '2-digit',
 hour12: true,
 })
 }

 const wordCount = daySummary.trim().split(/\s+/).filter(Boolean).length

 return (
 <div className="space-y-6">
 <Card className="relative overflow-hidden border-2 border-outline-variant bg-gradient-to-br from-surface-container-lowest to-surface-container-low">
 <div className="relative p-6 text-center">
 <div className="mb-4">
 <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-high dark:bg-surface-container mb-3">
 <Clock className="w-8 h-8 text-on-surface-variant" />
 </div>
 <h3 className="text-xl font-bold text-on-surface mb-1">
 {!localCheckedIn
 ? 'Ready to start your day?'
 : !hasCheckedOut
 ? 'Heading out?'
 : 'All done for today!'}
 </h3>
 <p className="text-sm text-on-surface-variant">
 {!localCheckedIn
 ? 'Click below to check in and mark your attendance.'
 : !hasCheckedOut
 ? 'Write a summary of your day and check out.'
 : 'You have successfully completed your day.'}
 </p>
 </div>

 {!localCheckedIn && (
 <Button
 onClick={handleCheckIn}
 disabled={checkingIn}
 size="lg"
 className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white font-semibold text-lg h-14 shadow-lg shadow-emerald-500/20 border-none"
 >
 <LogIn className="w-5 h-5 mr-3" />
 {checkingIn ? 'Checking in...' : 'Check In'}
 </Button>
 )}

 {localCheckedIn && !hasCheckedOut && (
 <div className="space-y-4">
 {checkInTime && (
 <div className="p-3 bg-m3-success-subtle rounded-lg border border-m3-success/50">
 <div className="text-xs text-m3-success uppercase tracking-wider font-medium">Checked in at</div>
 <div className="text-lg font-bold text-m3-success mt-1">{formatTime(checkInTime)}</div>
 </div>
 )}

 <div className="text-left space-y-2">
 <Label htmlFor="daySummary" className="text-on-surface text-xs uppercase tracking-wider font-medium">
 Day Summary <span className="text-m3-error">*</span>
 </Label>
 <Textarea
 id="daySummary"
 placeholder="Describe what you worked on today (minimum 20 words)..."
 value={daySummary}
 onChange={e => setDaySummary(e.target.value)}
 className="bg-surface-container-high dark:bg-surface-container/50 border-outline-variant text-on-surface h-32 resize-none"
 />
 <div className="flex justify-between text-xs">
 <span className={wordCount < 20 ? 'text-m3-error' : 'text-m3-success'}>
 {wordCount < 20
 ? `${wordCount}/20 words — minimum 20 required`
 : `${wordCount} words ✓`}
 </span>
 </div>
 </div>

 <Button
 onClick={handleCheckOut}
 disabled={checkingOut || wordCount < 20}
 size="lg"
 className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white font-semibold text-lg h-14 shadow-lg shadow-orange-500/20 border-none disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <LogOut className="w-5 h-5 mr-3" />
 {checkingOut ? 'Checking out...' : 'Check Out'}
 </Button>
 </div>
 )}

 {localCheckedIn && hasCheckedOut && (
 <div className="space-y-3">
 <div className="grid grid-cols-2 gap-3">
 <div className="p-3 bg-m3-success-subtle rounded-lg border border-m3-success/50">
 <div className="text-xs text-m3-success uppercase tracking-wider font-medium">Check In</div>
 <div className="text-base font-bold text-m3-success mt-1">
 {checkInTime ? formatTime(checkInTime) : '—'}
 </div>
 </div>
 <div className="p-3 bg-primary-container rounded-lg border border-primary/50">
 <div className="text-xs text-primary uppercase tracking-wider font-medium">Check Out</div>
 <div className="text-base font-bold text-on-primary-container mt-1">Done ✓</div>
 </div>
 </div>
 </div>
 )}
 </div>
 </Card>
 </div>
 )
}
