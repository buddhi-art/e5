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
          className="inline-flex items-center justify-center rounded-md w-9 h-9 btn-morph text-outline hover:text-m3-success hover:bg-m3-success-subtle transition-colors cursor-pointer"
          title="Restore employee"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md w-9 h-9 btn-morph text-outline hover:text-m3-error hover:bg-m3-error-subtle transition-colors cursor-pointer"
            title="Permanently Delete employee"
          >
            <Trash2 className="w-4 h-4" />
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-surface-container-low border-outline-variant text-on-surface">
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently Delete Employee?</AlertDialogTitle>
              <AlertDialogDescription className="text-on-surface-variant">
                Are you sure you want to permanently delete <strong>{employeeName}</strong>? This action cannot be undone. All their personal data, comments, and attendance records will be removed.
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
      <AlertDialogTrigger className="inline-flex items-center justify-center rounded-md w-9 h-9 btn-morph text-outline hover:text-m3-error hover:bg-m3-error-subtle transition-colors cursor-pointer" title="Archive employee">
        <Archive className="w-4 h-4" />
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-surface-container-low border-outline-variant text-on-surface">
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Employee?</AlertDialogTitle>
          <AlertDialogDescription className="text-on-surface-variant">
            Are you sure you want to archive <strong>{employeeName}</strong>? Their profile will be hidden from active lists but can be restored later from the Archived section. Tasks assigned to them will be kept.
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
