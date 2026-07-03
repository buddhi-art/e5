'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { archiveTalent, restoreTalent, deleteTalent } from '../actions'
import { Archive, RefreshCw, Trash2 } from 'lucide-react'

export function TalentDetailActions({
    talentId,
    talentName,
    isActive,
}: {
    talentId: string
    talentName: string
    isActive: boolean
}) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    function handleArchive() {
        if (!confirm(`Archive ${talentName}? This will deactivate their profile.`)) return

        startTransition(async () => {
            const result = await archiveTalent(talentId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Talent archived')
                router.push('/admin/talents')
            }
        })
    }

    function handleRestore() {
        startTransition(async () => {
            const result = await restoreTalent(talentId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Talent restored')
            }
        })
    }

    function handleDelete() {
        if (!confirm(`Permanently delete ${talentName}? This cannot be undone.`)) return

        startTransition(async () => {
            const result = await deleteTalent(talentId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Talent permanently deleted')
                router.push('/admin/talents')
            }
        })
    }

    if (!isActive) {
        return (
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRestore} disabled={isPending} className="text-m3-success hover:text-m3-success">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Restore
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    {isPending ? 'Deleting...' : 'Permanently Delete'}
                </Button>
            </div>
        )
    }

    return (
        <Button variant="outline" size="sm" onClick={handleArchive} disabled={isPending}>
            <Archive className="w-4 h-4 mr-1" />
            {isPending ? 'Archiving...' : 'Archive'}
        </Button>
    )
}
