'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cancelLeave } from './actions'
import { toast } from 'sonner'

export function CancelLeaveButton({ requestId }: { requestId: string }) {
 const [loading, setLoading] = useState(false)

 async function handleCancel() {
 if (!confirm('Are you sure you want to cancel this leave request?')) return
 setLoading(true)
 const res = await cancelLeave(requestId)
 if (res?.error) {
 toast.error(res.error)
 } else {
 toast.success('Leave request cancelled')
 }
 setLoading(false)
 }

 return (
 <Button 
 variant="ghost" 
 size="sm" 
 onClick={handleCancel} 
 disabled={loading}
 className="text-m3-error hover:text-m3-error hover:bg-m3-error-subtle h-8"
 >
 <X className="w-4 h-4 mr-1" />
 Cancel
 </Button>
 )
}
