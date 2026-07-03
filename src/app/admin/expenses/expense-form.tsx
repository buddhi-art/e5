'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save } from "lucide-react"
import { toast } from 'sonner'
import { createExpense, addExpenseCategory } from './actions'

export function ExpenseForm({ clients, projects }: { clients: any[], projects: any[] }) {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [clientId, setClientId] = useState('none')
 const [projectId, setProjectId] = useState('none')
 const [categories, setCategories] = useState<string[]>([
 'Production', 'Post Production', 'Talent', 'Travel', 'Gear Rental',
 'Props & Wardrobe', 'Food & Catering', 'Marketing', 'Operational', 'Other',
 ])
 const [showNewCategory, setShowNewCategory] = useState(false)
 const [newCategory, setNewCategory] = useState('')
 const [selectedCategory, setSelectedCategory] = useState('operational')

 useEffect(() => {
 fetch('/admin/expenses/api/categories')
 .then(res => res.json())
 .then(data => { if (data?.length) setCategories(data) })
 .catch(() => { })
 }, [])

 async function handleAddCategory() {
 if (!newCategory.trim()) return
 const result = await addExpenseCategory(newCategory.trim())
 if (result.error) {
 toast.error(result.error)
 } else {
 setCategories(prev => [...prev, newCategory.trim()])
 setSelectedCategory(newCategory.trim())
 setShowNewCategory(false)
 setNewCategory('')
 toast.success('Category added')
 }
 }

 const filteredProjects = clientId !== 'none'
 ? projects.filter(p => p.client_id === clientId)
 : projects

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
 e.preventDefault()
 setLoading(true)

 const formData = new FormData(e.currentTarget)
 formData.set('category', selectedCategory)
 if (clientId !== 'none') formData.set('client_id', clientId)
 if (projectId !== 'none') formData.set('project_id', projectId)

 const result = await createExpense(formData)

 if (result?.error) {
 toast.error(result.error)
 setLoading(false)
 } else {
 toast.success('Expense recorded successfully')
 router.push('/admin/expenses')
 }
 }

 return (
 <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
 <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1">
 <CardHeader>
 <CardTitle>Expense Details</CardTitle>
 <CardDescription>Record a new company expense.</CardDescription>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label>Category *</Label>
 {showNewCategory ? (
 <div className="flex gap-2">
 <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category name" />
 <Button type="button" size="sm" onClick={handleAddCategory}>Add</Button>
 <Button type="button" size="sm" variant="outline" onClick={() => setShowNewCategory(false)}>Cancel</Button>
 </div>
 ) : (
 <Select value={selectedCategory} onValueChange={(val) => {
 if (val === '__ADD_NEW__') setShowNewCategory(true)
 else setSelectedCategory(val || 'operational')
 }}>
 <SelectTrigger className="bg-surface-container-high">
 <SelectValue placeholder="Select category" />
 </SelectTrigger>
 <SelectContent>
 {categories.map(cat => (
 <SelectItem key={cat} value={cat}>{cat}</SelectItem>
 ))}
 <SelectItem value="__ADD_NEW__" className="text-primary font-medium">+ Add New</SelectItem>
 </SelectContent>
 </Select>
 )}
 </div>

 <div className="space-y-2">
 <Label>Amount (NPR) *</Label>
 <Input name="amount" type="number" step="0.01" min="0" required className="bg-surface-container-high" />
 </div>

 <div className="space-y-2">
 <Label>Expense Date *</Label>
 <Input name="expense_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-surface-container-high"  />
 </div>
 </div>

 <div className="space-y-2">
 <Label>Description *</Label>
 <Input name="description" required placeholder="What was this expense for?" className="bg-surface-container-high" />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label>Link to Client (Optional)</Label>
 <Select value={clientId} onValueChange={(val) => { if (val) { setClientId(val); setProjectId('none'); } }}>
 <SelectTrigger className="bg-surface-container-high">
 <SelectValue placeholder="Select client">
 {clientId !== 'none' ? clients.find(c => c.id === clientId)?.company_name : null}
 </SelectValue>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="none">None</SelectItem>
 {clients.map(c => (
 <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label>Link to Project (Optional)</Label>
 <Select value={projectId} onValueChange={(val) => val && setProjectId(val)}>
 <SelectTrigger className="bg-surface-container-high">
 <SelectValue placeholder="Select project">
 {projectId !== 'none' ? filteredProjects.find(p => p.id === projectId)?.title : null}
 </SelectValue>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="none">None</SelectItem>
 {filteredProjects.map(p => (
 <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>

 <div className="flex items-center space-x-2 pt-2">
 <input type="checkbox" id="is_billable" name="is_billable" defaultChecked className="rounded border-outline-variant text-primary focus:ring-primary" />
 <Label htmlFor="is_billable" className="font-normal">This expense is billable to the client</Label>
 </div>

 <div className="space-y-2 pt-4 border-t border-outline-variant">
 <Label>Receipt Image (Optional)</Label>
 <Input name="receipt" type="file" accept="image/*,.pdf" className="bg-surface-container-high" />
 <p className="text-xs text-outline">Upload a scan or photo of the receipt.</p>
 </div>

 <div className="space-y-2">
 <Label>Notes (Optional)</Label>
 <Textarea name="notes" placeholder="Additional details..." className="bg-surface-container-high min-h-[80px]" />
 </div>

 <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-white font-semibold">
 <Save className="w-4 h-4 mr-2" />
 {loading ? 'Saving...' : 'Record Expense'}
 </Button>
 </CardContent>
 </Card>
 </form>
 )
}
