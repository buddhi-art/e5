'use client'

import { MapPin, Calendar, Clock, Camera, Truck, Video, CheckCircle2, ExternalLink, FileText, ClipboardCheck, PackageCheck } from 'lucide-react'
import { checklistProgress, isWorkspacePhase, PHASE_LABELS } from '@/lib/phase-workspace'
import type { ChecklistItem } from '@/lib/validations'

export interface LogisticsData {
    locationAddress?: string
    locations?: string[]
    shootDate?: string
    startTime?: string
    endTime?: string
    assignedStaffIds?: string[]
    assignedStaffNames?: string[]
    vehiclesTaken?: string[]
    equipmentsTaken?: string[]
    editingLocation?: string
    editingDate?: string
    editingStartTime?: string
    editingEndTime?: string
    assignedEditorIds?: string[]
    editingNotes?: string
    checklist?: ChecklistItem[]
    conceptBrief?: string
    scriptLink?: string
    storyboardLink?: string
    moodboardLink?: string
    referenceLinks?: string[]
    deliverableFormat?: string
    targetDuration?: string
    conceptStatus?: 'drafting' | 'internal_review' | 'client_review' | 'approved'
    qaReviewer?: string
    reviewRound?: number
    qaVerdict?: 'pending' | 'passed' | 'changes_requested'
    qaNotes?: string
    blockingIssues?: string[]
    reviewLink?: string
    finalDeliveryLink?: string
    deliveryDate?: string
    deliveryChannel?: string
    clientContact?: string
    archiveLink?: string
    deliveryNotes?: string
}

interface TaskLogisticsViewProps {
    logistics: LogisticsData
    phase: string
}

export function TaskLogisticsView({ logistics, phase }: TaskLogisticsViewProps) {
    if (!logistics) {
        return null
    }

    if (isWorkspacePhase(phase)) {
        return <PhaseWorkspaceView logistics={logistics} phase={phase} />
    }

    return null
}

import { WorkspacePhase } from '@/lib/phase-workspace'

