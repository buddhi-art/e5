'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Film, LayoutDashboard, Users, UserSquare2, FolderKanban, CalendarCheck, CheckSquare, Receipt, Wallet, CalendarOff, Clock, Camera, ArrowRightLeft, ClipboardCheck, PenTool, CalendarRange, Users2, DollarSign, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'

const adminLinks = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Employees', href: '/admin/employees', icon: Users },
  { name: 'Clients', href: '/admin/clients', icon: UserSquare2 },
  { name: 'Projects', href: '/admin/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/admin/tasks', icon: CheckSquare },
  { name: 'Timesheets', href: '/admin/timesheets', icon: Clock },
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

const talentLinks = [
  { name: 'Directory', href: '/admin/talents', icon: Users2 },
  { name: 'Bookings', href: '/admin/talents/bookings', icon: CalendarRange },
]

export function AdminSidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    if (pathname === href) return true

    // Special cases where a base route has separate navigation items that shouldn't highlight the base route
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

  function renderLink(name: string, href: string, Icon: any) {
    const active = isActive(href)
    return (
      <Link
        key={name}
        href={href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ml-2",
          active
            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium border border-sky-500/20"
            : "hover:bg-white dark:bg-zinc-900 hover:text-zinc-900 dark:text-white"
        )}
      >
        <Icon className={cn("w-5 h-5", active ? "text-sky-600 dark:text-sky-400" : "text-zinc-600 dark:text-zinc-400")} />
        {name}
      </Link>
    )
  }

  return (
    <div className="w-64 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full text-zinc-700 dark:text-zinc-300">
      <div className="p-6 flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800/50">
        <div className="w-8 h-8 bg-gradient-to-tr from-sky-500 to-orange-400 text-zinc-900 dark:text-white rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.3)]">
          <Film className="w-4 h-4" />
        </div>
        <span className="font-bold text-zinc-900 dark:text-white text-lg tracking-tight">Admin Portal</span>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {adminLinks.map((link) => {
          const active = isActive(link.href)
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
                active
                  ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium border border-sky-500/20"
                  : "hover:bg-white dark:bg-zinc-900 hover:text-zinc-900 dark:text-white"
              )}
            >
              <link.icon className={cn("w-5 h-5", active ? "text-sky-600 dark:text-sky-400" : "text-zinc-600 dark:text-zinc-400")} />
              {link.name}
            </Link>
          )
        })}

        {/* Finance Section */}
        <div className="pt-4 pb-1">
          <div className="flex items-center gap-2 px-3 py-1">
            <Wallet className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Finance</span>
          </div>
        </div>
        {financeLinks.map((link) => (
          renderLink(link.name, link.href, link.icon)
        ))}

        {/* Equipment Section */}
        <div className="pt-4 pb-1">
          <div className="flex items-center gap-2 px-3 py-1">
            <Camera className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Equipment</span>
          </div>
        </div>
        {equipmentLinks.map((link) => (
          renderLink(link.name, link.href, link.icon)
        ))}

        {/* Production Section */}
        <div className="pt-4 pb-1">
          <div className="flex items-center gap-2 px-3 py-1">
            <CalendarRange className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Production</span>
          </div>
        </div>
        {renderLink('Calendar', '/admin/calendar', CalendarRange)}

        {/* Client Meetings */}
        <div className="pt-4 pb-1">
          <div className="flex items-center gap-2 px-3 py-1">
            <CalendarDays className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Client Meetings</span>
          </div>
        </div>
        {renderLink('All Meetings', '/admin/clients/meetings', CalendarDays)}

        {/* Talent Section */}
        <div className="pt-4 pb-1">
          <div className="flex items-center gap-2 px-3 py-1">
            <Users2 className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Talent</span>
          </div>
        </div>
        {talentLinks.map((link) => (
          renderLink(link.name, link.href, link.icon)
        ))}
      </div>
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/50 flex justify-end">
        <ThemeToggle />
      </div>
    </div>
  )
}
