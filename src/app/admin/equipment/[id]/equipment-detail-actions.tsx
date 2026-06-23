'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { archiveEquipment, restoreEquipment, deleteEquipment } from '../actions'
import { Archive, RefreshCw, Trash2 } from 'lucide-react'

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

    function handleArchive() {
        if (!confirm(`Archive ${equipmentName}? This will set its status to retired.`)) return

        startTransition(async () => {
            const result = await archiveEquipment(equipmentId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Equipment archived')
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
        if (!confirm(`Permanently delete ${equipmentName}? This cannot be undone.`)) return

        startTransition(async () => {
            const result = await deleteEquipment(equipmentId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Equipment permanently deleted')
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
                <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    {isPending ? 'Deleting...' : 'Permanently Delete'}
                </Button>
            </div>
        )
    }

    return (
        <Button variant="outline" onClick={handleArchive} disabled={isPending}>
            <Archive className="w-4 h-4 mr-1" />
            {isPending ? 'Archiving...' : 'Archive'}
        </Button>
    )
}
