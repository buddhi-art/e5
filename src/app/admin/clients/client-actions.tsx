'use client'

import { useState } from 'react'
import { archiveClient, restoreClient, deleteClient } from './actions'
import { toast } from 'sonner'
import { Archive, RefreshCw, Trash2 } from 'lucide-react'
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
} from "@/components/ui/alert-dialog"

export function ClientActions({ clientId, clientName, isArchived }: { clientId: string; clientName: string; isArchived: boolean }) {
    const [loading, setLoading] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    async function handleArchive() {
        setLoading(true)
        const result = await archiveClient(clientId)
        if (result?.error) {
            toast.error('Failed to archive: ' + result.error)
        } else {
            toast.success(`${clientName} and all related projects have been archived.`)
        }
        setLoading(false)
    }

    async function handleRestore() {
        setLoading(true)
        const result = await restoreClient(clientId)
        if (result?.error) {
            toast.error('Failed to restore: ' + result.error)
        } else {
            toast.success(`${clientName} has been restored.`)
        }
        setLoading(false)
    }

    async function handleDelete() {
        setLoading(true)
        const result = await deleteClient(clientId)
        if (result?.error) {
            toast.error('Failed to delete permanently: ' + result.error)
        } else {
            toast.success(`${clientName} has been permanently deleted.`)
            setIsDeleteDialogOpen(false)
        }
        setLoading(false)
    }

    if (isArchived) {
        return (
            <div className="flex items-center gap-1">
                <button
                    onClick={handleRestore}
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-md w-9 h-9 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                    title="Restore client"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded-md w-9 h-9 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Permanently Delete client"
                    >
                        <Trash2 className="w-4 h-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Permanently Delete Client?</AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-600 dark:text-zinc-400">
                                Are you sure you want to permanently delete <strong>{clientName}</strong>? This action cannot be undone. All their projects and tasks will also be deleted.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-zinc-800 hover:text-zinc-900 dark:text-white">Cancel</AlertDialogCancel>
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
            </div>
        )
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger className="inline-flex items-center justify-center rounded-md w-9 h-9 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer" title="Archive client">
                <Archive className="w-4 h-4" />
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
                <AlertDialogHeader>
                    <AlertDialogTitle>Archive Client?</AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-600 dark:text-zinc-400">
                        Are you sure you want to archive <strong>{clientName}</strong>? All projects related to this client will also be archived. You can restore them later from the Archived section.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-zinc-800 hover:text-zinc-900 dark:text-white">Cancel</AlertDialogCancel>
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
    )
}
