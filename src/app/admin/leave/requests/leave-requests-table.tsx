'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { AdminLeaveActions } from './admin-leave-actions'

interface LeaveRequest {
    id: string
    user_id: string
    leave_type_id: string
    start_date: string
    end_date: string
    total_days: number
    reason: string
    status: string
    created_at: string
    leave_types: { name: string } | null
    profiles: { full_name: string; email: string } | null
}

export function LeaveRequestsTable({ requests, leaveTypes }: { requests: LeaveRequest[]; leaveTypes: { id: string; name: string }[] }) {
    const [statusFilter, setStatusFilter] = useState('all')
    const [leaveTypeFilter, setLeaveTypeFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    const filteredRequests = requests.filter(req => {
        if (statusFilter !== 'all' && req.status !== statusFilter) return false
        if (leaveTypeFilter !== 'all' && req.leave_type_id !== leaveTypeFilter) return false
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            const name = req.profiles?.full_name?.toLowerCase() || ''
            const email = req.profiles?.email?.toLowerCase() || ''
            const reason = req.reason?.toLowerCase() || ''
            if (!name.includes(q) && !email.includes(q) && !reason.includes(q)) return false
        }
        return true
    })

    function getStatusBadge(status: string) {
        switch (status) {
            case 'approved': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Approved</Badge>
            case 'rejected': return <Badge variant="destructive">Rejected</Badge>
            case 'cancelled': return <Badge variant="secondary">Cancelled</Badge>
            case 'pending': return <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-end bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                        placeholder="Search by employee, email, or reason..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 bg-zinc-50 dark:bg-zinc-800/50"
                    />
                </div>
                <div className="space-y-1.5 min-w-[140px]">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</label>
                    <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
                        <SelectTrigger className="bg-zinc-50 dark:bg-zinc-800/50">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5 min-w-[160px]">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Leave Type</label>
                    <Select value={leaveTypeFilter} onValueChange={(v) => v && setLeaveTypeFilter(v)}>
                        <SelectTrigger className="bg-zinc-50 dark:bg-zinc-800/50">
                            <SelectValue>
                                {leaveTypeFilter !== 'all' ? leaveTypes.find(lt => lt.id === leaveTypeFilter)?.name : null}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {leaveTypes.map(lt => (
                                <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-950">
                        <TableRow>
                            <TableHead className="font-semibold">Employee</TableHead>
                            <TableHead className="font-semibold">Type</TableHead>
                            <TableHead className="font-semibold">Duration</TableHead>
                            <TableHead className="font-semibold">Reason</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRequests.length > 0 ? (
                            filteredRequests.map((req: any) => (
                                <TableRow key={req.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <TableCell>
                                        <div className="font-medium text-zinc-900 dark:text-white">{req.profiles?.full_name}</div>
                                        <div className="text-xs text-zinc-500">{req.profiles?.email}</div>
                                    </TableCell>
                                    <TableCell>{req.leave_types?.name}</TableCell>
                                    <TableCell className="text-zinc-500">
                                        <div className="text-sm">{new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</div>
                                        <div className="text-xs">{req.total_days} days</div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="max-w-[200px] truncate text-sm" title={req.reason}>{req.reason}</p>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <AdminLeaveActions request={req} />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-zinc-500">
                                    No leave requests found matching your filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
