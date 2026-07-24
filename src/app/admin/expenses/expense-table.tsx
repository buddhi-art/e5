/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Trash, CheckCircle, XCircle, DollarSign } from "lucide-react"
import Link from 'next/link'
import { deleteExpense, updateExpenseStatus } from './actions'
import { toast } from 'sonner'
import { ReceiptLink } from '@/components/receipt-link'

export function ExpenseTable({ initialExpenses, projects }: { initialExpenses: any[], projects: any[] }) {
 const [statusFilter, setStatusFilter] = useState('all')
 const [projectFilter, setProjectFilter] = useState('all')
 const [categoryFilter, setCategoryFilter] = useState('all')

 const filteredExpenses = initialExpenses.filter(exp => {
 if (statusFilter !== 'all' && exp.status !== statusFilter) return false
 if (projectFilter !== 'all' && exp.project_id !== projectFilter) return false
 if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false
 return true
 })

 async function handleStatusChange(id: string, status: string) {
 const res = await updateExpenseStatus(id, status)
 if (res?.error) {
 toast.error(res.error)
 } else {
 toast.success(`Expense marked as ${status}`)
 }
 }

 async function handleDelete(id: string) {
 if (!confirm('Are you sure you want to delete this expense?')) return
 const res = await deleteExpense(id)
 if (res?.error) {
 toast.error(res.error)
 } else {
 toast.success('Expense deleted')
 }
 }

 function getStatusBadge(status: string) {
 switch (status) {
 case 'approved': return <Badge className="bg-primary-container text-on-primary-container">Approved</Badge>
 case 'reimbursed': return <Badge variant="secondary" className="bg-tertiary-container text-[var(--md-sys-color-on-tertiary-container)]">Reimbursed</Badge>
 case 'rejected': return <Badge variant="destructive">Rejected</Badge>
 case 'pending': return <Badge variant="outline" className="text-m3-warning border-m3-warning">Pending</Badge>
 default: return <Badge variant="outline">{status}</Badge>
 }
 }

 return (
 <div className="space-y-4 morph-fade-in">
 {/* Filters */}
 <div className="flex flex-wrap gap-4 items-end bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-sm card-morph">
 <div className="space-y-1.5 flex-1 min-w-[150px]">
 <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Status</label>
 <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'all')}>
 <SelectTrigger className="bg-surface-container-high">
 <SelectValue placeholder="All Statuses" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Statuses</SelectItem>
 <SelectItem value="pending">Pending</SelectItem>
 <SelectItem value="approved">Approved</SelectItem>
 <SelectItem value="reimbursed">Reimbursed</SelectItem>
 <SelectItem value="rejected">Rejected</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-1.5 flex-1 min-w-[200px]">
 <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Project</label>
 <Select value={projectFilter} onValueChange={(v) => setProjectFilter(v || 'all')}>
 <SelectTrigger className="bg-surface-container-high">
 <SelectValue placeholder="All Projects">
 {projectFilter !== 'all' ? projects.find(p => p.id === projectFilter)?.title : null}
 </SelectValue>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Projects</SelectItem>
 {projects.map(p => (
 <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-1.5 flex-1 min-w-[180px]">
 <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Category</label>
 <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v || 'all')}>
 <SelectTrigger className="bg-surface-container-high">
 <SelectValue placeholder="All Categories" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Categories</SelectItem>
 <SelectItem value="production">Videography (Shoot)</SelectItem>
 <SelectItem value="post_production">Editing & Design</SelectItem>
 <SelectItem value="talent">Talent</SelectItem>
 <SelectItem value="travel">Travel</SelectItem>
 <SelectItem value="gear_rental">Gear Rental</SelectItem>
 <SelectItem value="props_wardrobe">Props & Wardrobe</SelectItem>
 <SelectItem value="food_catering">Food & Catering</SelectItem>
 <SelectItem value="marketing">Marketing</SelectItem>
 <SelectItem value="operational">Operational</SelectItem>
 <SelectItem value="other">Other</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>

 {/* Table */}
 <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl overflow-hidden shadow-sm card-morph">
 <Table>
 <TableHeader className="bg-surface-container">
 <TableRow>
 <TableHead className="font-semibold text-on-surface-variant">Date</TableHead>
 <TableHead className="font-semibold text-on-surface-variant">Employee</TableHead>
 <TableHead className="font-semibold text-on-surface-variant">Project</TableHead>
 <TableHead className="font-semibold text-on-surface-variant">Category</TableHead>
 <TableHead className="font-semibold text-on-surface-variant">Amount</TableHead>
 <TableHead className="font-semibold text-on-surface-variant">Receipt</TableHead>
 <TableHead className="font-semibold text-on-surface-variant">Status</TableHead>
 <TableHead className="text-right font-semibold text-on-surface-variant">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {filteredExpenses.length > 0 ? (
 filteredExpenses.map((exp) => (
 <TableRow key={exp.id} className="hover:bg-surface-container-high">
 <TableCell className="text-on-surface-variant whitespace-nowrap">{new Date(exp.expense_date).toLocaleDateString()}</TableCell>
 <TableCell className="font-medium text-foreground">
 {exp.submitted_by_profile?.full_name || 'Unknown'}
 </TableCell>
 <TableCell className="text-on-surface-variant">{exp.projects?.title || '-'}</TableCell>
 <TableCell className="capitalize text-on-surface-variant">{exp.category.replace('_', '')}</TableCell>
 <TableCell className="font-medium text-foreground">
 {Number(exp.amount).toLocaleString()}
 </TableCell>
 <TableCell>
 <ReceiptLink filePath={exp.receipt_url} />
 </TableCell>
 <TableCell>{getStatusBadge(exp.status)}</TableCell>
 <TableCell className="text-right">
 <DropdownMenu>
 <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
 <span className="sr-only">Open menu</span>
 <MoreHorizontal className="h-4 w-4" />
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-[160px]">
 <DropdownMenuItem render={<Link href={`/admin/expenses/${exp.id}`} />}>
 <Eye className="w-4 h-4 mr-2 text-on-surface-variant" />
 View Details
 </DropdownMenuItem>

 {exp.status === 'pending' && (
 <>
 <DropdownMenuItem onClick={() => handleStatusChange(exp.id, 'approved')} className="text-primary focus:bg-primary-container/30 focus:text-on-primary-container">
 <CheckCircle className="w-4 h-4 mr-2" />
 Approve
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleStatusChange(exp.id, 'rejected')} className="text-destructive focus:bg-error-container/30 focus:text-destructive">
 <XCircle className="w-4 h-4 mr-2" />
 Reject
 </DropdownMenuItem>
 </>
 )}

 {exp.status === 'approved' && (
 <DropdownMenuItem onClick={() => handleStatusChange(exp.id, 'reimbursed')} className="text-primary focus:bg-primary-container focus:text-on-primary-container">
 <DollarSign className="w-4 h-4 mr-2" />
 Mark Reimbursed
 </DropdownMenuItem>
 )}

 {exp.status === 'pending' && (
 <DropdownMenuItem onClick={() => handleDelete(exp.id)} className="text-m3-error focus:bg-m3-error-subtle focus:text-m3-error mt-2 border-t border-outline-variant/40 pt-2">
 <Trash className="w-4 h-4 mr-2" />
 Delete
 </DropdownMenuItem>
 )}
 </DropdownMenuContent>
 </DropdownMenu>
 </TableCell>
 </TableRow>
 ))
 ) : (
 <TableRow>
 <TableCell colSpan={8} className="text-center py-10 text-on-surface-variant">
 No expenses found matching your filters.
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 </div>
 )
}