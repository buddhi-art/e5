'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash, FileText } from "lucide-react"
import { toast } from 'sonner'
import { createInvoice, updateInvoice, getProjectDates } from './actions'

type InvoiceItem = {
 id: string
 description: string
 quantity: number
 unit_price: number
}

export function InvoiceForm({ clients, projects, initialData }: { clients: any[], projects: any[], initialData?: any }) {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [clientId, setClientId] = useState(initialData?.client_id || '')
 const [projectId, setProjectId] = useState(initialData?.project_id || 'none')
 const [currency, setCurrency] = useState(initialData?.currency || 'NPR')
 const [taxRate, setTaxRate] = useState<number>(initialData?.tax_rate || 0)
 const [discountType, setDiscountType] = useState(initialData?.discount_type || 'fixed')
 const [discountValue, setDiscountValue] = useState<number>(initialData?.discount_value || 0)
 const [advanceReceived, setAdvanceReceived] = useState<number>(initialData?.advance_received || 0)
 const [issueDate, setIssueDate] = useState(initialData?.issue_date || new Date().toISOString().split('T')[0])
 const [dueDate, setDueDate] = useState(initialData?.due_date || '')

 const [items, setItems] = useState<InvoiceItem[]>(initialData?.invoice_items?.map((item: any) => ({
 id: item.id,
 description: item.description,
 quantity: item.quantity,
 unit_price: item.unit_price,
 })) || [
 { id: '1', description: '', quantity: 1, unit_price: 0 }
 ])

 // Auto-fill dates when project changes
 useEffect(() => {
 if (projectId && projectId !== 'none') {
 getProjectDates(projectId).then(res => {
 if (res.data) {
 if (res.data.start_date && !initialData) {
 setIssueDate(res.data.start_date)
 }
 if (res.data.end_date && !initialData) {
 setDueDate(res.data.end_date)
 }
 }
 })
 }
 }, [projectId, initialData])

 const selectedClient = clients.find(c => c.id === clientId)
 const filteredProjects = clientId ? projects.filter(p => p.client_id === clientId) : []

 const subtotal = useMemo(() => {
 return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
 }, [items])

 const discountAmount = useMemo(() => {
 if (discountType === 'percentage') return (subtotal * discountValue) / 100
 return discountValue
 }, [subtotal, discountType, discountValue])

 const taxAmount = useMemo(() => {
 return ((subtotal - discountAmount) * taxRate) / 100
 }, [subtotal, discountAmount, taxRate])

 const grandTotal = subtotal - discountAmount + taxAmount
 const balanceDue = grandTotal - advanceReceived

 function addItem() {
 setItems([...items, { id: Math.random().toString(), description: '', quantity: 1, unit_price: 0 }])
 }

 function removeItem(id: string) {
 if (items.length === 1) return
 setItems(items.filter(item => item.id !== id))
 }

 function updateItem(id: string, field: keyof InvoiceItem, value: any) {
 setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
 }

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
 e.preventDefault()

 const emptyItems = items.some(i => !i.description.trim())
 if (emptyItems) {
 toast.error('All line items must have a description')
 return
 }

 setLoading(true)
 const formData = new FormData(e.currentTarget)
 formData.set('client_id', clientId)
 formData.set('project_id', projectId === 'none' ? '' : projectId)
 formData.set('currency', currency)
 formData.set('items', JSON.stringify(items))
 formData.set('tax_rate', taxRate.toString())
 formData.set('discount_type', discountType)
 formData.set('discount_value', discountValue.toString())
 formData.set('advance_received', advanceReceived.toString())
 formData.set('issue_date', issueDate)
 formData.set('due_date', dueDate)

 let result
 if (initialData) {
 result = await updateInvoice(initialData.id, formData)
 } else {
 result = await createInvoice(formData)
 }

 if (result?.error) {
 toast.error(result.error)
 setLoading(false)
 } else if ('invoiceId' in (result || {})) {
 toast.success('Invoice created successfully')
 router.push(`/admin/invoices/${(result as any).invoiceId}`)
 } else {
 toast.success(initialData ? 'Invoice updated successfully' : 'Invoice created successfully as Draft')
 router.push('/admin/invoices')
 }
 }

 return (
 <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
 <div className="xl:col-span-2 space-y-6">
 <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1">
 <CardHeader>
 <CardTitle>Invoice Details</CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label>Client *</Label>
 <Select value={clientId} onValueChange={(val) => { if (val) { setClientId(val); setProjectId('none'); } }}>
 <SelectTrigger className="bg-surface-container-high">
 <SelectValue placeholder="Select client">
 {clientId ? clients.find(c => c.id === clientId)?.company_name : null}
 </SelectValue>
 </SelectTrigger>
 <SelectContent>
 {clients.map(c => (
 <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label>Project</Label>
 <Select value={projectId} onValueChange={(val) => val && setProjectId(val)} disabled={!clientId}>
 <SelectTrigger className="bg-surface-container-high">
 <SelectValue placeholder={clientId ?" Select project" :" Select client first"}>
 {projectId && projectId !== 'none' ? filteredProjects.find(p => p.id === projectId)?.title : null}
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

 <div className="space-y-2">
 <Label>Invoice Title *</Label>
 <Input name="title" required defaultValue={initialData?.title} placeholder="e.g. Phase 1 Production" className="bg-surface-container-high" />
 </div>

 <div className="space-y-2">
 <Label>Currency</Label>
 <Select value={currency} onValueChange={(val) => val && setCurrency(val)}>
 <SelectTrigger className="bg-surface-container-high">
 <SelectValue placeholder="Currency" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="NPR">NPR (Nepalese Rupee)</SelectItem>
 <SelectItem value="USD">USD (US Dollar)</SelectItem>
 <SelectItem value="EUR">EUR (Euro)</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label>Issue Date</Label>
 <Input
 type="date"
 value={issueDate}
 onChange={(e) => setIssueDate(e.target.value)}
 required
 className="bg-surface-container-high" 
 />
 </div>

 <div className="space-y-2">
 <Label>Due Date *</Label>
 <Input
 type="date"
 value={dueDate}
 onChange={(e) => setDueDate(e.target.value)}
 required
 className="bg-surface-container-high" 
 />
 </div>
 </div>

 <div className="space-y-2">
 <Label>Description (Optional)</Label>
 <Textarea name="description" defaultValue={initialData?.description} placeholder="Additional details..." className="bg-surface-container-high min-h-[80px]" />
 </div>
 </CardContent>
 </Card>

 <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1">
 <CardHeader className="flex flex-row items-center justify-between">
 <div>
 <CardTitle>Line Items</CardTitle>
 <CardDescription>Add the products or services being billed.</CardDescription>
 </div>
 <Button type="button" onClick={addItem} variant="outline" size="sm" className="bg-surface-container-lowest">
 <Plus className="w-4 h-4 mr-2" />
 Add Row
 </Button>
 </CardHeader>
 <CardContent className="space-y-4">
 {items.map((item, index) => (
 <div key={item.id} className="flex flex-col md:flex-row gap-4 items-start md:items-end">
 <div className="flex-1 w-full space-y-2">
 {index === 0 && <Label className="hidden md:block">Description</Label>}
 <Input
 value={item.description}
 onChange={e => updateItem(item.id, 'description', e.target.value)}
 placeholder="Item description"
 required
 className="bg-surface-container-high"
 />
 </div>
 <div className="w-full md:w-32 space-y-2">
 {index === 0 && <Label className="hidden md:block">Qty</Label>}
 <Input
 type="number"
 min="0"
 step="0.01"
 value={item.quantity}
 onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
 className="bg-surface-container-high"
 />
 </div>
 <div className="w-full md:w-40 space-y-2">
 {index === 0 && <Label className="hidden md:block">Unit Price</Label>}
 <Input
 type="number"
 min="0"
 step="0.01"
 value={item.unit_price}
 onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
 className="bg-surface-container-high"
 />
 </div>
 <div className="w-full md:w-32 space-y-2">
 {index === 0 && <Label className="hidden md:block">Amount</Label>}
 <Input
 readOnly
 value={(item.quantity * item.unit_price).toFixed(2)}
 className="bg-surface-container-high border-outline-variant text-outline"
 />
 </div>
 <div className="pb-1">
 <Button type="button" onClick={() => removeItem(item.id)} variant="ghost" className="text-m3-error hover:bg-m3-error-subtle hover:text-m3-error" disabled={items.length === 1}>
 <Trash className="w-4 h-4" />
 </Button>
 </div>
 </div>
 ))}
 </CardContent>
 </Card>

 <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1">
 <CardHeader>
 <CardTitle>Notes</CardTitle>
 </CardHeader>
 <CardContent>
 <Textarea name="notes" defaultValue={initialData?.notes} placeholder="Terms and conditions, payment details..." className="bg-surface-container-high min-h-[100px]" />
 </CardContent>
 </Card>
 </div>

 <div className="xl:col-span-1 space-y-6">
 <Card className="bg-surface-container-lowest border-outline-variant/50 sticky top-24 elevation-1">
 <CardHeader>
 <CardTitle>Summary</CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="space-y-3">
 <div className="flex justify-between text-sm">
 <span className="text-outline">Subtotal</span>
 <span className="font-medium">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
 </div>

 {/* Discount */}
 <div className="space-y-2">
 <Label className="text-xs">Discount</Label>
 <div className="flex gap-2">
 <Select value={discountType} onValueChange={(val) => val && setDiscountType(val)}>
 <SelectTrigger className="w-24 bg-surface-container-high h-8">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="fixed">Fixed</SelectItem>
 <SelectItem value="percentage">%</SelectItem>
 </SelectContent>
 </Select>
 <Input
 type="number"
 min="0"
 step="0.01"
 value={discountValue}
 onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
 className="flex-1 bg-surface-container-high h-8"
 placeholder="0"
 />
 </div>
 {discountAmount > 0 && (
 <div className="flex justify-between text-sm text-m3-warning">
 <span>Discount Amount</span>
 <span>- {discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
 </div>
 )}
 </div>

 {/* Tax */}
 <div className="flex items-center justify-between gap-4">
 <span className="text-sm text-outline whitespace-nowrap">Tax Rate (%)</span>
 <Input
 type="number"
 min="0"
 max="100"
 step="0.01"
 value={taxRate}
 onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
 className="w-24 bg-surface-container-high h-8 text-right"
 />
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-outline">Tax Amount</span>
 <span className="font-medium">{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
 </div>

 {/* Advance Received */}
 <div className="space-y-1">
 <Label className="text-xs">Advance Received (NPR)</Label>
 <Input
 type="number"
 min="0"
 step="0.01"
 value={advanceReceived}
 onChange={e => setAdvanceReceived(parseFloat(e.target.value) || 0)}
 className="bg-surface-container-high h-8"
 />
 </div>

 <div className="pt-3 border-t border-outline-variant flex justify-between">
 <span className="font-semibold text-on-surface">Grand Total</span>
 <span className="font-bold text-primary text-lg">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
 </div>

 <div className="flex justify-between text-sm font-medium text-m3-success">
 <span>Balance Due</span>
 <span>{balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
 </div>
 </div>

 <div className="pt-4 space-y-3">
 <Button type="submit" disabled={loading || !clientId} className="w-full bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-white font-semibold shadow-md">
 <FileText className="w-4 h-4 mr-2" />
 {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Create Invoice'}
 </Button>
 </div>
 </CardContent>
 </Card>

 {selectedClient && (
 <Card className="bg-surface-container-low border-outline-variant/50 elevation-1">
 <CardHeader className="pb-3">
 <CardTitle className="text-sm">Billed To</CardTitle>
 </CardHeader>
 <CardContent className="text-sm text-on-surface-variant space-y-1">
 <p className="font-medium text-on-surface">{selectedClient.company_name}</p>
 {selectedClient.billing_address && <p className="whitespace-pre-wrap">{selectedClient.billing_address}</p>}
 {selectedClient.tax_id && <p>Tax ID: {selectedClient.tax_id}</p>}
 </CardContent>
 </Card>
 )}
 </div>
 </form>
 )
}
