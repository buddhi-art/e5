import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { colorMap, type StatCardColor } from './stat-card'

export function QuickAction({
  label,
  href,
  icon: Icon,
  color,
}: {
  label: string
  href: string
  icon: LucideIcon
  color: StatCardColor
}) {
  const c = colorMap[color]
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 card-morph group',
        'bg-surface-container-high hover:bg-primary-container',
        'ring-1 ring-outline-variant/30 hover:ring-primary/30',
      )}
    >
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', c.bg)}>
        <Icon className={cn('w-4.5 h-4.5 icon-morph', c.text)} />
      </div>
      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
        {label}
      </span>
      <ArrowRight className={cn('w-4 h-4 ml-auto text-on-surface-variant group-hover:text-primary transition-colors')} />
    </Link>
  )
}