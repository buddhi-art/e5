'use client'

import { useState, useEffect } from 'react'
import { checkIn, checkOut } from './actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { LogIn, LogOut, Clock, Lock, Timer } from 'lucide-react'

interface AttendanceFormProps {
 hasCheckedIn: boolean
 hasCheckedOut: boolean
 checkInTime: string | null
}

const MIN_WORK_MINUTES = 120 // 2 hours

export function AttendanceForm({ hasCheckedIn, hasCheckedOut, checkInTime }: AttendanceFormProps) {
 const [checkingIn, setCheckingIn] = useState(false)
 const [checkingOut, setCheckingOut] = useState(false)
 const [daySummary, setDaySummary] = useState('')
 const [localCheckedIn, setLocalCheckedIn] = useState(hasCheckedIn)
 const [remainingMs, setRemainingMs] = useState<number>(0)

 // Live countdown timer — recalculates every second
 useEffect(() => {
   if (!checkInTime || hasCheckedOut || !localCheckedIn) return

   function calcRemaining() {
     const checkInDate = new Date(checkInTime!)
     const now = new Date()
     const elapsed = now.getTime() - checkInDate.getTime()
     const requiredMs = MIN_WORK_MINUTES * 60 * 1000
     return Math.max(0, requiredMs - elapsed)
   }

   setRemainingMs(calcRemaining())

   const interval = setInterval(() => {
     const r = calcRemaining()
     setRemainingMs(r)
     if (r <= 0) clearInterval(interval)
   }, 1000)

   return () => clearInterval(interval)
 }, [checkInTime, hasCheckedOut, localCheckedIn])

 const isCheckoutLocked = remainingMs > 0

 function formatCountdown(ms: number) {
   const totalSecs = Math.ceil(ms / 1000)
   const hrs = Math.floor(totalSecs / 3600)
   const mins = Math.floor((totalSecs % 3600) / 60)
   const secs = totalSecs % 60
   return `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`
 }

 // Progress percentage (0 to 100)
 const progressPercent = checkInTime
   ? Math.min(100, ((MIN_WORK_MINUTES * 60 * 1000 - remainingMs) / (MIN_WORK_MINUTES * 60 * 1000)) * 100)
   : 0

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
  if (isCheckoutLocked) {
   toast.error(`Cannot check out yet. ${formatCountdown(remainingMs)} remaining.`)
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

       {/* 2-Hour Lockout Timer */}
       {isCheckoutLocked && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
         <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
          <Lock className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wide">Checkout Locked — Minimum 2 Hours Required</span>
         </div>
         <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-xl border border-amber-500/30">
           <Timer className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
           <span className="text-2xl font-mono font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
            {formatCountdown(remainingMs)}
           </span>
          </div>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-2">
           You can check out after completing 2 hours of work
          </p>
         </div>
         {/* Progress bar */}
         <div className="w-full h-2 bg-amber-500/20 rounded-full overflow-hidden">
          <div
           className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-1000"
           style={{ width: `${progressPercent}%` }}
          />
         </div>
         <div className="flex justify-between text-[10px] text-on-surface-variant font-medium">
          <span>Check In</span>
          <span>{Math.round(progressPercent)}% completed</span>
          <span>2h minimum</span>
         </div>
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
        disabled={checkingOut || wordCount < 20 || isCheckoutLocked}
        size="lg"
        className={`w-full font-semibold text-lg h-14 shadow-lg border-none disabled:opacity-50 disabled:cursor-not-allowed ${
         isCheckoutLocked
          ? 'bg-gradient-to-r from-gray-400 to-gray-300 text-gray-600 shadow-gray-400/20 cursor-not-allowed'
          : 'bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white shadow-orange-500/20'
        }`}
       >
        {isCheckoutLocked ? (
         <>
          <Lock className="w-5 h-5 mr-3" />
          Checkout Locked ({formatCountdown(remainingMs)})
         </>
        ) : (
         <>
          <LogOut className="w-5 h-5 mr-3" />
          {checkingOut ? 'Checking out...' : 'Check Out'}
         </>
        )}
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
