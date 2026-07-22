"use client"

import { useState, useEffect } from 'react'
import { listPackages, createPackage, deletePackage, type ProjectPackage } from '@/app/admin/projects/package-actions'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './select'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './dialog'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Constants for maintainability
const SELECT_PLACEHOLDER = 'Select a package'
const DIALOG_TITLE = 'Create New Package'
const LABEL_TEXT = 'Package Name'
const PLACEHOLDER_EXAMPLE = 'e.g., Premium Package'
const ADD_BUTTON_LABEL = 'Add'
const CREATE_BUTTON_LABEL = 'Create Package'
const CANCEL_BUTTON_LABEL = 'Cancel'
const DELETE_CONFIRM_PREFIX = 'Are you sure you want to delete "'
const DELETE_CONFIRM_SUFFIX = '"? This will not remove it from existing projects.'
const CREATE_SUCCESS_PREFIX = '"'
const CREATE_SUCCESS_SUFFIX = '" created successfully'
const DELETE_SUCCESS_PREFIX = '"'
const DELETE_SUCCESS_SUFFIX = '" deleted successfully'
const ERROR_REQUIRED = 'Package name is required'
const ICON_SIZE_SM = 'w-3.5 h-3.5'
const ICON_MARGIN = 'mr-2'
const LOADER_SIZE_SM = 'w-4 h-4'
const LOADER_SIZE_MD = 'w-5 h-5'

interface PackageSelectProps {
    value?: string
    onChange?: (value: string | null) => void
    name?: string
    disabled?: boolean
    className?: string
    required?: boolean
}

export function PackageSelect({
    value,
    onChange,
    name,
    disabled,
    className,
    required,
}: PackageSelectProps) {
    const [packages, setPackages] = useState<ProjectPackage[]>([])
    const [loading, setLoading] = useState(true)
    const [openDialog, setOpenDialog] = useState(false)
    const [newPackageName, setNewPackageName] = useState('')
    const [creating, setCreating] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Fetch packages on mount
    useEffect(() => {
        loadPackages()
    }, [])

    async function loadPackages() {
        try {
            const result = await listPackages()
            if (result.data) {
                setPackages(result.data)
            }
            if (result.error) {
                console.error('Failed to load packages:', result.error)
            }
        } catch (err) {
            console.error('Error loading packages:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleCreatePackage(e: React.FormEvent) {
        e.preventDefault()
        if (!newPackageName.trim()) {
            toast.error(ERROR_REQUIRED)
            return
        }

        setCreating(true)
        const result = await createPackage(newPackageName.trim())

        if (result.error) {
            toast.error(result.error)
        } else if (result.data) {
            toast.success(`${CREATE_SUCCESS_PREFIX}${result.data.name}${CREATE_SUCCESS_SUFFIX}`)
            setNewPackageName('')
            setOpenDialog(false)
            await loadPackages()
            // Store the package name (not ID) since projects.package is a text field
            onChange?.(result.data.name)
        }
        setCreating(false)
    }

    async function handleDeletePackage(packageId: string, e: React.MouseEvent) {
        e.stopPropagation()
        e.preventDefault()

        const pkg = packages.find(p => p.id === packageId)
        if (!pkg) return

        // Escape package name for safe interpolation in confirm dialog
        const safeName = pkg.name.replace(/"/g, '\\"')
        if (!confirm(`${DELETE_CONFIRM_PREFIX}${safeName}${DELETE_CONFIRM_SUFFIX}`)) {
            return
        }

        setDeletingId(packageId)
        const result = await deletePackage(packageId)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`${DELETE_SUCCESS_PREFIX}${pkg.name}${DELETE_SUCCESS_SUFFIX}`)
            await loadPackages()
            // If the deleted package was selected, clear the selection
            if (value === pkg.name) {
                onChange?.(null)
            }
        }
        setDeletingId(null)
    }

    // Find the selected package by name
    const selectedPackage = packages.find(pkg => pkg.name === value)

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                {name && <Label className="text-on-surface" htmlFor={`package-${name}`}>Package</Label>}
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-transparent hover:bg-accent hover:text-accent-foreground h-7 px-2.5 text-xs">
                        <Plus className={`${ICON_SIZE_SM} ${ICON_MARGIN}`} />
                        {ADD_BUTTON_LABEL}
                    </DialogTrigger>
                    <DialogContent className="bg-surface-container-lowest border-outline-variant text-on-surface">
                        <DialogHeader>
                            <DialogTitle className="text-on-surface">{DIALOG_TITLE}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreatePackage}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-package-name" className="text-on-surface-variant">{LABEL_TEXT}</Label>
                                    <Input
                                        id="new-package-name"
                                        value={newPackageName}
                                        onChange={(e) => setNewPackageName(e.target.value)}
                                        placeholder={PLACEHOLDER_EXAMPLE}
                                        className="bg-surface-container-high border-outline-variant text-on-surface"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpenDialog(false)}
                                    className="bg-surface-container-high border-outline-variant text-on-surface"
                                >
                                    {CANCEL_BUTTON_LABEL}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={creating || !newPackageName.trim()}
                                    className="bg-primary text-primary-foreground"
                                >
                                    {creating && <Loader2 className={`${LOADER_SIZE_SM} ${ICON_MARGIN} animate-spin`} />}
                                    {CREATE_BUTTON_LABEL}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-10">
                    <Loader2 className={`${LOADER_SIZE_MD} animate-spin text-outline`} />
                </div>
            ) : (
                <Select
                    value={value}
                    onValueChange={(val) => onChange?.(val || null)}
                    disabled={disabled}
                >
                    <SelectTrigger className={`bg-surface-container-high border-outline-variant text-on-surface ${className}`}>
                        <SelectValue placeholder={SELECT_PLACEHOLDER}>
                            {selectedPackage ? selectedPackage.name : null}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-surface-container-lowest border-outline-variant text-on-surface">
                        {packages.length === 0 ? (
                            <div className="px-2 py-3 text-sm text-outline-variant">
                                No packages available. Click &quot;Add&quot; to create one.
                            </div>
                        ) : (
                            <>
                                {packages.map((pkg) => (
                                    <div
                                        key={pkg.id}
                                        className="relative group"
                                    >
                                        <SelectItem value={pkg.name} className="pr-12">
                                            <span className="flex-1">{pkg.name}</span>
                                        </SelectItem>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeletePackage(pkg.id, e)}
                                            disabled={deletingId === pkg.id}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Delete package"
                                        >
                                            {deletingId === pkg.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </>
                        )}
                    </SelectContent>
                </Select>
            )}

            {/* Hidden input for form submission */}
            {name && (
                <input type="hidden" name={name} value={value || ''} />
            )}
        </div>
    )
}

export { type ProjectPackage }