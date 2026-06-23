'use client'

import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function TopNav({ userEmail, title = "Admin Portal" }: { userEmail: string, title?: string }) {
  return (
    <header className="h-16 bg-zinc-50 dark:bg-zinc-950/50 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="font-medium text-zinc-700 dark:text-zinc-300">
        {title}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{userEmail}</span>
        <Button variant="ghost" size="sm" onClick={() => logout()} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-zinc-800">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  )
}
