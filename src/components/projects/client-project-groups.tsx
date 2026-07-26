'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, FolderKanban, Package } from 'lucide-react'
import { ProjectStatusSelect } from '@/app/admin/projects/project-status-select'
import { ProjectActionsMenu } from '@/app/admin/projects/project-actions-menu'
import { getClientProjectGroupTitle } from '@/lib/package-items'

export interface GroupedProject {
    id: string
    title: string
    status: string
    package?: string | null
    start_date?: string | null
    end_date?: string | null
    created_at: string
    client_id: string
    clients?: { company_name: string }
}

interface ClientProjectGroupsProps {
    projects: GroupedProject[]
    clients: Array<{ id: string; company_name: string }>
}

export function ClientProjectGroups({ projects, clients }: ClientProjectGroupsProps) {
    const groups = Array.from(projects.reduce((map, project) => {
        const clientName = project.clients?.company_name || 'Unknown Client'
        const key = project.client_id || clientName
        const existing = map.get(key) || { key, clientName, projects: [] as GroupedProject[] }
        existing.projects.push(project)
        map.set(key, existing)
        return map
    }, new Map<string, { key: string; clientName: string; projects: GroupedProject[] }>()).values())
        .sort((a, b) => a.clientName.localeCompare(b.clientName))

    const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(groups.slice(0, 1).map(group => group.key)))

    if (groups.length === 0) {
        return <div className="py-10 text-center text-sm text-on-surface-variant">No active projects found.</div>
    }

    return (
        <div className="space-y-3">
            {groups.map(group => {
                const open = openGroups.has(group.key)
                return (
                    <section key={group.key} className="rounded-xl border border-outline-variant/60 overflow-hidden bg-surface-container-lowest">
                        <button
                            type="button"
                            onClick={() => setOpenGroups(previous => {
                                const next = new Set(previous)
                                if (next.has(group.key)) next.delete(group.key)
                                else next.add(group.key)
                                return next
                            })}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-container-high/60 transition-colors"
                            aria-expanded={open}
                        >
                            <span className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <FolderKanban className="w-4.5 h-4.5" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-bold text-foreground truncate">{getClientProjectGroupTitle(group.clientName)}</span>
                                    <span className="block text-xs text-on-surface-variant">{group.projects.length} project{group.projects.length === 1 ? '' : 's'} for {group.clientName}</span>
                                </span>
                            </span>
                            <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`} />
                        </button>

                        {open && (
                            <div className="border-t border-outline-variant/50 overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-surface-container-high/70 text-[10px] uppercase tracking-wider text-on-surface-variant">
                                        <tr>
                                            <th className="px-4 py-2.5">Project</th>
                                            <th className="px-4 py-2.5">Package</th>
                                            <th className="px-4 py-2.5">Timeline</th>
                                            <th className="px-4 py-2.5">Status</th>
                                            <th className="px-4 py-2.5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/40">
                                        {group.projects.map(project => (
                                            <tr key={project.id} className="hover:bg-surface-container-low transition-colors">
                                                <td className="px-4 py-3">
                                                    <Link href={`/admin/projects/${project.id}`} className="font-semibold text-foreground hover:text-primary hover:underline">
                                                        {project.title}
                                                    </Link>
                                                    <div className="text-[11px] text-on-surface-variant mt-0.5">Created {new Date(project.created_at).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-4 py-3 text-on-surface-variant">
                                                    {project.package ? <span className="inline-flex items-center gap-1"><Package className="w-3.5 h-3.5" />{project.package}</span> : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                                                    {project.start_date || project.end_date ? `${project.start_date || 'TBD'} → ${project.end_date || 'TBD'}` : 'Not scheduled'}
                                                </td>
                                                <td className="px-4 py-3"><ProjectStatusSelect projectId={project.id} currentStatus={project.status} /></td>
                                                <td className="px-4 py-3 text-right"><ProjectActionsMenu project={project} clients={clients} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )
            })}
        </div>
    )
}