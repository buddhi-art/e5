'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getEmployeeKpiBreakdown } from '@/app/admin/employees/kpi-actions'
import { cn } from '@/lib/utils'
import { Gauge, CalendarCheck, CheckSquare, Clock, History } from 'lucide-react'

interface KpiBreakdown {
 total_score: number
 attendance: { score: number; max: number; records: number; weighted_pct: number }
 task_completion: { score: number; max: number; completed: number; total: number }
 punctuality: { score: number; max: number; on_time: number; completed_with_deadline: number }
 snapshot_history: { period: string; score: number; computed_at: string }[]
}

function ScoreRing({ score, size = 80, strokeWidth = 6 }: { score: number; size?: number; strokeWidth?: number }) {
 const radius = (size - strokeWidth) / 2
 const circumference = 2 * Math.PI * radius
 const offset = circumference - (Math.min(score, 100) / 100) * circumference
 const color = score >= 80 ? 'stroke-tertiary' :
 score >= 60 ? 'stroke-primary' :
 score >= 40 ? 'stroke-primary' : 'stroke-error'
 const labelColor = score >= 80 ? 'text-m3-success' :
 score >= 60 ? 'text-m3-warning' :
 score >= 40 ? 'text-m3-warning' : 'text-m3-error'

 return (
 <div className="relative inline-flex items-center justify-center">
 <svg width={size} height={size} className="-rotate-90">
 <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth}
 className="text-outline-variant" />
 <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth}
 strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
 className={cn(color, 'transition-all duration-1000 ease-out')} />
 </svg>
 <div className="absolute inset-0 flex items-center justify-center">
 <span className={cn('text-lg font-bold', labelColor)}>{Math.round(score)}</span>
 </div>
 </div>
 )
}

function SubScoreBar({ label, score, max, icon: Icon, color }: { label: string; score: number; max: number; icon: any; color: string }) {
 const pct = max > 0 ? Math.min(Math.round((score / max) * 100), 100) : 0
 const barColor = pct >= 80 ? 'bg-m3-success' : pct >= 60 ? 'bg-m3-warning' : 'bg-m3-error'

 return (
 <div className="space-y-1">
 <div className="flex items-center justify-between text-xs">
 <span className="flex items-center gap-1.5 text-on-surface">
 <Icon className={cn('w-3.5 h-3.5', color)} />
 {label}
 </span>
 <span className="font-medium text-on-surface">{score.toFixed(1)}/{max}</span>
 </div>
 <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
 <div className={cn('h-full rounded-full transition-all duration-700', barColor)} style={{ width: `${pct}%` }} />
 </div>
 </div>
 )
}

export function EmployeeKpiCard({ employeeId }: { employeeId: string }) {
 const [breakdown, setBreakdown] = useState<KpiBreakdown | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 useEffect(() => {
 async function fetchKpi() {
 setLoading(true)
 const result = await getEmployeeKpiBreakdown(employeeId)
 if (result.error) {
 setError(result.error)
 } else if (result.data) {
 setBreakdown(result.data as unknown as KpiBreakdown)
 }
 setLoading(false)
 }
 fetchKpi()
 }, [employeeId])

 if (loading) {
 return (
 <Card className="bg-surface-container-lowest dark:bg-surface-container-lowest/50 border-outline-variant" >
 <CardHeader>
 <CardTitle className="text-on-surface text-lg flex items-center gap-2">
 <Gauge className="w-5 h-5 text-primary" /> KPI Score
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex items-center justify-center py-8 text-outline dark:text-outline">
 <div className="animate-pulse">Loading KPI data...</div>
 </div>
 </CardContent>
 </Card>
 )
 }

 if (error) {
 return (
 <Card className="bg-surface-container-lowest dark:bg-surface-container-lowest/50 border-outline-variant" >
 <CardHeader>
 <CardTitle className="text-on-surface text-lg flex items-center gap-2">
 <Gauge className="w-5 h-5 text-primary" /> KPI Score
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-center py-4 text-outline dark:text-outline text-sm">
 Unable to load KPI data
 </div>
 </CardContent>
 </Card>
 )
 }

 if (!breakdown) return null

 const totalScore = breakdown.total_score

 return (
 <Card className="bg-surface-container-lowest dark:bg-surface-container-lowest/50 border-outline-variant" >
 <CardHeader className="pb-3">
 <CardTitle className="text-on-surface text-lg flex items-center gap-2">
 <Gauge className="w-5 h-5 text-primary" /> KPI Score
 </CardTitle>
 <CardDescription className="text-on-surface-variant">
 Last 30 days performance
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-5">
 {/* Total Score Ring */}
 <div className="flex justify-center">
 <ScoreRing score={totalScore} size={100} strokeWidth={8} />
 </div>

 {/* Sub-scores */}
 <div className="space-y-3">
 <SubScoreBar
 label="Attendance"
 score={breakdown.attendance.score}
 max={breakdown.attendance.max}
 icon={CalendarCheck}
 color="text-primary"
 />
 <SubScoreBar
 label="Task Completion"
 score={breakdown.task_completion.score}
 max={breakdown.task_completion.max}
 icon={CheckSquare}
 color="text-m3-success"
 />
 <SubScoreBar
 label="Punctuality"
 score={breakdown.punctuality.score}
 max={breakdown.punctuality.max}
 icon={Clock}
 color="text-m3-warning"
 />
 </div>

 {/* Counts row */}
 <div className="grid grid-cols-3 gap-2 text-center text-xs">
 <div className="bg-surface-container-high dark:bg-surface-container/50 rounded-lg p-2">
 <div className="font-bold text-on-surface">{breakdown.attendance.records}</div>
 <div className="text-outline dark:text-outline">Attendance Records</div>
 </div>
 <div className="bg-surface-container-high dark:bg-surface-container/50 rounded-lg p-2">
 <div className="font-bold text-on-surface">{breakdown.task_completion.completed}/{breakdown.task_completion.total}</div>
 <div className="text-outline dark:text-outline">Tasks Done</div>
 </div>
 <div className="bg-surface-container-high dark:bg-surface-container/50 rounded-lg p-2">
 <div className="font-bold text-on-surface">{breakdown.punctuality.on_time}/{breakdown.punctuality.completed_with_deadline}</div>
 <div className="text-outline dark:text-outline">On Time</div>
 </div>
 </div>

 {/* Snapshot history */}
 {breakdown.snapshot_history && breakdown.snapshot_history.length > 0 && (
 <div className="pt-3 border-t border-outline-variant /50">
 <div className="flex items-center gap-1.5 text-xs text-outline dark:text-outline mb-2">
 <History className="w-3.5 h-3.5" />
 Monthly History
 </div>
 <div className="space-y-1.5">
 {breakdown.snapshot_history.map((snap) => (
 <div key={snap.period} className="flex items-center justify-between text-xs">
 <span className="text-on-surface-variant">{snap.period}</span>
 <span className={cn(
 'font-medium',
 snap.score >= 80 ? 'text-m3-success' :
 snap.score >= 60 ? 'text-m3-warning' : 'text-m3-error'
 )}>
 {Math.round(snap.score)}
 </span>
 </div>
 ))}
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 )
}
