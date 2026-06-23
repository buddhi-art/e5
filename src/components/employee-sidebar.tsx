'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Film, LayoutDashboard, CalendarCheck, Wallet, CalendarOff, Clock, Camera, Users2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'

const employeeLinks = [
  { name: 'My Tasks', href: '/employee', icon: LayoutDashboard },
  { name: 'Attendance', href: '/employee/attendance', icon: CalendarCheck },
  { name: 'Timesheets', href: '/employee/timesheets', icon: Clock },
  { name: 'Leave', href: '/employee/leave', icon: CalendarOff },
  { name: 'Expenses', href: '/employee/expenses', icon: Wallet },
  { name: 'Equipment', href: '/employee/equipment', icon: Camera },
  { name: 'Talent Directory', href: '/employee/talents', icon: Users2 },
]

export function EmployeeSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full text-zinc-700 dark:text-zinc-300">
      <div className="p-6 flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800/50">
        <div className="w-8 h-8 bg-gradient-to-tr from-sky-500 to-orange-400 text-zinc-900 dark:text-white rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.3)]">
          <Film className="w-4 h-4" />
        </div>
        <span className="font-bold text-zinc-900 dark:text-white text-lg tracking-tight">Employee Portal</span>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {employeeLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`) && link.href !== '/employee'
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
                isActive
                  ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium border border-sky-500/20"
                  : "hover:bg-white dark:bg-zinc-900 hover:text-zinc-900 dark:text-white"
              )}
            >
              <link.icon className={cn("w-5 h-5", isActive ? "text-sky-600 dark:text-sky-400" : "text-zinc-600 dark:text-zinc-400")} />
              {link.name}
            </Link>
          )
        })}
      </div>
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/50 flex justify-end">
        <ThemeToggle />
      </div>
    </div>
  )
}
