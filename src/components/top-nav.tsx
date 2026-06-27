'use client'

import { logout } from '@/app/actions/auth'
import { ChangePasscodeDialog } from '@/components/change-passcode-dialog'
import { NotificationDropdown } from '@/components/notification-dropdown'
import { LogOut, Menu } from 'lucide-react'

export function TopNav({
  userEmail,
  title = "Admin Portal",
  onMenuClick
}: {
  userEmail: string
  title?: string
  onMenuClick?: () => void
}) {
  return (
    <header className="h-16 bg-surface-container border-b border-outline-variant/50 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 elevation-1">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        {onMenuClick ? (
          <button
            onClick={onMenuClick}
            className="lg:hidden inline-flex items-center justify-center rounded-lg w-9 h-9 text-on-surface-variant hover:bg-surface-container-high hover:text-foreground transition-all duration-200 btn-morph"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
            className="lg:hidden inline-flex items-center justify-center rounded-lg w-9 h-9 text-on-surface-variant hover:bg-surface-container-high hover:text-foreground transition-all duration-200 btn-morph"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center lg:hidden shadow-sm">
            <span className="text-xs font-bold tracking-tight">E5</span>
          </div>
          <h1 className="font-medium text-foreground text-sm lg:text-base tracking-tight">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5 lg:gap-2.5">
        <NotificationDropdown />

        <span className="hidden sm:inline text-sm text-on-surface-variant truncate max-w-[120px] lg:max-w-[180px] border-r border-outline-variant/50 pr-3 mr-1">
          {userEmail}
        </span>

        <ChangePasscodeDialog />

        <form action={logout}>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 h-8 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-foreground transition-all duration-200 btn-morph"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </form>
      </div>
    </header>
  )
}
