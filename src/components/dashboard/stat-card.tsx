import Link from 'next/link'
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from './animated-number'
import type { LucideIcon } from 'lucide-react'

export const colorMap = {
    primary: {
        bg: 'bg-primary-container',
        text: 'text-primary',
        badge: 'bg-primary/10 text-primary',
        ring: 'hover:ring-primary/30',
    },
    tertiary: {
        bg: 'bg-tertiary-container',
        text: 'text-tertiary',
        badge: 'bg-tertiary/10 text-tertiary',
        ring: 'hover:ring-tertiary/30',
    },
    secondary: {
        bg: 'bg-secondary-container',
        text: 'text-secondary',
        badge: 'bg-secondary/10 text-secondary',
        ring: 'hover:ring-secondary/30',
    },
    error: {
        bg: 'bg-error-container',
        text: 'text-destructive',
        badge: 'bg-destructive/10 text-destructive',
        ring: 'hover:ring-destructive/30',
    },
    emerald: {
        bg: 'bg-m3-success-subtle',
        text: 'text-m3-success',
        badge: 'bg-m3-success/10 text-m3-success',
        ring: 'hover:ring-tertiary/30',
    },
    amber: {
        bg: 'bg-m3-warning-subtle',
        text: 'text-m3-warning',
        badge: 'bg-m3-warning/10 text-m3-warning',
        ring: 'hover:ring-primary/30',
    },
} as const

export type StatCardColor = keyof typeof colorMap

export interface StatCardProps {
    label: string
    value: number
    icon: LucideIcon
    href: string
    color: StatCardColor
    trend?: { direction: 'up' | 'down' | 'neutral'; text: string }
    suffix?: string
    decimals?: number
    subtitle?: string
    delay?: number
}

export function StatCard({
    label,
    value,
    icon: Icon,
    href,
    color,
    trend,
    suffix = '',
    decimals = 0,
    subtitle,
    delay = 0,
}: StatCardProps) {
    const c = colorMap[color]
    return (
        <Link
            href={href}
            className="group block morph-fade-in"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div
                className={cn(
                    'relative overflow-hidden rounded-2xl bg-surface-container-lowest p-4 card-morph',
                    'ring-1 ring-outline-variant/40',
                    c.ring,
                )}
            >
                <div className="flex items-start justify-between mb-2">
                    <div
                        className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center',
                            c.bg,
                        )}
                    >
                        <Icon className={cn('w-4.5 h-4.5 icon-morph', c.text)} />
                    </div>
                    {trend && (
                        <span
                            className={cn(
                                'inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                                c.badge,
                            )}
                        >
                            {trend.direction === 'up' ? (
                                <TrendingUp className="w-2.5 h-2.5" />
                            ) : trend.direction === 'down' ? (
                                <TrendingDown className="w-2.5 h-2.5" />
                            ) : (
                                <Minus className="w-2.5 h-2.5" />
                            )}
                            {trend.text}
                        </span>
                    )}
                </div>
                <div className="text-2xl font-bold text-foreground tracking-tight">
                    <AnimatedNumber
                        value={value}
                        suffix={suffix}
                        decimals={decimals}
                    />
                </div>
                <div className="text-xs text-on-surface-variant mt-0.5 font-medium truncate">
                    {label}
                </div>
                {subtitle && (
                    <div className="text-[10px] text-outline mt-0.5">{subtitle}</div>
                )}
                <div className="mt-2 flex items-center gap-1 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className={c.text}>View details</span>
                    <ArrowRight className={cn('w-2.5 h-2.5', c.text)} />
                </div>
            </div>
        </Link>
    )
}
