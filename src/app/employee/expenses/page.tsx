import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from 'lucide-react'
import { ReceiptLink } from '@/components/receipt-link'

export default async function EmployeeExpensesPage() {
 const supabase = await createClient()

 const { data: { user } } = await supabase.auth.getUser()

 // Fetch only their own expenses
 const { data: expenses, error } = await supabase
 .from('expenses')
 .select(`
 *,
 projects(title),
 clients(company_name)
 `)
 .eq('submitted_by', user?.id)
 .is('deleted_at', null)
 .order('expense_date', { ascending: false })

 if (error) console.error('Expenses fetch error:', error.message)

 function getStatusBadge(status: string) {
 switch (status) {
 case 'approved': return <Badge className="bg-m3-success">Approved</Badge>
 case 'reimbursed': return <Badge variant="secondary" className="bg-primary-container text-on-primary-container border-primary border">Reimbursed</Badge>
 case 'rejected': return <Badge variant="destructive">Rejected</Badge>
 case 'pending': return <Badge variant="outline" className="text-m3-warning border-m3-warning">Pending</Badge>
 default: return <Badge variant="outline">{status}</Badge>
 }
 }

 return (
 <div className="space-y-6 max-w-5xl">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">My Expenses</h1>
 <p className="text-on-surface-variant">Submit and track your reimbursement requests.</p>
 </div>
 <Button render={<Link href="/employee/expenses/new" />} className="bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-white font-semibold border-none">
 <Plus className="w-4 h-4 mr-2" />
 Submit New Expense
 </Button>
 </div>

 <div className="bg-surface-container-lowest dark:bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
 <Table>
 <TableHeader className="bg-surface-container-low dark:bg-surface-container-lowest">
 <TableRow>
 <TableHead className="font-semibold text-on-surface">Date</TableHead>
 <TableHead className="font-semibold text-on-surface">Description</TableHead>
 <TableHead className="font-semibold text-on-surface">Project</TableHead>
 <TableHead className="font-semibold text-on-surface">Amount</TableHead>
 <TableHead className="font-semibold text-on-surface">Receipt</TableHead>
 <TableHead className="font-semibold text-on-surface">Status</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {expenses && expenses.length > 0 ? (
 expenses.map((exp) => (
 <TableRow key={exp.id} className="hover:bg-surface-container-low dark:hover:bg-surface-container/50">
 <TableCell className="text-outline whitespace-nowrap">{new Date(exp.expense_date).toLocaleDateString()}</TableCell>
 <TableCell className="font-medium text-on-surface">{exp.description}</TableCell>
 <TableCell className="text-on-surface-variant">{exp.projects?.title || '-'}</TableCell>
 <TableCell className="font-medium">{Number(exp.amount).toLocaleString()} NPR</TableCell>
 <TableCell>
 <ReceiptLink filePath={exp.receipt_url} />
 </TableCell>
 <TableCell>{getStatusBadge(exp.status)}</TableCell>
 </TableRow>
 ))
 ) : (
 <TableRow>
 <TableCell colSpan={6} className="text-center py-10 text-outline">
 You have not submitted any expenses yet.
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 </div>
 )
}
