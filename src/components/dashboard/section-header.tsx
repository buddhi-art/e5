import type { LucideIcon } from 'lucide-react'

export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary-container text-primary flex items-center justify-center shadow-sm">
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-on-surface-variant">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}