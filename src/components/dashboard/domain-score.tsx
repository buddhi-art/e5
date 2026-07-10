import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MiniProgress } from './mini-progress'

export function DomainScore({
  label,
  score = 0,
  max = 0,
  icon: Icon,
}: {
  label: string
  score?: number
  max?: number
  icon: LucideIcon
}) {
  const pct = max > 0 ? Math.min(Math.round((score / max) * 100), 100) : 0
  const color = pct >= 80 ? 'emerald' : pct >= 60 ? 'amber' : 'red'
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-container-high card-morph">
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
          color === 'emerald'
            ? 'bg-m3-success-subtle text-m3-success'
            : color === 'amber'
              ? 'bg-m3-warning-subtle text-m3-warning'
              : 'bg-m3-error-subtle text-m3-error',
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-foreground truncate">{label}</span>
          <span
            className={cn(
              'text-xs font-bold',
              color === 'emerald'
                ? 'text-m3-success'
                : color === 'amber'
                  ? 'text-m3-warning'
                  : 'text-m3-error',
            )}
          >
            {max > 0 ? `${score}/${max}` : 'N/A'}
          </span>
        </div>
        <MiniProgress value={score} max={max} color={color} />
      </div>
    </div>
  )
}