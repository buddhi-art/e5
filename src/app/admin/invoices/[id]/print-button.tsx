'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <Button onClick={() => typeof window !== 'undefined' && window.print()} className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
      <Printer className="w-4 h-4 mr-2" />
      Print Invoice
    </Button>
  )
}
