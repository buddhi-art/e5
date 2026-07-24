/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Bell, Clock, AlertTriangle, CalendarOff, FileText, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getNotifications, markNotificationRead, type NotificationItem } from '@/app/actions/notifications'
import Link from 'next/link'

const typeConfig: Record<string, { icon: any; className: string }> = {
 leave_request: { icon: CalendarOff, className: 'text-m3-warning bg-m3-warning-subtle' },
 overdue_task: { icon: AlertTriangle, className: 'text-m3-error bg-m3-error-subtle' },
 overdue_invoice: { icon: FileText, className: 'text-primary bg-primary-container' },
 pending_payment: { icon: Clock, className: 'text-m3-info bg-m3-info-subtle' },
 system: { icon: Bell, className: 'text-m3-info bg-m3-info-subtle' },
}

export function NotificationDropdown() {
 const [open, setOpen] = useState(false)
 const [notifications, setNotifications] = useState<NotificationItem[]>([])
 const [loading, setLoading] = useState(true)
 const [emailOptIn, setEmailOptIn] = useState(false)
 const dropdownRef = useRef<HTMLDivElement>(null)

 const fetchNotifications = useCallback(async () => {
 try {
 const items = await getNotifications()
 setNotifications(items)
 } catch {
 // Silently fail; retry on next poll
 } finally {
 setLoading(false)
 }
 }, [])

 useEffect(() => {
 // fetchNotifications is async: every setState inside it runs *after* an await,
 // so this is not a synchronous cascading render. Standard fetch-on-mount + poll.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 fetchNotifications()

 // Poll every 60 seconds
 const interval = setInterval(fetchNotifications, 60_000)
 return () => clearInterval(interval)
 }, [fetchNotifications])

 useEffect(() => {
 if (!open) return
 function handleClick(e: MouseEvent) {
 if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
 setOpen(false)
 }
 }
 document.addEventListener('mousedown', handleClick)
 return () => document.removeEventListener('mousedown', handleClick)
 }, [open])

 const unreadCount = notifications.length

 return (
 <div ref={dropdownRef} className="relative">
 <button
 onClick={() => setOpen(!open)}
 className="inline-flex items-center justify-center rounded-lg w-9 h-9 text-on-surface-variant hover:bg-surface-container-high hover:text-foreground transition-all duration-200 btn-morph relative"
 aria-label="Notifications"
 >
 <Bell className="w-4.5 h-4.5" />
 {unreadCount > 0 && (
 <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface-container" />
 )}
 </button>

 {open && (
 <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface-container-lowest rounded-2xl elevation-3 ring-1 ring-outline-variant/50 overflow-hidden z-50 shadow-xl morph-scale-in origin-top-right">
 <div className="px-4 py-3 border-b border-outline-variant/30">
 <h3 className="text-sm font-semibold text-foreground tracking-tight">Notifications</h3>
 <p className="text-xs text-on-surface-variant mt-0.5">
 {loading ? 'Loading...' : notifications.length === 0 ? 'Nothing new' : `${notifications.length} item${notifications.length > 1 ? 's' : ''}`}
 </p>
 </div>

 <div className="max-h-[360px] overflow-y-auto divide-y divide-outline-variant/20 scrollbar-premium">
 {loading ? (
 <div className="flex items-center justify-center py-8">
 <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
 </div>
 ) : notifications.length === 0 ? (
 <div className="py-8 text-center">
 <Bell className="w-8 h-8 text-outline mx-auto mb-2" />
 <p className="text-sm text-on-surface-variant font-medium">All clear</p>
 <p className="text-xs text-outline mt-0.5">No pending notifications</p>
 </div>
 ) : (
 notifications.map((n) => {
 const cfg = typeConfig[n.type] || typeConfig.overdue_task
 const Icon = cfg.icon
 return (
 <Link
 key={n.id}
 href={n.href}
 onClick={() => {
     setOpen(false)
     if (n.id.startsWith('db-')) {
         markNotificationRead(n.id)
         setNotifications(prev => prev.filter(x => x.id !== n.id))
     }
 }}
 className="flex items-start gap-3 px-4 py-3 hover:bg-surface-container-high transition-all duration-200 group"
 >
 <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.className)}>
 <Icon className="w-4 h-4" />
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
 {n.title}
 </p>
 <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
 {n.description}
 </p>
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
