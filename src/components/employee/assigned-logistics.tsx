import { Video, Scissors, MapPin, Calendar, Clock, Camera, Truck } from 'lucide-react'

export interface AssignedLogisticsItem {
  kind: 'shoot' | 'editing'
  id: string
  packageId: string
  packageNumber: string | null
  packageTitle: string
  clientName: string
  date: string | null
  startTime: string | null
  endTime: string | null
  location: string | null
  locations: string[]
  equipment: string[]
  vehicles: string[]
  notes: string | null
}

function formatDate(date: string | null): string {
  if (!date) return 'Date TBD'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function timeRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null
  return `${start || '?'} – ${end || '?'}`
}

function isMapsLink(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function LogisticsCard({ item }: { item: AssignedLogisticsItem }) {
  const isShoot = item.kind === 'shoot'
  const Icon = isShoot ? Video : Scissors
  const accent = isShoot
    ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30'
    : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
  const range = timeRange(item.startTime, item.endTime)

  return (
    <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4 sm:p-5 elevation-1 card-morph">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${accent}`}>
              <Icon className="h-3.5 w-3.5" />
              {isShoot ? 'Videography shoot' : 'Editing session'}
            </span>
            {item.packageNumber && (
              <span className="text-[11px] font-mono text-on-surface-variant">#{item.packageNumber}</span>
            )}
          </div>
          <h3 className="mt-2 truncate text-base font-semibold text-foreground">
            {item.clientName} — {item.packageTitle}
          </h3>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Calendar className="h-4 w-4 shrink-0 text-primary" />
          <span>{formatDate(item.date)}</span>
        </div>
        {range && (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            <span>{range}</span>
          </div>
        )}
        {item.location && (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant sm:col-span-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            {isMapsLink(item.location) ? (
              <a href={item.location} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">
                Open location link
              </a>
            ) : (
              <span className="truncate">{item.location}</span>
            )}
          </div>
        )}
      </div>

      {(item.equipment.length > 0 || item.vehicles.length > 0) && (
        <div className="mt-3 flex flex-col gap-2 border-t border-outline-variant/40 pt-3">
          {item.equipment.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-on-surface-variant">
              <Camera className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{item.equipment.join(', ')}</span>
            </div>
          )}
          {item.vehicles.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-on-surface-variant">
              <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{item.vehicles.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {item.notes && (
        <p className="mt-3 whitespace-pre-wrap border-t border-outline-variant/40 pt-3 text-xs text-on-surface-variant">
          {item.notes}
        </p>
      )}
    </div>
  )
}

export function AssignedLogistics({ items }: { items: AssignedLogisticsItem[] }) {
  if (items.length === 0) return null

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {items.map((item, i) => (
        <div key={item.id} className="morph-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
          <LogisticsCard item={item} />
        </div>
      ))}
    </div>
  )
}
