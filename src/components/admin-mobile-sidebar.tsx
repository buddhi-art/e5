'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { AdminSidebar } from '@/components/admin-sidebar'

export function AdminMobileSidebar() {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        function handleToggle() {
            setOpen(prev => !prev)
        }
        window.addEventListener('toggle-sidebar', handleToggle)
        return () => window.removeEventListener('toggle-sidebar', handleToggle)
    }, [])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent
                side="left"
                className="w-72 p-0 bg-surface-container-low border-r border-outline-variant"
            >
                <AdminSidebar onItemClick={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    )
}
