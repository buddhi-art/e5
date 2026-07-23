/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'

// Layer 2: ISR — Cache for 5 minutes
export const revalidate = 300
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarOff, Users, CheckCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardPendingRequests } from './dashboard-pending-requests'

export default async function AdminLeaveDashboard() {
 const supabase = await createClient()

 const today = new Date().toISOString().split('T')[0]

 const { count: pendingCount } = await supabase
 .from('leave_requests')
 .select('id', { count: 'exact', head: true })
 .eq('status', 'pending')

 const { count: onLeaveToday } = await supabase
 .from('leave_requests')
 .select('id', { count: 'exact', head: true })
 .eq('status', 'approved')
 .lte('start_date', today)
 .gte('end_date', today)

 // Fetch pending requests with details for the cards
 const { data: pendingRequests } = await supabase
 .from('leave_requests')
 .select(`
 id,
 user_id,
 leave_type_id,
 start_date,
 end_date,
 total_days,
 reason,
 leave_types(name),
 profiles!leave_requests_user_id_fkey(full_name, email)
 `)
 .eq('status', 'pending')
 .is('deleted_at', null)
 .order('created_at', { ascending: false })
 .limit(10)

 return (
 <div className="space-y-6 max-w-6xl">
 <div className="morph-fade-in">
 <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Leave Management</h1>
 <p className="text-on-surface-variant">Manage employee leave requests, balances, and holidays.</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 morph-fade-in morph-delay-1">
 <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
 <CardTitle className="text-sm font-medium text-outline">Pending Requests</CardTitle>
 <CheckCircle className="w-4 h-4 text-m3-warning" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{pendingCount || 0}</div>
 <p className="text-xs text-outline mt-1">Awaiting your approval</p>
 </CardContent>
 </Card>

 <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 morph-fade-in morph-delay-2">
 <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
 <CardTitle className="text-sm font-medium text-outline">On Leave Today</CardTitle>
 <Users className="w-4 h-4 text-primary" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{onLeaveToday || 0}</div>
 <p className="text-xs text-outline mt-1">Currently away</p>
 </CardContent>
 </Card>
 </div>

 {/* Pending request cards shown prominently */}
 {pendingRequests && pendingRequests.length > 0 && (
 <DashboardPendingRequests requests={pendingRequests as any} />
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 hover:border-primary/50 transition-colors morph-fade-in morph-delay-3">
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-lg">
 <CheckCircle className="w-5 h-5 text-primary" />
 Leave Requests
 </CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-sm text-outline mb-4">Review, approve, or reject employee leave requests.</p>
 <Button render={<Link href="/admin/leave/requests" />} variant="outline" className="w-full justify-start">
 View Requests
 </Button>
 </CardContent>
 </Card>

 <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 hover:border-primary/50 transition-colors morph-fade-in morph-delay-4">
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-lg">
 <Users className="w-5 h-5 text-m3-success" />
 Leave Balances
 </CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-sm text-outline mb-4">Manage employee leave quotas and remaining balances.</p>
 <Button render={<Link href="/admin/leave/balances" />} variant="outline" className="w-full justify-start">
 Manage Balances
 </Button>
 </CardContent>
 </Card>

 <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 hover:border-primary/50 transition-colors morph-fade-in morph-delay-5">
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-lg">
 <FileText className="w-5 h-5 text-tertiary" />
 Leave Types
 </CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-sm text-outline mb-4">Configure available leave types (Sick, Annual, etc).</p>
 <Button render={<Link href="/admin/leave/types" />} variant="outline" className="w-full justify-start">
 Configure Types
 </Button>
 </CardContent>
 </Card>

 <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 hover:border-primary/50 transition-colors morph-fade-in morph-delay-6">
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-lg">
 <CalendarOff className="w-5 h-5 text-primary" />
 Calendar & Holidays
 </CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-sm text-outline mb-4">Set public holidays to exclude them from leave calculations.</p>
 <Button render={<Link href="/admin/leave/calendar" />} variant="outline" className="w-full justify-start">
 Manage Calendar
 </Button>
 </CardContent>
 </Card>
 </div>
 </div>
 )
}
