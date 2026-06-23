'use client'

import { useState } from 'react'
import { Archive, RefreshCw, Trash2 } from 'lucide-react'
import { archiveEmployee, restoreEmployee, deleteEmployee } from './actions'
import { toast } from 'sonner'
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

export function EmployeeActions({ employeeId, employeeName, isArchived }: { employeeId: string, employeeName: string, isArchived?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  async function handleArchive() {
    setLoading(true)
    const result = await archiveEmployee(employeeId)

    if (result?.error) {
      toast.error('Failed to archive: ' + result.error)
    } else {
      toast.success(`${employeeName} has been archived.`)
    }
    setLoading(false)
  }

  async function handleRestore() {
    setLoading(true)
    const result = await restoreEmployee(employeeId)

    if (result?.error) {
      toast.error('Failed to restore: ' + result.error)
    } else {
      toast.success(`${employeeName} has been restored.`)
    }
    setLoading(false)
  }

  async function handleDelete() {
    setLoading(true)
    const result = await deleteEmployee(employeeId)

    if (result?.error) {
      toast.error('Failed to delete permanently: ' + result.error)
    } else {
      toast.success(`${employeeName} has been permanently deleted.`)
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
          title="Restore employee"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md w-9 h-9 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Permanently Delete employee"
          >
            <Trash2 className="w-4 h-4" />
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently Delete Employee?</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-600 dark:text-zinc-400">
                Are you sure you want to permanently delete <strong>{employeeName}</strong>? This action cannot be undone. All their personal data, comments, and attendance records will be removed.
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
      <AlertDialogTrigger className="inline-flex items-center justify-center rounded-md w-9 h-9 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer" title="Archive employee">
        <Archive className="w-4 h-4" />
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Employee?</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-600 dark:text-zinc-400">
            Are you sure you want to archive <strong>{employeeName}</strong>? Their profile will be hidden from active lists but can be restored later from the Archived section. Tasks assigned to them will be kept.
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
