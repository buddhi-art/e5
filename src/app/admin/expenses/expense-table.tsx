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
      case 'approved': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Approved</Badge>
      case 'reimbursed': return <Badge variant="secondary" className="bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-200 border">Reimbursed</Badge>
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>
      case 'pending': return <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-1.5 flex-1 min-w-[150px]">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'all')}>
            <SelectTrigger className="bg-zinc-50 dark:bg-zinc-800/50">
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
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Project</label>
          <Select value={projectFilter} onValueChange={(v) => setProjectFilter(v || 'all')}>
            <SelectTrigger className="bg-zinc-50 dark:bg-zinc-800/50">
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
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Category</label>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v || 'all')}>
            <SelectTrigger className="bg-zinc-50 dark:bg-zinc-800/50">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="post_production">Post Production</SelectItem>
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
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-950">
            <TableRow>
              <TableHead className="font-semibold text-zinc-900 dark:text-white">Date</TableHead>
              <TableHead className="font-semibold text-zinc-900 dark:text-white">Employee</TableHead>
              <TableHead className="font-semibold text-zinc-900 dark:text-white">Project</TableHead>
              <TableHead className="font-semibold text-zinc-900 dark:text-white">Category</TableHead>
              <TableHead className="font-semibold text-zinc-900 dark:text-white">Amount</TableHead>
              <TableHead className="font-semibold text-zinc-900 dark:text-white">Receipt</TableHead>
              <TableHead className="font-semibold text-zinc-900 dark:text-white">Status</TableHead>
              <TableHead className="text-right font-semibold text-zinc-900 dark:text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((exp) => (
                <TableRow key={exp.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <TableCell className="text-zinc-500 whitespace-nowrap">{new Date(exp.expense_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium text-zinc-900 dark:text-white">
                    {exp.submitted_by_profile?.full_name || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">{exp.projects?.title || '-'}</TableCell>
                  <TableCell className="capitalize text-zinc-600 dark:text-zinc-400">{exp.category.replace('_', ' ')}</TableCell>
                  <TableCell className="font-medium">
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
                          <Eye className="w-4 h-4 mr-2 text-zinc-500" />
                          View Details
                        </DropdownMenuItem>

                        {exp.status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusChange(exp.id, 'approved')} className="text-emerald-600 focus:bg-emerald-50 focus:text-emerald-600 dark:focus:bg-emerald-950/50">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(exp.id, 'rejected')} className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950/50">
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}

                        {exp.status === 'approved' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(exp.id, 'reimbursed')} className="text-sky-600 focus:bg-sky-50 focus:text-sky-600 dark:focus:bg-sky-950/50">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Mark Reimbursed
                          </DropdownMenuItem>
                        )}

                        {exp.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleDelete(exp.id)} className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950/50 mt-2 border-t border-red-100 dark:border-red-900/30 pt-2">
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
                <TableCell colSpan={8} className="text-center py-10 text-zinc-500">
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
