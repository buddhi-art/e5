'use client'

import { useState } from 'react'
import { createProject } from '../../projects/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { PackageSelect } from '@/components/ui/package-select'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

export function AddProjectDialog({ clientId, clientName }: { clientId: string; clientName: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [pkg, setPkg] = useState<string | null>(null)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim()) {
            toast.error('Project title is required')
            return
        }

        const formData = new FormData()
        formData.set('client_id', clientId)
        formData.set('title', title.trim())
        if (pkg) formData.set('package', pkg)
        if (startDate) formData.set('start_date', startDate)
        if (endDate) formData.set('end_date', endDate)

        setLoading(true)
        const result = await createProject(formData)
        setLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Project created successfully')
            setTitle('')
            setPkg(null)
            setStartDate('')
            setEndDate('')
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
                <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white font-semibold border-none">
                    <Plus className="w-4 h-4" /> Add Project
                </Button>
            } />
            <DialogContent className="bg-surface-container-lowest border-outline-variant text-on-surface sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>New Project for {clientName}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="project-title" className="text-on-surface text-xs uppercase tracking-wider font-medium">Project Title</Label>
                        <Input
                            id="project-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="e.g., Summer Campaign Video"
                            className="bg-surface-container-high border-outline-variant text-on-surface"
                        />
                    </div>
                    <div className="space-y-2">
                        <PackageSelect
                            name="package"
                            value={pkg || undefined}
                            onChange={(val) => setPkg(val)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date" className="text-on-surface text-xs uppercase tracking-wider font-medium">From Date</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-surface-container-high border-outline-variant text-on-surface"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_date" className="text-on-surface text-xs uppercase tracking-wider font-medium">Due Date</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-surface-container-high border-outline-variant text-on-surface"
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white font-semibold border-none"
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Project'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
