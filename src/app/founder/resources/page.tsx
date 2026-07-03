import { createClient } from '@/lib/supabase/server'
import { Camera, CheckCircle, Clock, AlertTriangle, User, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export const revalidate = 300

export default async function FounderResourcesPage() {
 const supabase = await createClient()

 // ── Equipment ──
 const { data: equipment, error: eqError } = await supabase
 .from('equipment')
 .select('*')
 .is('deleted_at', null)
 .order('name')

 // ── Active checkouts with employee names and projects ──
 const { data: activeCheckouts } = await supabase
 .from('equipment_checkouts')
 .select(`
 *,
 equipment!inner(name, category),
 profiles!equipment_checkouts_checked_out_by_fkey(full_name),
 projects!left(title)
 `)
 .is('checked_in_at', null)
 .order('checked_out_at', { ascending: false })

 // ── Maintenance records ──
 const { data: maintenanceRecords } = await supabase
 .from('equipment_maintenance')
 .select(`*, equipment!inner(name, category)`)
 .order('scheduled_date', { ascending: false })
 .limit(10)

 // ── Talent directory ──
 const { data: talents } = await supabase
 .from('talents')
 .select('*')
 .eq('is_active', true)
 .order('full_name')

 if (eqError) console.error('Equipment fetch error:', eqError.message)

 const equipmentList = equipment || []
 const available = equipmentList.filter(e => e.status === 'available').length
 const checkedOut = equipmentList.filter(e => e.status === 'checked_out').length
 const inMaintenance = equipmentList.filter(e => e.status === 'maintenance').length

 // Group by category
 const byCategory = new Map<string, typeof equipmentList>()
 for (const eq of equipmentList) {
 const cat = eq.category || 'Other'
 if (!byCategory.has(cat)) byCategory.set(cat, [])
 byCategory.get(cat)!.push(eq)
 }

 return (
 <div className="space-y-8">
 <div className="morph-fade-in">
 <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight flex items-center gap-3">
 <Camera className="w-8 h-8 text-m3-warning" />
 Resources
 </h1>
 <p className="text-base text-on-surface-variant mt-2">
 Equipment status, active checkouts, maintenance, and talent directory.
 </p>
 </div>

 {/* Equipment Summary Cards */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 morph-fade-in morph-delay-2">
 <div className="rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-outline-variant/40 card-morph">
 <div className="w-9 h-9 rounded-xl bg-m3-success-subtle text-m3-success flex items-center justify-center mb-2">
 <Camera className="w-4.5 h-4.5" />
 </div>
 <div className="text-xl font-bold text-foreground">{equipmentList.length}</div>
 <div className="text-xs text-on-surface-variant font-medium">Total Equipment</div>
 </div>
 <div className="rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-outline-variant/40 card-morph">
 <div className="w-9 h-9 rounded-xl bg-m3-success-subtle text-m3-success flex items-center justify-center mb-2">
 <CheckCircle className="w-4.5 h-4.5" />
 </div>
 <div className="text-xl font-bold text-foreground">{available}</div>
 <div className="text-xs text-on-surface-variant font-medium">Available</div>
 </div>
 <div className="rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-outline-variant/40 card-morph">
 <div className="w-9 h-9 rounded-xl bg-m3-warning-subtle text-m3-warning flex items-center justify-center mb-2">
 <User className="w-4.5 h-4.5" />
 </div>
 <div className="text-xl font-bold text-foreground">{checkedOut}</div>
 <div className="text-xs text-on-surface-variant font-medium">Checked Out</div>
 </div>
 <div className="rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-outline-variant/40 card-morph">
 <div className="w-9 h-9 rounded-xl bg-m3-error-subtle text-m3-error flex items-center justify-center mb-2">
 <Wrench className="w-4.5 h-4.5" />
 </div>
 <div className="text-xl font-bold text-foreground">{inMaintenance}</div>
 <div className="text-xs text-on-surface-variant font-medium">In Maintenance</div>
 </div>
 </div>

 {/* Equipment by Category */}
 <section className="morph-fade-in morph-delay-3">
 <div className="rounded-2xl bg-surface-container-lowest ring-1 ring-outline-variant/40 overflow-hidden card-morph">
 <div className="p-5 pb-3">
 <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
 <Camera className="w-4 h-4 text-primary" />
 Equipment Inventory
 </h2>
 </div>
 <div className="divide-y divide-outline-variant/20">
 {Array.from(byCategory.entries()).map(([category, items]) => (
 <div key={category} className="px-5 py-3">
 <div className="flex items-center justify-between mb-2">
 <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{category}</h3>
 <span className="text-[10px] text-outline font-medium">{items.length} items</span>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
 {items.map(eq => (
 <div key={eq.id}
 className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-high card-morph">
 <div className="min-w-0 flex-1">
 <div className="text-sm font-medium text-foreground truncate">{eq.name}</div>
 <div className="text-[10px] text-on-surface-variant">
 {eq.brand} {eq.model} · {eq.serial_number || 'N/A'}
 </div>
 </div>
 <Badge variant="outline" className={cn(
 'ml-2 shrink-0 text-[10px]',
 eq.status === 'available' ? 'bg-m3-success-subtle text-m3-success border-m3-success' :
 eq.status === 'checked_out' ? 'bg-m3-warning-subtle text-m3-warning border-m3-warning' :
 eq.status === 'maintenance' ? 'bg-m3-error-subtle text-m3-error border-m3-error' :
 'bg-surface-container-high text-on-surface-variant border-outline-variant/30'
 )}>
 {eq.status.replace('_', '')}
 </Badge>
 </div>
 ))}
 </div>
 </div>
 ))}
 {byCategory.size === 0 && (
 <div className="px-5 py-8 text-center">
 <p className="text-sm text-on-surface-variant">No equipment found in the database.</p>
 </div>
 )}
 </div>
 </div>
 </section>

 {/* Active Checkouts */}
 <section className="morph-fade-in morph-delay-4">
 <div className="rounded-2xl bg-surface-container-lowest ring-1 ring-outline-variant/40 overflow-hidden card-morph">
 <div className="p-5 pb-3">
 <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
 <User className="w-4 h-4 text-primary" />
 Active Checkouts ({activeCheckouts?.length || 0})
 </h2>
 </div>
 {activeCheckouts && activeCheckouts.length > 0 ? (
 <div className="divide-y divide-outline-variant/20">
 {activeCheckouts.map(co => (
 <div key={co.id} className="px-5 py-3 flex items-center justify-between">
 <div className="min-w-0 flex-1">
 <div className="text-sm font-medium text-foreground truncate">{co.equipment?.name}</div>
 <div className="text-xs text-on-surface-variant">
 {co.profiles?.full_name || 'Unknown'}
 {co.projects?.title ? ` · ${co.projects.title}` : ''}
 </div>
 </div>
 <div className="text-right shrink-0 ml-4">
 <div className="text-[10px] text-on-surface-variant">Checked out</div>
 <div className="text-[10px] text-m3-warning font-medium">
 {new Date(co.checked_out_at).toLocaleDateString()}
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="px-5 py-8 text-center">
 <p className="text-sm text-on-surface-variant">No equipment currently checked out.</p>
 </div>
 )}
 </div>
 </section>

 {/* Maintenance Records */}
 {maintenanceRecords && maintenanceRecords.length > 0 && (
 <section className="morph-fade-in morph-delay-5">
 <div className="rounded-2xl bg-surface-container-lowest ring-1 ring-outline-variant/40 overflow-hidden card-morph">
 <div className="p-5 pb-3">
 <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
 <Wrench className="w-4 h-4 text-primary" />
 Recent Maintenance
 </h2>
 </div>
 <div className="divide-y divide-outline-variant/20">
 {maintenanceRecords.map(mr => (
 <div key={mr.id} className="px-5 py-3 flex items-center justify-between">
 <div className="min-w-0 flex-1">
 <div className="text-sm font-medium text-foreground truncate">{mr.equipment?.name}</div>
 <div className="text-xs text-on-surface-variant truncate">{mr.description}</div>
 </div>
 <div className="text-right shrink-0 ml-4">
 <Badge variant="outline" className={cn(
 'text-[10px]',
 mr.status === 'completed' ? 'bg-m3-success-subtle text-m3-success border-m3-success' :
 mr.status === 'in_progress' ? 'bg-m3-warning-subtle text-m3-warning border-m3-warning' :
 'bg-primary-container text-primary border-primary/30'
 )}>
 {mr.status.replace('_', '')}
 </Badge>
 <div className="text-[10px] text-on-surface-variant mt-1">
 {new Date(mr.scheduled_date).toLocaleDateString()}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </section>
 )}

 {/* Talent Directory */}
 {talents && talents.length > 0 && (
 <section className="morph-fade-in morph-delay-6">
 <div className="rounded-2xl bg-surface-container-lowest ring-1 ring-outline-variant/40 overflow-hidden card-morph">
 <div className="p-5 pb-3">
 <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
 <User className="w-4 h-4 text-primary" />
 Talent Directory ({talents.length})
 </h2>
 </div>
 <div className="divide-y divide-outline-variant/20">
 {talents.map(t => (
 <div key={t.id} className="px-5 py-3 flex items-center justify-between">
 <div className="min-w-0 flex-1">
 <div className="text-sm font-medium text-foreground">{t.full_name}</div>
 <div className="text-xs text-on-surface-variant">
 {t.talent_type?.replace('_', '') || 'N/A'}
 {t.location ? ` · ${t.location}` : ''}
 {t.phone_number ? ` · ${t.phone_number}` : ''}
 </div>
 </div>
 {t.rate_amount && (
 <div className="text-right shrink-0 ml-4">
 <div className="text-sm font-bold text-foreground tabular-nums">{t.rate_amount.toLocaleString()}</div>
 <div className="text-[10px] text-on-surface-variant">per {t.rate_type || 'day'}</div>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 </section>
 )}
 </div>
 )
}
