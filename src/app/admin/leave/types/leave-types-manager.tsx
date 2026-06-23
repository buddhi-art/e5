'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface LeaveType {
    id: string
    name: string
    description: string | null
    is_paid: boolean
    default_days_per_year: number
}

export function LeaveTypesManager({ initialTypes }: { initialTypes: LeaveType[] }) {
    const [types, setTypes] = useState<LeaveType[]>(initialTypes)
    const [isPending, startTransition] = useTransition()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<LeaveType | null>(null)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isPaid, setIsPaid] = useState(true)
    const [defaultDays, setDefaultDays] = useState('15')

    function openCreate() {
        setEditing(null)
        setName('')
        setDescription('')
        setIsPaid(true)
        setDefaultDays('15')
        setDialogOpen(true)
    }

    function openEdit(type: LeaveType) {
        setEditing(type)
        setName(type.name)
        setDescription(type.description || '')
        setIsPaid(type.is_paid)
        setDefaultDays(String(type.default_days_per_year))
        setDialogOpen(true)
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) {
            toast.error('Name is required')
            return
        }
        const days = parseInt(defaultDays)
        if (isNaN(days) || days < 1) {
            toast.error('Default days must be a positive number')
            return
        }

        startTransition(async () => {
            const supabase = createClient()

            if (editing) {
                const { error } = await supabase
                    .from('leave_types')
                    .update({ name: name.trim(), description: description.trim() || null, is_paid: isPaid, default_days_per_year: days })
                    .eq('id', editing.id)
                if (error) { toast.error(error.message); return }
                setTypes(prev => prev.map(t => t.id === editing.id ? { ...t, name: name.trim(), description: description.trim() || null, is_paid: isPaid, default_days_per_year: days } : t))
                toast.success('Leave type updated')
            } else {
                const { data, error } = await supabase
                    .from('leave_types')
                    .insert({ name: name.trim(), description: description.trim() || null, is_paid: isPaid, default_days_per_year: days })
                    .select()
                    .single()
                if (error) { toast.error(error.message); return }
                setTypes(prev => [...prev, data])
                toast.success('Leave type created')
            }
            setDialogOpen(false)
        })
    }

    async function handleDelete(type: LeaveType) {
        if (!confirm(`Delete "${type.name}"? This cannot be undone.`)) return
        startTransition(async () => {
            const supabase = createClient()
            const { error } = await supabase.from('leave_types').delete().eq('id', type.id)
            if (error) { toast.error(error.message); return }
            setTypes(prev => prev.filter(t => t.id !== type.id))
            toast.success('Leave type deleted')
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={openCreate} size="sm" className="bg-sky-500 hover:bg-sky-600 text-white">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Leave Type
                </Button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-950">
                        <TableRow>
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">Description</TableHead>
                            <TableHead className="font-semibold text-center">Paid</TableHead>
                            <TableHead className="font-semibold text-right">Default Days / Year</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {types.length > 0 ? (
                            types.map((type) => (
                                <TableRow key={type.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <TableCell className="font-medium text-zinc-900 dark:text-white">{type.name}</TableCell>
                                    <TableCell className="text-zinc-500 text-sm max-w-[300px] truncate" title={type.description || ''}>{type.description || '-'}</TableCell>
                                    <TableCell className="text-center">
                                        {type.is_paid ? (
                                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none">Paid</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-zinc-500">Unpaid</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{type.default_days_per_year}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(type)} className="h-8 w-8 p-0">
                                                <Pencil className="w-4 h-4 text-zinc-500" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(type)} className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-zinc-500">
                                    No leave types configured. Click "Add Leave Type" to create one.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Leave Type' : 'Add Leave Type'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sick Leave" required className="bg-zinc-50 dark:bg-zinc-900" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description..." className="bg-zinc-50 dark:bg-zinc-900 resize-none" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="is_paid" checked={isPaid} onCheckedChange={(v) => setIsPaid(v === true)} />
                            <Label htmlFor="is_paid" className="font-normal">Paid Leave</Label>
                        </div>
                        <div className="space-y-2">
                            <Label>Default Days Per Year *</Label>
                            <Input type="number" min="1" value={defaultDays} onChange={e => setDefaultDays(e.target.value)} required className="bg-zinc-50 dark:bg-zinc-900" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : (editing ? 'Update' : 'Create')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
