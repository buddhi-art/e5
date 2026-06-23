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
    const [startDate, setStartDate] = useState(project.start_date || '')
    const [endDate, setEndDate] = useState(project.end_date || '')

    function handleOpenChange(isOpen: boolean) {
        if (isOpen) {
            setTitle(project.title)
            setClientId(project.client_id)
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
                <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors outline-none">
                    <span className="sr-only">Open menu</span>
                    <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
                    <DropdownMenuItem className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 p-0">
                        <Link href={`/admin/projects/${project.id}/budget`} className="flex items-center gap-2 px-2 py-1.5 w-full">
                            <Wallet className="w-4 h-4 text-sky-500" />
                            Budget
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-200 dark:border-zinc-800" />
                    <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)} className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-200 dark:border-zinc-800" />
                    {isArchived ? (
                        <>
                            <DropdownMenuItem
                                onClick={handleRestore}
                                className="cursor-pointer text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Restore
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-200 dark:border-zinc-800" />
                            <DropdownMenuItem
                                onClick={() => { setIsDeleteDialogOpen(true) }}
                                className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Permanently Delete
                            </DropdownMenuItem>
                        </>
                    ) : (
                        <DropdownMenuItem
                            onClick={() => { setIsArchiveDialogOpen(true) }}
                            className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300"
                        >
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Permanently Delete Project?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-600 dark:text-zinc-400">
                            Are you sure you want to permanently delete <strong>{project.title}</strong>? This action cannot be undone. All tasks and comments associated with this project will be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-zinc-800 hover:text-zinc-900 dark:text-white">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                            disabled={loading}
                        >
                            {loading ? 'Deleting...' : 'Permanently Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
                <AlertDialogContent className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archive Project?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-600 dark:text-zinc-400">
                            Are you sure you want to archive <strong>{project.title}</strong>? You can restore it later from the Archived section.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-zinc-800 hover:text-zinc-900 dark:text-white">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleArchive}
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                            disabled={loading}
                        >
                            {loading ? 'Archiving...' : 'Archive'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isEditDialogOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                    </DialogHeader>
                    <form action={handleSave} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Client</Label>
                            <Select value={clientId} onValueChange={(val) => setClientId(val || '')}>
                                <SelectTrigger className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white">
                                    <SelectValue placeholder="Select a client">
                                        {clientId ? clients.find(c => c.id === clientId)?.company_name : null}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>{client.company_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-title" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Project Title</Label>
                            <Input
                                id="edit-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-start-date" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">From Date</Label>
                                <Input
                                    id="edit-start-date"
                                    name="start_date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-end-date" className="text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wider font-medium">Due Date</Label>
                                <Input
                                    id="edit-end-date"
                                    name="end_date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-white text-black hover:bg-zinc-200"
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
