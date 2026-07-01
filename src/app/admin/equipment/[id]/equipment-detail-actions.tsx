'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { archiveEquipment, restoreEquipment, deleteEquipment } from '../actions'
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

export function EquipmentDetailActions({
    equipmentId,
    equipmentName,
    isArchived,
}: {
    equipmentId: string
    equipmentName: string
    isArchived: boolean
}) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false)

    function handleArchive() {
        startTransition(async () => {
            const result = await archiveEquipment(equipmentId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Equipment archived')
                setIsArchiveDialogOpen(false)
            }
        })
    }

    function handleRestore() {
        startTransition(async () => {
            const result = await restoreEquipment(equipmentId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Equipment restored')
            }
        })
    }

    function handleDelete() {
        startTransition(async () => {
            const result = await deleteEquipment(equipmentId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Equipment permanently deleted')
                setIsDeleteDialogOpen(false)
                router.push('/admin/equipment')
            }
        })
    }

    if (isArchived) {
        return (
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleRestore} disabled={isPending} className="text-emerald-600 hover:text-emerald-700">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Restore
                </Button>
                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={isPending}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    {isPending ? 'Deleting...' : 'Permanently Delete'}
                </Button>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Permanently Delete Equipment?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to permanently delete <strong>{equipmentName}</strong>? This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={isPending}>
                                Permanently Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )
    }

    return (
        <>
            <Button variant="outline" onClick={() => setIsArchiveDialogOpen(true)} disabled={isPending}>
                <Archive className="w-4 h-4 mr-1" />
                {isPending ? 'Archiving...' : 'Archive'}
            </Button>
            <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archive Equipment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to archive <strong>{equipmentName}</strong>? This will set its status to retired.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleArchive} className="bg-red-600 hover:bg-red-700 text-white" disabled={isPending}>
                            Archive
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
