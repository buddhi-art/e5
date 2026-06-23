'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Pencil, Check, X } from 'lucide-react'
import { adjustLeaveBalance } from '../actions'
import { toast } from 'sonner'

export function EditBalanceCell({ balanceId, userId, leaveTypeId, year, totalDays }: { balanceId: string; userId: string; leaveTypeId: string; year: number; totalDays: number }) {
    const [editing, setEditing] = useState(false)
    const [value, setValue] = useState(String(totalDays))
    const [isPending, startTransition] = useTransition()

    function handleSave() {
        const newTotal = parseInt(value)
        if (isNaN(newTotal) || newTotal < 0) {
            toast.error('Total days must be a positive number')
            return
        }
        startTransition(async () => {
            const res = await adjustLeaveBalance(userId, leaveTypeId, newTotal, year)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success('Balance updated')
                setEditing(false)
            }
        })
    }

    function handleCancel() {
        setValue(String(totalDays))
        setEditing(false)
    }

    if (editing) {
        return (
            <div className="flex items-center gap-1 justify-end">
                <Input
                    type="number"
                    min="0"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    className="w-16 h-8 text-right text-sm bg-zinc-50 dark:bg-zinc-900"
                    disabled={isPending}
                    autoFocus
                />
                <Button variant="ghost" size="sm" onClick={handleSave} disabled={isPending} className="h-7 w-7 p-0 text-emerald-600">
                    <Check className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isPending} className="h-7 w-7 p-0 text-zinc-400">
                    <X className="w-3.5 h-3.5" />
                </Button>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-end gap-2">
            <span className="font-medium">{totalDays}</span>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-6 w-6 p-0">
                <Pencil className="w-3 h-3 text-zinc-400 hover:text-zinc-600" />
            </Button>
        </div>
    )
}
