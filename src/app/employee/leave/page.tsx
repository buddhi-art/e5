/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from 'lucide-react'
import { CancelLeaveButton } from './cancel-leave-button'

export default async function EmployeeLeavePage() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 const currentYear = new Date().getFullYear()

 // Fetch Balances
 const { data: balances } = await supabase
 .from('leave_balances')
 .select('*, leave_types(name)')
 .eq('user_id', user?.id)
 .eq('year', currentYear)

 // Fetch Requests
 const { data: requests } = await supabase
 .from('leave_requests')
 .select('*, leave_types(name)')
 .eq('user_id', user?.id)
 .is('deleted_at', null)
 .order('created_at', { ascending: false })

 function getStatusBadge(status: string) {
 switch (status) {
 case 'approved': return <Badge className="bg-m3-success hover:bg-m3-success">Approved</Badge>
 case 'rejected': return <Badge variant="destructive">Rejected</Badge>
 case 'cancelled': return <Badge variant="secondary">Cancelled</Badge>
 case 'pending': return <Badge variant="outline" className="text-m3-warning border-m3-warning">Pending</Badge>
 default: return <Badge variant="outline">{status}</Badge>
 }
 }

 return (
 <div className="space-y-8 max-w-5xl">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">My Leave</h1>
 <p className="text-on-surface-variant">Manage your leave balances and requests.</p>
 </div>
 <Button render={<Link href="/employee/leave/new" />} className="bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-white font-semibold border-none">
 <Plus className="w-4 h-4 mr-2" />
 Request Leave
 </Button>
 </div>

 {/* Balances */}
 <div>
 <h2 className="text-xl font-semibold mb-4 text-on-surface">Leave Balances ({currentYear})</h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {balances && balances.length > 0 ? (
 balances.map((bal: any) => (
 <div key={bal.id} className="bg-surface-container-lowest dark:bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-sm">
 <h3 className="text-sm font-medium text-outline mb-1">{bal.leave_types?.name}</h3>
 <div className="flex items-end gap-2">
 <span className="text-3xl font-bold text-on-surface">{bal.remaining_days}</span>
 <span className="text-sm text-outline mb-1">/ {bal.total_days} days left</span>
 </div>
 </div>
 ))
 ) : (
 <div className="col-span-full p-6 text-center text-outline border border-dashed border-outline-variant rounded-xl">
 No leave balances found for this year.
 </div>
 )}
 </div>
 </div>

 {/* History */}
 <div>
 <h2 className="text-xl font-semibold mb-4 text-on-surface">Leave History</h2>
 <div className="bg-surface-container-lowest dark:bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
 <Table>
 <TableHeader className="bg-surface-container-low dark:bg-surface-container-lowest">
 <TableRow>
 <TableHead className="font-semibold">Type</TableHead>
 <TableHead className="font-semibold">Duration</TableHead>
 <TableHead className="font-semibold">Days</TableHead>
 <TableHead className="font-semibold">Status</TableHead>
 <TableHead className="font-semibold text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {requests && requests.length > 0 ? (
 requests.map((req: any) => (
 <TableRow key={req.id}>
 <TableCell className="font-medium">{req.leave_types?.name}</TableCell>
 <TableCell className="text-outline">
 {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
 </TableCell>
 <TableCell>{req.total_days}</TableCell>
 <TableCell>{getStatusBadge(req.status)}</TableCell>
 <TableCell className="text-right">
 {req.status === 'pending' && (
 <CancelLeaveButton requestId={req.id} />
 )}
 </TableCell>
 </TableRow>
 ))
 ) : (
 <TableRow>
 <TableCell colSpan={5} className="text-center py-8 text-outline">
 No leave requests found.
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 </div>
 </div>
 )
}
