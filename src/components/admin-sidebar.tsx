'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Film, LayoutDashboard, Users, UserSquare2, FolderKanban,
  CalendarCheck, CheckSquare, Receipt, Wallet, CalendarOff,
  Camera, ArrowRightLeft, ClipboardCheck, PenTool,
  CalendarRange, Users2, CalendarDays, ChevronDown, ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'
import { useState } from 'react'

const adminLinks = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Employees', href: '/admin/employees', icon: Users },
  { name: 'Clients', href: '/admin/clients', icon: UserSquare2 },
  { name: 'Projects', href: '/admin/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/admin/tasks', icon: CheckSquare },
  { name: 'Kanban', href: '/admin/kanban', icon: ArrowRightLeft },
  { name: 'Attendance', href: '/admin/attendance', icon: CalendarCheck },
  { name: 'Leave', href: '/admin/leave', icon: CalendarOff },
]

const financeLinks = [
  { name: 'Invoices', href: '/admin/invoices', icon: Receipt },
  { name: 'Expenses', href: '/admin/expenses', icon: Wallet },
]

const equipmentLinks = [
  { name: 'All Equipment', href: '/admin/equipment', icon: Camera },
  { name: 'Check Out', href: '/admin/equipment/checkout', icon: ArrowRightLeft },
  { name: 'Check In', href: '/admin/equipment/checkin', icon: ClipboardCheck },
  { name: 'Maintenance', href: '/admin/equipment/maintenance', icon: PenTool },
]

interface SectionState {
  finance: boolean
  equipment: boolean
  production: boolean
  meetings: boolean
  talent: boolean
}

export function AdminSidebar({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname()

  const [sections, setSections] = useState<SectionState>({
    finance: true,
    equipment: true,
    production: true,
    meetings: true,
    talent: true,
  })

  function toggleSection(key: keyof SectionState) {
    setSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    if (pathname === href) return true
    if (href === '/admin/equipment') {
      if (pathname.startsWith('/admin/equipment/checkout') ||
        pathname.startsWith('/admin/equipment/checkin') ||
        pathname.startsWith('/admin/equipment/maintenance')) {
        return false
      }
    }
    if (href === '/admin/talents') {
      if (pathname.startsWith('/admin/talents/bookings')) {
        return false
      }
    }
    return pathname.startsWith(href + '/')
  }

  function renderSectionCollapsible(
    label: string,
    icon: any,
    sectionKey: keyof SectionState,
    children: React.ReactNode
  ) {
    const isOpen = sections[sectionKey]
    const Icon = icon
    return (
      <div className="pt-4">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-outline hover:text-foreground transition-all duration-200 btn-morph"
        >
          <span className="flex items-center gap-2">
            <Icon className="w-3 h-3" />
            {label}
          </span>
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {isOpen && <div className="mt-1 space-y-0.5 overflow-hidden">{children}</div>}
      </div>
    )
  }

  return (
    <div className="w-64 bg-surface-container-low border-r border-outline-variant flex flex-col h-full">
      {/* Brand header */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-outline-variant/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-sm">
          <Film className="w-5 h-5" />
        </div>
        <div>
          <span className="font-semibold text-base tracking-tight text-foreground block leading-tight">E5 Chronicles</span>
          <span className="text-[11px] text-on-surface-variant font-medium">Admin Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5 scrollbar-premium">
        {adminLinks.map((link) => {
          const active = isActive(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 nav-morph",
                active
                  ? "bg-primary-container text-on-primary-container font-medium shadow-sm"
                  : "hover:bg-surface-container-high text-on-surface-variant hover:text-foreground"
              )}
            >
              <div className={cn(
                "w-5 h-5 flex items-center justify-center shrink-0 transition-colors duration-200",
                active ? "text-primary" : "text-on-surface-variant"
              )}>
                <link.icon className="w-4.5 h-4.5" />
              </div>
              <span className={cn("text-sm", active && "font-semibold")}>{link.name}</span>
            </Link>
          )
        })}

        {renderSectionCollapsible('Finance', Wallet, 'finance',
          financeLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 nav-morph ml-2",
                  active
                    ? "bg-primary-container text-on-primary-container font-medium"
                    : "hover:bg-surface-container-high text-on-surface-variant hover:text-foreground"
                )}
              >
                <link.icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-on-surface-variant")} />
                <span className="text-sm">{link.name}</span>
              </Link>
            )
          })
        )}

        {renderSectionCollapsible('Equipment', Camera, 'equipment',
          equipmentLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 nav-morph ml-2",
                  active
                    ? "bg-primary-container text-on-primary-container font-medium"
                    : "hover:bg-surface-container-high text-on-surface-variant hover:text-foreground"
                )}
              >
                <link.icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-on-surface-variant")} />
                <span className="text-sm">{link.name}</span>
              </Link>
            )
          })
        )}

        {renderSectionCollapsible('Production', CalendarRange, 'production',
          <Link
            href="/admin/calendar"
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 nav-morph ml-2",
              isActive('/admin/calendar')
                ? "bg-primary-container text-on-primary-container font-medium"
                : "hover:bg-surface-container-high text-on-surface-variant hover:text-foreground"
            )}
          >
            <CalendarRange className="w-4 h-4 shrink-0" />
            <span className="text-sm">Calendar</span>
          </Link>
        )}

        {renderSectionCollapsible('Client Meetings', CalendarDays, 'meetings',
          <Link
            href="/admin/clients/meetings"
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 nav-morph ml-2",
              isActive('/admin/clients/meetings')
                ? "bg-primary-container text-on-primary-container font-medium"
                : "hover:bg-surface-container-high text-on-surface-variant hover:text-foreground"
            )}
          >
            <CalendarDays className="w-4 h-4 shrink-0" />
            <span className="text-sm">All Meetings</span>
          </Link>
        )}

        {renderSectionCollapsible('Talent', Users2, 'talent',
          <>
            <Link
              href="/admin/talents"
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 nav-morph ml-2",
                isActive('/admin/talents') && !pathname.includes('/bookings')
                  ? "bg-primary-container text-on-primary-container font-medium"
                  : "hover:bg-surface-container-high text-on-surface-variant hover:text-foreground"
              )}
            >
              <Users2 className="w-4 h-4 shrink-0" />
              <span className="text-sm">Directory</span>
            </Link>
            <Link
              href="/admin/talents/bookings"
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 nav-morph ml-2",
                isActive('/admin/talents/bookings')
                  ? "bg-primary-container text-on-primary-container font-medium"
                  : "hover:bg-surface-container-high text-on-surface-variant hover:text-foreground"
              )}
            >
              <CalendarRange className="w-4 h-4 shrink-0" />
              <span className="text-sm">Bookings</span>
            </Link>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-outline-variant/50 flex items-center justify-between">
        <ThemeToggle />
        <span className="text-[10px] text-outline font-semibold tracking-[0.08em] uppercase">v2.0</span>
      </div>
    </div>
  )
}
