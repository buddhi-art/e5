import { cn } from '@/lib/utils'

type ProgressColor = 'primary' | 'emerald' | 'amber' | 'red' | 'tertiary'

const colorClasses: Record<ProgressColor, string> = {
  primary: 'bg-primary',
  emerald: 'bg-m3-success',
  amber: 'bg-m3-warning',
  red: 'bg-m3-error',
  tertiary: 'bg-tertiary',
}

export function MiniProgress({ value, max, color = 'primary' }: { value: number; max: number; color?: ProgressColor }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-700', colorClasses[color])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}