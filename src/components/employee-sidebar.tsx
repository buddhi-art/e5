'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Film, LayoutDashboard, CalendarCheck, Wallet, CalendarOff, Camera, Users2, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'

const employeeLinks = [
  { name: 'My Tasks', href: '/employee', icon: LayoutDashboard },
  { name: 'Attendance', href: '/employee/attendance', icon: CalendarCheck },
  { name: 'Leave', href: '/employee/leave', icon: CalendarOff },
  { name: 'Expenses', href: '/employee/expenses', icon: Wallet },
  { name: 'Equipment', href: '/employee/equipment', icon: Camera },
  { name: 'Talent Directory', href: '/employee/talents', icon: Users2 },
  { name: 'My Profile', href: '/employee/profile', icon: UserCircle },
]

export function EmployeeSidebar({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/employee') return pathname === '/employee'
    return pathname === href || pathname.startsWith(`${href}/`)
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
          <span className="text-[11px] text-on-surface-variant font-medium">Employee Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5 scrollbar-premium">
        {employeeLinks.map((link) => {
          const active = isActive(link.href)
          return (
            <Link
              key={link.name}
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
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-outline-variant/50 flex items-center justify-between">
        <ThemeToggle />
        <span className="text-[10px] text-outline font-semibold tracking-[0.08em] uppercase">Employee</span>
      </div>
    </div>
  )
}
