/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EditClientDialog } from './edit-client-dialog'
import { ClientActions } from './client-actions'
import { Search, Phone, Building2, ExternalLink } from 'lucide-react'

export function ClientTableClient({ clients, companyNatures, referralSources }: { clients: any[]; companyNatures: string[]; referralSources: string[] }) {
    const [search, setSearch] = useState('')

    const filtered = clients.filter(client => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
            client.company_name.toLowerCase().includes(q) ||
            (client.nature_of_company && client.nature_of_company.toLowerCase().includes(q)) ||
            (client.contact_person && client.contact_person.toLowerCase().includes(q)) ||
            (client.phone_number && client.phone_number.toLowerCase().includes(q))
        )
    })

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <Input
                    placeholder="Search by company name, nature, contact person, or phone..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>
            <Table>
                <TableHeader>
                    <TableRow className="border-outline-variant/50 hover:bg-surface-container-high">
                        <TableHead className="text-on-surface-variant">Company</TableHead>
                        <TableHead className="text-on-surface-variant">Contact</TableHead>
                        <TableHead className="text-on-surface-variant">Status</TableHead>
                        <TableHead className="text-on-surface-variant text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filtered.length > 0 ? (
                        filtered.map(client => (
                            <TableRow key={client.id} className="border-outline-variant/50 hover:bg-surface-container-high transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        {client.logo_url ? (
                                            <img src={client.logo_url} alt={client.company_name} className="w-8 h-8 rounded-full object-cover bg-surface-container-high" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                        )}
                                        <div>
                                            <Link href={`/admin/clients/${client.id}`} className="font-medium text-on-surface hover:text-primary transition-colors">
                                                {client.company_name}
                                            </Link>
                                            <div className="text-xs text-outline">{client.nature_of_company || "Unspecified"}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-on-surface">{client.contact_person || "N/A"}</div>
                                    {client.phone_number && (
                                        <div className="text-xs text-outline flex items-center gap-1 mt-1">
                                            <Phone className="w-3 h-3" /> {client.phone_number}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={client.status === "active" ? "bg-m3-info-subtle text-m3-info border-m3-info" :
                                            client.status === "potential" ? "bg-m3-warning-subtle text-m3-warning border-m3-warning" :
                                                "bg-surface-container-high text-on-surface-variant border-outline-variant"
                                        }
                                    >
                                        {client.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="inline-flex items-center gap-1">
                                        <EditClientDialog client={client} companyNatures={companyNatures} referralSources={referralSources} />
                                        <ClientActions clientId={client.id} clientName={client.company_name} isArchived={false} />
                                        <Link href={`/admin/clients/${client.id}`} className="inline-flex items-center justify-center rounded-md w-9 h-9 btn-morph text-outline hover:text-primary hover:bg-primary/10 transition-colors" title="View details">
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-outline">
                                No clients found matching your search.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