function PhaseWorkspaceView({ logistics, phase }: { logistics: LogisticsData; phase: WorkspacePhase }) {
    const progress = checklistProgress(logistics.checklist)
    const hasContent = (logistics.checklist?.length ?? 0) > 0
        || Boolean(logistics.conceptBrief || logistics.scriptLink || logistics.reviewLink || logistics.finalDeliveryLink)
        || (phase === 'Phase 2' && (logistics.locationAddress || logistics.shootDate || logistics.startTime || logistics.endTime || logistics.equipmentsTaken?.length || logistics.vehiclesTaken?.length))
        || (phase === 'Phase 3' && (logistics.editingLocation || logistics.editingDate || logistics.editingStartTime || logistics.editingEndTime || logistics.editingNotes))

    if (!hasContent) return null

    const Icon = phase === 'Phase 1' ? FileText 
        : phase === 'Phase 2' ? Truck
        : phase === 'Phase 3' ? Video
        : phase === 'Phase 4' ? ClipboardCheck : PackageCheck

    const verdictClass = logistics.qaVerdict === 'passed'
        ? 'bg-m3-success-subtle text-m3-success border-m3-success/30'
        : logistics.qaVerdict === 'changes_requested'
            ? 'bg-m3-warning-subtle text-m3-warning border-m3-warning/30'
            : 'bg-surface-container-high text-on-surface-variant border-outline-variant'

    const links = phase === 'Phase 1'
        ? [
            ['Approved script', logistics.scriptLink],
            ['Storyboard', logistics.storyboardLink],
            ['Moodboard', logistics.moodboardLink],
            ...(logistics.referenceLinks ?? []).map((link, index) => [`Reference ${index + 1}`, link]),
        ]
        : phase === 'Phase 4'
            ? [['Review cut', logistics.reviewLink]]
            : phase === 'Phase 5'
                ? [['Final delivery', logistics.finalDeliveryLink], ['Archive', logistics.archiveLink]]
                : []

    return (
        <div className="mt-4 space-y-4 rounded-lg border border-outline-variant/60 bg-surface-container-low p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Icon className="h-4 w-4 text-primary" />
                    {PHASE_LABELS[phase]} workspace
                </h4>
                {phase === 'Phase 4' && logistics.qaVerdict && (
                    <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${verdictClass}`}>
                        {logistics.qaVerdict.replace('_', ' ')}
                    </span>
                )}
            </div>

            {(logistics.checklist?.length ?? 0) > 0 && (
                <div>
                    <div className="mb-1 flex justify-between text-xs text-on-surface-variant">
                        <span>Checklist</span><span>{progress}%</span>
                    </div>
                    <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
                        <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {logistics.checklist?.map((item) => (
                            <div key={item.key} className="flex items-center gap-2 text-xs text-on-surface">
                                <CheckCircle2 className={`h-3.5 w-3.5 ${item.done ? 'text-m3-success' : 'text-outline'}`} />
                                <span className={item.done ? 'text-on-surface-variant line-through' : ''}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- Phase 1 Specifics --- */}
            {phase === 'Phase 1' && logistics.conceptBrief && (
                <WorkspaceText label="Creative brief" value={logistics.conceptBrief} />
            )}
            {phase === 'Phase 1' && (logistics.deliverableFormat || logistics.targetDuration || logistics.conceptStatus) && (
                <div className="flex flex-wrap gap-2 text-xs">
                    {logistics.deliverableFormat && <span className="rounded-full border border-outline-variant bg-surface-container-lowest px-2 py-1">{logistics.deliverableFormat}</span>}
                    {logistics.targetDuration && <span className="rounded-full border border-outline-variant bg-surface-container-lowest px-2 py-1">{logistics.targetDuration}</span>}
                    {logistics.conceptStatus && <span className="rounded-full border border-outline-variant bg-surface-container-lowest px-2 py-1">{logistics.conceptStatus.replace('_', ' ')}</span>}
                </div>
            )}

            {/* --- Phase 2 Specifics --- */}
            {phase === 'Phase 2' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {logistics.locationAddress && (
                        <div>
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Location</p>
                            <div className="flex items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 text-primary mt-0.5" />
                                <span className="text-on-surface">{logistics.locationAddress}</span>
                            </div>
                        </div>
                    )}
                    {logistics.shootDate && (
                        <div>
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Shoot Date</p>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                <span className="text-on-surface">{new Date(logistics.shootDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}
                    {(logistics.startTime || logistics.endTime) && (
                        <div>
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Time</p>
                            <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                <span className="text-on-surface">{logistics.startTime || '?'} - {logistics.endTime || '?'}</span>
                            </div>
                        </div>
                    )}

                    {(logistics.equipmentsTaken?.length ?? 0) > 0 && (
                        <div className="md:col-span-2">
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Equipment</p>
                            <div className="flex flex-wrap gap-2">
                                {logistics.equipmentsTaken!.map((eq, index) => (
                                    <span key={index} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium flex items-center gap-1">
                                        <Camera className="w-3 h-3" />
                                        {eq}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {(logistics.vehiclesTaken?.length ?? 0) > 0 && (
                        <div className="md:col-span-2">
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Vehicles</p>
                            <div className="flex flex-wrap gap-2">
                                {logistics.vehiclesTaken!.map((vehicle, index) => (
                                    <span key={index} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium flex items-center gap-1">
                                        <Truck className="w-3 h-3" />
                                        {vehicle}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- Phase 3 Specifics --- */}
            {phase === 'Phase 3' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {logistics.editingLocation && (
                        <div>
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Editing Location</p>
                            <div className="flex items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 text-primary mt-0.5" />
                                <span className="text-on-surface">{logistics.editingLocation}</span>
                            </div>
                        </div>
                    )}
                    {logistics.editingDate && (
                        <div>
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Editing Date</p>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                <span className="text-on-surface">{new Date(logistics.editingDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}
                    {(logistics.editingStartTime || logistics.editingEndTime) && (
                        <div>
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Time</p>
                            <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                <span className="text-on-surface">{logistics.editingStartTime || '?'} - {logistics.editingEndTime || '?'}</span>
                            </div>
                        </div>
                    )}

                    {logistics.editingNotes && (
                        <div className="md:col-span-2">
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Client Revision Notes</p>
                            <p className="text-on-surface text-sm whitespace-pre-wrap">{logistics.editingNotes}</p>
                        </div>
                    )}
                </div>
            )}

            {/* --- Phase 4 Specifics --- */}
            {phase === 'Phase 4' && logistics.qaNotes && <WorkspaceText label="QA notes" value={logistics.qaNotes} />}
            {phase === 'Phase 4' && logistics.blockingIssues && logistics.blockingIssues.length > 0 && (
                <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-m3-warning">Blocking issues</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-on-surface">
                        {logistics.blockingIssues.map((issue, index) => <li key={`${issue}-${index}`}>{issue}</li>)}
                    </ul>
                </div>
            )}

            {/* --- Phase 5 Specifics --- */}
            {phase === 'Phase 5' && (logistics.deliveryDate || logistics.deliveryChannel || logistics.clientContact) && (
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                    {logistics.deliveryDate && <WorkspaceText label="Delivery date" value={new Date(`${logistics.deliveryDate}T00:00:00`).toLocaleDateString()} />}
                    {logistics.deliveryChannel && <WorkspaceText label="Channel" value={logistics.deliveryChannel} />}
                    {logistics.clientContact && <WorkspaceText label="Client contact" value={logistics.clientContact} />}
                </div>
            )}
            {phase === 'Phase 5' && logistics.deliveryNotes && <WorkspaceText label="Delivery notes" value={logistics.deliveryNotes} />}

            {links.some(([, link]) => Boolean(link)) && (
                <div className="flex flex-wrap gap-2">
                    {links.filter(([, link]) => Boolean(link)).map(([label, link]) => (
                        <a
                            key={`${label}-${link}`}
                            href={link as string}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs font-medium text-primary hover:bg-surface-container-high"
                        >
                            <ExternalLink className="h-3.5 w-3.5" /> {label}
                        </a>
                    ))}
                </div>
            )}
        </div>
    )
}

function WorkspaceText({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
            <p className="whitespace-pre-wrap text-sm text-on-surface">{value}</p>
        </div>
    )
}
