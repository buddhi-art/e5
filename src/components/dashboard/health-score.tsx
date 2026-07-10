import { cn } from '@/lib/utils'

export function HealthScore({ score }: { score: number }) {
    const radius = 36
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (Math.min(score, 100) / 100) * circumference

    const color =
        score >= 80
            ? 'stroke-tertiary'
            : score >= 60
                ? 'stroke-primary'
                : score >= 40
                    ? 'stroke-primary'
                    : 'stroke-error'
    const labelColor =
        score >= 80
            ? 'text-m3-success'
            : score >= 60
                ? 'text-m3-warning'
                : score >= 40
                    ? 'text-primary'
                    : 'text-m3-error'
    const bgColor =
        score >= 80
            ? 'text-m3-success/20'
            : score >= 60
                ? 'text-m3-warning/20'
                : score >= 40
                    ? 'text-primary/20'
                    : 'text-m3-error/20'

    return (
        <div className="flex flex-col items-center morph-scale-in">
            <div className="relative w-24 h-24">
                <svg
                    className="w-24 h-24 -rotate-90"
                    viewBox="0 0 80 80"
                >
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="5"
                        className={bgColor}
                    />
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="5"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className={cn(color, 'transition-all duration-1000 ease-out')}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn('text-xl font-bold', labelColor)}>
                        {Math.round(score)}%
                    </span>
                </div>
            </div>
            <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider mt-1">
                Health
            </span>
        </div>
    )
}
