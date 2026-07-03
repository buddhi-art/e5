import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RequestLeaveForm } from './request-leave-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function RequestLeavePage() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/login')

 const currentYear = new Date().getFullYear()

 // Fetch active leave types that the user has balance for
 const { data: balances } = await supabase
 .from('leave_balances')
 .select('*, leave_types(id, name, is_paid)')
 .eq('user_id', user.id)
 .eq('year', currentYear)
 .gt('remaining_days', 0)

 // Map to a format suitable for the form
 const availableTypes = balances?.map((b: any) => ({
 id: b.leave_types.id,
 name: b.leave_types.name,
 remaining_days: b.remaining_days,
 is_paid: b.leave_types.is_paid
 })) || []

 return (
 <div className="max-w-2xl mx-auto space-y-6">
 <div className="flex items-center gap-4">
 <Button variant="ghost" render={<Link href="/employee/leave" />} className="text-outline hover:text-on-surface dark:hover:text-white -ml-2">
 <ArrowLeft className="w-4 h-4 mr-2" />
 Back
 </Button>
 <h1 className="text-2xl font-bold text-on-surface">Request Leave</h1>
 </div>

 <div className="bg-surface-container-lowest dark:bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
 <RequestLeaveForm availableTypes={availableTypes} />
 </div>
 </div>
 )
}
