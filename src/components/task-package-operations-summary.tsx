// Package action results will receive generated Supabase types in the schema-typing pass.
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Calendar, CheckCircle2, Clock, Loader2, MapPin, Truck, Video } from 'lucide-react'
import { getPackageDetailsForProject } from '@/app/admin/packages/actions'

interface PackageSummaryLogistics {
  location_address?: string
  shoot_date?: string
  start_time?: string
  end_time?: string
  assigned_staff_ids?: string[]
  revision_count?: number
}

interface PackageSummaryPostProd {
  editing_location?: string
  editing_date?: string
  editing_start_time?: string
  editing_end_time?: string
  assigned_editor_ids?: string[]
}

interface PackageSummaryEmployee {
  id: string
  full_name: string
}

interface PackageSummaryDeliverable {
  id: string
  title: string
}

interface PackageSummaryResult {
  logistics?: PackageSummaryLogistics
  postProd?: PackageSummaryPostProd
  employees?: PackageSummaryEmployee[]
  deliverables?: PackageSummaryDeliverable[]
  error?: string
}

export function TaskPackageOperationsSummary({ projectId, phase }: { projectId: string, phase: string }) {
  const [data, setData] = useState<PackageSummaryResult | null>(null)
  const [loading, setLoading] = useState(phase === 'Phase 2' || phase === 'Phase 3')

  const loadSummary = useCallback(async () => {
    if (phase !== 'Phase 2' && phase !== 'Phase 3') return
    setLoading(true)
    const result = await getPackageDetailsForProject(projectId)
    setData('error' in result ? null : result)
    setLoading(false)
  }, [phase, projectId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSummary()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadSummary])

  if (phase !== 'Phase 2' && phase !== 'Phase 3') return null
  if (loading) return <div className="mt-3 flex items-center gap-2 text-xs text-on-surface-variant"><Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Loading package operations…</div>
  if (!data) return null

  const logistics = data.logistics || {}
  const postProduction = data.postProd || {}
  const employees = data.employees || []
  const people = phase === 'Phase 2' ? logistics.assigned_staff_ids || [] : postProduction.assigned_editor_ids || []
  const names = people.map((id: string) => employees.find((employee: PackageSummaryEmployee) => employee.id === id)?.full_name).filter(Boolean)
  const location = phase === 'Phase 2' ? logistics.location_address : postProduction.editing_location
  const date = phase === 'Phase 2' ? logistics.shoot_date : postProduction.editing_date
  const start = phase === 'Phase 2' ? logistics.start_time : postProduction.editing_start_time
  const end = phase === 'Phase 2' ? logistics.end_time : postProduction.editing_end_time
  const hasContent = location || date || start || end || names.length > 0 || (phase === 'Phase 2' ? (logistics.revision_count ?? 0) > 0 : (data.deliverables?.length ?? 0) > 0)
  if (!hasContent) return null

  return <div className="mt-4 rounded-lg border border-outline-variant/60 bg-surface-container-low p-3"><h4 className="flex items-center gap-2 text-xs font-semibold text-foreground">{phase === 'Phase 2' ? <Truck className="h-4 w-4 text-primary" /> : <Video className="h-4 w-4 text-primary" />}{phase === 'Phase 2' ? 'Videography & on-site logistics' : 'Editing & deliverable hub'}</h4><div className="mt-2 grid grid-cols-1 gap-2 text-xs text-on-surface-variant sm:grid-cols-2">{location && <span className="flex min-w-0 items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="truncate">{location}</span></span>}{date && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary" />{date}</span>}{(start || end) && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" />{start || '?'} – {end || '?'}</span>}{names.length > 0 && <span className="flex min-w-0 items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="truncate">{names.join(', ')}</span></span>}{phase === 'Phase 2' && (logistics.revision_count ?? 0) > 0 && <span>{logistics.revision_count} extra site visit{logistics.revision_count === 1 ? '' : 's'}</span>}{phase === 'Phase 3' && (data.deliverables?.length ?? 0) > 0 && <span>{data.deliverables!.length} deliverable{data.deliverables!.length === 1 ? '' : 's'}</span>}</div></div>
}
