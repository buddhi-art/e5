'use client'

import { MapPin, Calendar, Clock, Camera, Truck, Video, CheckCircle2 } from 'lucide-react'

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
}

interface TaskLogisticsViewProps {
    logistics: LogisticsData
    phase: string
}

export function TaskLogisticsView({ logistics, phase }: TaskLogisticsViewProps) {
    if (!logistics || (phase !== 'Phase 2' && phase !== 'Phase 3')) {
        return null
    }

    // Check if we have videography logistics (Phase 2) or editing logistics (Phase 3)
    const hasVideographyData = phase === 'Phase 2' && (
        logistics.locationAddress ||
        (logistics.locations && logistics.locations.length > 0) ||
        logistics.shootDate ||
        logistics.startTime ||
        logistics.endTime ||
        (logistics.assignedStaffIds && logistics.assignedStaffIds.length > 0) ||
        (logistics.vehiclesTaken && logistics.vehiclesTaken.length > 0) ||
        (logistics.equipmentsTaken && logistics.equipmentsTaken.length > 0)
    );

    const hasEditingData = phase === 'Phase 3' && (
        logistics.editingLocation ||
        logistics.editingDate ||
        logistics.editingStartTime ||
        logistics.editingEndTime ||
        (logistics.assignedEditorIds && logistics.assignedEditorIds.length > 0) ||
        logistics.editingNotes
    );

    if (!hasVideographyData && !hasEditingData) {
        return null
    }

    return (
        <div className="mt-4 p-4 bg-surface-container-low rounded-lg border border-outline-variant/60 space-y-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                {phase === 'Phase 2' ? (
                    <Truck className="w-4 h-4 text-primary" />
                ) : (
                    <Video className="w-4 h-4 text-primary" />
                )}
                {phase === 'Phase 2' ? 'Videography Logistics' : 'Editing & Post-Production Logistics'}
            </h4>

            {phase === 'Phase 2' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* Locations */}
                    {(logistics.locationAddress || (logistics.locations && logistics.locations.length > 0)) && (
                        <div>
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Locations</p>
                            {logistics.locations && logistics.locations.length > 0 ? (
                                <div className="space-y-1">
                                    {logistics.locations.map((location: string, index: number) => (
                                        <div key={index} className="flex items-start gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-primary mt-0.5" />
                                            <span className="text-on-surface">{location}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-primary mt-0.5" />
                                    <span className="text-on-surface">{logistics.locationAddress}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Date */}
                    {logistics.shootDate && (
                        <div>
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Date</p>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                <span className="text-on-surface">{new Date(logistics.shootDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}

                    {/* Time */}
                    {(logistics.startTime || logistics.endTime) && (
                        <div>
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Time</p>
                            <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                <span className="text-on-surface">
                                    {logistics.startTime || '?'} - {logistics.endTime || '?'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {phase === 'Phase 3' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* Editing Location */}
                    {logistics.editingLocation && (
                        <div>
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Editing Location</p>
                            <div className="flex items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 text-primary mt-0.5" />
                                <span className="text-on-surface">{logistics.editingLocation}</span>
                            </div>
                        </div>
                    )}

                    {/* Editing Date */}
                    {logistics.editingDate && (
                        <div>
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Editing Date</p>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                <span className="text-on-surface">{new Date(logistics.editingDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}

                    {/* Editing Time */}
                    {(logistics.editingStartTime || logistics.editingEndTime) && (
                        <div>
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Editing Time</p>
                            <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                <span className="text-on-surface">
                                    {logistics.editingStartTime || '?'} - {logistics.editingEndTime || '?'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Staff Assignment (Phase 2) */}
            {phase === 'Phase 2' && logistics.assignedStaffIds && logistics.assignedStaffIds.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Assigned Staff</p>
                    <div className="flex flex-wrap gap-2">
                        {logistics.assignedStaffNames && logistics.assignedStaffNames.length > 0 ? (
                            logistics.assignedStaffNames.map((staffName: string, index: number) => (
                                <span key={index} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {staffName}
                                </span>
                            ))
                        ) : (
                            logistics.assignedStaffIds.map((staffId: string, index: number) => (
                                <span key={index} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Staff ID: {staffId}
                                </span>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Assigned Editors (Phase 3) */}
            {phase === 'Phase 3' && logistics.assignedEditorIds && logistics.assignedEditorIds.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Assigned Editors</p>
                    <div className="flex flex-wrap gap-2">
                        {logistics.assignedEditorIds.map((editorId: string, index: number) => (
                            <span key={index} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Editor ID: {editorId}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Equipment (Phase 2) */}
            {phase === 'Phase 2' && logistics.equipmentsTaken && logistics.equipmentsTaken.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Equipment</p>
                    <div className="flex flex-wrap gap-2">
                        {logistics.equipmentsTaken.map((eq: string, index: number) => (
                            <span key={index} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                {eq}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Vehicles (Phase 2) */}
            {phase === 'Phase 2' && logistics.vehiclesTaken && logistics.vehiclesTaken.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Vehicles</p>
                    <div className="flex flex-wrap gap-2">
                        {logistics.vehiclesTaken.map((vehicle: string, index: number) => (
                            <span key={index} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                {vehicle}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Editing Notes (Phase 3) */}
            {phase === 'Phase 3' && logistics.editingNotes && (
                <div>
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Client Revision Notes</p>
                    <p className="text-on-surface text-sm whitespace-pre-wrap">{logistics.editingNotes}</p>
                </div>
            )}
        </div>
    )
}