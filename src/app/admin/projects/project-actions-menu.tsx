/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'
import { updateProject, archiveProject, restoreProject, deleteProject } from './actions'
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { MoreVertical, Pencil, Archive, RefreshCw, Wallet, Trash2 } from 'lucide-react'
import Link from 'next/link'

type Client = {
    id: string
    company_name: string
}

type Project = {
    id: string
    title: string
    client_id: string
    package?: string | null
    start_date?: string | null
    end_date?: string | null
    deleted_at?: string | null
    clients?: { company_name: string }
}

export function ProjectActionsMenu({ project, clients }: { project: Project; clients: Client[] }) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const isArchived = !!project.deleted_at

    // Edit state
    const [title, setTitle] = useState(project.title)
    const [clientId, setClientId] = useState(project.client_id)
    const [pkg, setPkg] = useState<string | null>(project.package || null)
    const [startDate, setStartDate] = useState(project.start_date || '')
    const [endDate, setEndDate] = useState(project.end_date || '')

    function handleOpenChange(isOpen: boolean) {
        if (isOpen) {
            setTitle(project.title)
            setClientId(project.client_id)
            setPkg(project.package || null)
            setStartDate(project.start_date || '')
            setEndDate(project.end_date || '')
        }
        setIsEditDialogOpen(isOpen)
    }

    async function handleSave(formData: FormData) {
        if (!clientId || !title.trim()) {
            toast.error('Title and Client are required')
            return
        }

        formData.set('title', title)
        formData.set('client_id', clientId)
        formData.set('package', pkg || '')
        formData.set('start_date', startDate || '')
        formData.set('end_date', endDate || '')

        setLoading(true)
        const result = await updateProject(project.id, formData)
        setLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Project updated successfully')
            setIsEditDialogOpen(false)
        }
    }

    async function handleArchive() {
        setLoading(true)
        const result = await archiveProject(project.id)
        setLoading(false)

        if (result?.error) {
            toast.error('Failed to archive project: ' + result.error)
        } else {
            toast.success(`${project.title} has been archived.`)
        }
    }

    async function handleRestore() {
        setLoading(true)
        const result = await restoreProject(project.id)
        setLoading(false)

        if (result?.error) {
            toast.error('Failed to restore project: ' + result.error)
        } else {
            toast.success(`${project.title} has been restored.`)
        }
    }

    async function handleDelete() {
        setLoading(true)
        const result = await deleteProject(project.id)
        setLoading(false)

        if (result?.error) {
            toast.error('Failed to delete permanently: ' + result.error)
        } else {
            toast.success(`${project.title} has been permanently deleted.`)
            setIsDeleteDialogOpen(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md btn-morph text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors outline-none">
                    <span className="sr-only">Open menu</span>
                    <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-surface-container-lowest border-outline-variant text-on-surface">
                    <DropdownMenuItem className="cursor-pointer hover:bg-surface-container-high p-0">
                        <Link href={`/admin/projects/${project.id}/budget`} className="flex items-center gap-2 px-2 py-1.5 w-full">
                            <Wallet className="w-4 h-4 text-primary" />
                            Budget
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-outline-variant" />
                    <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)} className="cursor-pointer hover:bg-surface-container-high">
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-outline-variant" />
                    {isArchived ? (
                        <>
                            <DropdownMenuItem
                                onClick={handleRestore}
                                className="cursor-pointer text-m3-success hover:bg-m3-success-subtle"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Restore
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-outline-variant" />
                            <DropdownMenuItem
                                onClick={() => { setIsDeleteDialogOpen(true) }}
                                className="cursor-pointer text-m3-error hover:bg-m3-error-subtle hover:text-m3-error"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Permanently Delete
                            </DropdownMenuItem>
                        </>
                    ) : (
                        <DropdownMenuItem
                            onClick={() => { setIsArchiveDialogOpen(true) }}
                            className="cursor-pointer text-m3-error hover:bg-m3-error-subtle hover:text-m3-error"
                        >
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-surface-container-low border-outline-variant text-on-surface">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Permanently Delete Project?</AlertDialogTitle>
                        <AlertDialogDescription className="text-on-surface-variant">
                            Are you sure you want to permanently delete <strong>{project.title}</strong>? This action cannot be undone. All tasks and comments associated with this project will be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-surface-container-lowest dark:bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container-high dark:bg-surface-container hover:text-on-surface">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90 text-white border-none"
                            disabled={loading}
                        >
                            {loading ? 'Deleting...' : 'Permanently Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
                <AlertDialogContent className="bg-surface-container-low border-outline-variant text-on-surface">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archive Project?</AlertDialogTitle>
                        <AlertDialogDescription className="text-on-surface-variant">
                            Are you sure you want to archive <strong>{project.title}</strong>? You can restore it later from the Archived section.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-surface-container-lowest dark:bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container-high dark:bg-surface-container hover:text-on-surface">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleArchive}
                            className="bg-destructive hover:bg-destructive/90 text-white border-none"
                            disabled={loading}
                        >
                            {loading ? 'Archiving...' : 'Archive'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isEditDialogOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="bg-surface-container-low dark:bg-surface-container-lowest border-outline-variant text-on-surface sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                    </DialogHeader>
                    <form action={handleSave} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label className="text-on-surface text-xs uppercase tracking-wider font-medium">Client</Label>
                            <Select value={clientId} onValueChange={(val) => setClientId(val || '')}>
                                <SelectTrigger className="bg-surface-container-high dark:bg-surface-container/50 border-outline-variant text-on-surface">
                                    <SelectValue placeholder="Select a client">
                                        {clientId ? clients.find(c => c.id === clientId)?.company_name : null}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-surface-container-lowest dark:bg-surface-container-lowest border-outline-variant text-on-surface">
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>{client.company_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-title" className="text-on-surface text-xs uppercase tracking-wider font-medium">Project Title</Label>
                            <Input
                                id="edit-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="bg-surface-container-high dark:bg-surface-container/50 border-outline-variant text-on-surface"
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
                                <Label htmlFor="edit-start-date" className="text-on-surface text-xs uppercase tracking-wider font-medium">From Date</Label>
                                <Input
                                    id="edit-start-date"
                                    name="start_date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-surface-container-high dark:bg-surface-container/50 border-outline-variant text-on-surface"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-end-date" className="text-on-surface text-xs uppercase tracking-wider font-medium">Due Date</Label>
                                <Input
                                    id="edit-end-date"
                                    name="end_date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-surface-container-high dark:bg-surface-container/50 border-outline-variant text-on-surface"
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-surface-container-lowest text-black hover:bg-surface-container-highest"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
