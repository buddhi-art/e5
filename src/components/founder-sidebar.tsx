'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Film, LayoutDashboard, FolderKanban, DollarSign, Camera, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'

const founderLinks = [
    { name: 'Dashboard', href: '/founder', icon: LayoutDashboard },
    { name: 'Projects', href: '/founder/projects', icon: FolderKanban },
    { name: 'Finances', href: '/founder/finances', icon: DollarSign },
    { name: 'Resources', href: '/founder/resources', icon: Camera },
]

export function FounderSidebar({ onItemClick }: { onItemClick?: () => void }) {
    const pathname = usePathname()

    function isActive(href: string) {
        if (href === '/founder') return pathname === '/founder'
        return pathname.startsWith(href)
    }

    return (
        <div className="w-64 bg-surface-container-low border-r border-outline-variant flex flex-col h-full">
            {/* Brand header */}
            <div className="px-5 py-5 flex items-center gap-3 border-b border-outline-variant/50">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 text-amber-950 flex items-center justify-center shadow-sm">
                    <Shield className="w-5 h-5" />
                </div>
                <div>
                    <span className="font-semibold text-base tracking-tight text-foreground block leading-tight">E5 Chronicles</span>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Founder Portal</span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5 scrollbar-premium">
                {founderLinks.map((link) => {
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
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-outline-variant/50 flex items-center justify-between">
                <ThemeToggle />
                <span className="text-[10px] text-outline font-semibold tracking-[0.08em] uppercase">v2.0</span>
            </div>
        </div>
    )
}
