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
                    className="inline-flex items-center justify-center rounded-md w-9 h-9 btn-morph text-outline hover:text-m3-success hover:bg-m3-success-subtle transition-colors cursor-pointer"
                    title="Restore client"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded-md w-9 h-9 btn-morph text-outline hover:text-m3-error hover:bg-m3-error-subtle transition-colors cursor-pointer"
                        title="Permanently Delete client"
                    >
                        <Trash2 className="w-4 h-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-surface-container-lowest border-outline-variant text-on-surface">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Permanently Delete Client?</AlertDialogTitle>
                            <AlertDialogDescription className="text-on-surface-variant">
                                Are you sure you want to permanently delete <strong>{clientName}</strong>? This action cannot be undone. All their projects and tasks will also be deleted.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container-high hover:text-on-surface">Cancel</AlertDialogCancel>
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
            </div>
        )
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger className="inline-flex items-center justify-center rounded-md w-9 h-9 btn-morph text-outline hover:text-m3-error hover:bg-m3-error-subtle transition-colors cursor-pointer" title="Archive client">
                <Archive className="w-4 h-4" />
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-surface-container-lowest border-outline-variant text-on-surface">
                <AlertDialogHeader>
                    <AlertDialogTitle>Archive Client?</AlertDialogTitle>
                    <AlertDialogDescription className="text-on-surface-variant">
                        Are you sure you want to archive <strong>{clientName}</strong>? All projects related to this client will also be archived. You can restore them later from the Archived section.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container-high hover:text-on-surface">Cancel</AlertDialogCancel>
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
    )
}
