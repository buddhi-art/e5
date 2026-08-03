import { ExpenseForm } from '../expense-form'
import { requireAdminOrFounder } from '@/lib/auth/page-guard'

export default async function NewExpensePage() {
 const { supabase } = await requireAdminOrFounder()


 const { data: clients } = await supabase
 .from('clients')
 .select('id, company_name')
 .is('deleted_at', null)
 .order('company_name', { ascending: true })

 const { data: projects } = await supabase
 .from('projects')
 .select('id, title, client_id')
 .is('deleted_at', null)
 .order('title', { ascending: true })

 return (
 <div className="space-y-6">
 <div>
 <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">New Expense</h1>
 <p className="text-on-surface-variant">Record a new company expense or employee reimbursement request.</p>
 </div>

 <ExpenseForm 
 clients={clients || []} 
 projects={projects || []} 
 />
 </div>
 )
}
