'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Bell, CalendarOff, Clock, FileText, RefreshCw, Briefcase, Camera, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getNotifications, markNotificationRead, type NotificationItem } from '@/app/actions/notifications'

const typeConfig: Record<string, { icon: LucideIcon; className: string }> = {
  leave_request: { icon: CalendarOff, className: 'text-m3-warning bg-m3-warning-subtle' },
  overdue_task: { icon: AlertTriangle, className: 'text-m3-error bg-m3-error-subtle' },
  overdue_invoice: { icon: FileText, className: 'text-primary bg-primary-container' },
  pending_payment: { icon: Clock, className: 'text-m3-info bg-m3-info-subtle' },
  task_assigned: { icon: Briefcase, className: 'text-primary bg-primary-container' },
  shoot_assigned: { icon: Camera, className: 'text-primary bg-primary-container' },
  editing_assigned: { icon: Edit2, className: 'text-primary bg-primary-container' },
  system: { icon: Bell, className: 'text-m3-info bg-m3-info-subtle' },
}

/** A visibility-aware notification popover with keyboard-safe dismissal. */
export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const fetchInFlight = useRef(false)
  const panelId = useId()

  const fetchNotifications = useCallback(async () => {
    if (fetchInFlight.current) return

    fetchInFlight.current = true
    setLoadError(false)
    try {
      const items = await getNotifications()
      setNotifications(items)
    } catch {
      setLoadError(true)
    } finally {
      fetchInFlight.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined

    const syncPolling = () => {
      if (interval) clearInterval(interval)
      interval = undefined

      if (document.visibilityState === 'visible') {
        void fetchNotifications()
        interval = setInterval(fetchNotifications, 60_000)
      }
    }

    syncPolling()
    document.addEventListener('visibilitychange', syncPolling)
    return () => {
      if (interval) clearInterval(interval)
      document.removeEventListener('visibilitychange', syncPolling)
    }
  }, [fetchNotifications])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    panelRef.current?.focus()

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const countLabel = loading
    ? 'Loading notifications'
    : notifications.length === 0
      ? 'No new notifications'
      : `${notifications.length} new notification${notifications.length === 1 ? '' : 's'}`

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="btn-morph relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-all duration-200 hover:bg-surface-container-high hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest"
        aria-label={countLabel}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
        {notifications.length > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-surface-container" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div
          id={panelId}
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          tabIndex={-1}
          className="morph-scale-in absolute right-0 top-full z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-2xl bg-surface-container-lowest shadow-xl ring-1 ring-outline-variant/50 sm:w-96 focus:outline-none"
        >
          <div className="flex items-start justify-between gap-3 border-b border-outline-variant/30 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">Notifications</h3>
              <p className="mt-0.5 text-xs text-on-surface-variant" aria-live="polite">
                {countLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchNotifications()}
              disabled={loading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Refresh notifications"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
            </button>
          </div>

          <div className="scrollbar-premium max-h-[360px] divide-y divide-outline-variant/20 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8" role="status" aria-label="Loading notifications">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : loadError ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm font-medium text-foreground">Couldn&apos;t refresh notifications</p>
                <p className="mt-1 text-xs text-on-surface-variant">Check your connection and try again.</p>
                <button
                  type="button"
                  onClick={() => void fetchNotifications()}
                  className="mt-3 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-outline" aria-hidden="true" />
                <p className="text-sm font-medium text-on-surface-variant">All clear</p>
                <p className="mt-0.5 text-xs text-outline">No pending notifications</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const config = typeConfig[notification.type] || typeConfig.overdue_task
                const Icon = config.icon

                return (
                  <Link
                    key={notification.id}
                    href={notification.href}
                    onClick={() => {
                      setOpen(false)
                      if (notification.id.startsWith('db-')) {
                        setNotifications((previous) => previous.filter((item) => item.id !== notification.id))
                        void markNotificationRead(notification.id).catch(() => void fetchNotifications())
                      }
                    }}
                    className="group flex items-start gap-3 px-4 py-3 transition-all duration-200 hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  >
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', config.className)}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                        {notification.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-on-surface-variant">{notification.description}</p>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
