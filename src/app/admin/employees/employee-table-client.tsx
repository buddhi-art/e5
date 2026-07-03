'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmployeeActions } from './employee-actions'
import { EditEmployeeDialog } from './edit-employee-dialog'
import { Search, Phone, MapPin } from 'lucide-react'

export function EmployeeTableClient({ employees, designations, isArchived }: { employees: any[]; designations: string[]; isArchived: boolean }) {
    const [search, setSearch] = useState('')

    const filtered = employees.filter(emp => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
            emp.full_name.toLowerCase().includes(q) ||
            (emp.designation && emp.designation.toLowerCase().includes(q)) ||
            (emp.phone_number && emp.phone_number.toLowerCase().includes(q)) ||
            (emp.location && emp.location.toLowerCase().includes(q))
        )
    })

    return (
        <div className="space-y-4">
            {!isArchived && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                    <Input
                        placeholder="Search by name, designation, phone, or location..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            )}
            <Table>
                <TableHeader>
                    <TableRow className="border-outline-variant/50 hover:bg-surface-container-high">
                        <TableHead className="text-on-surface-variant">Name</TableHead>
                        <TableHead className="text-on-surface-variant">Designation</TableHead>
                        <TableHead className="text-on-surface-variant">Phone</TableHead>
                        <TableHead className="text-on-surface-variant">Location</TableHead>
                        <TableHead className="text-on-surface-variant">Joined</TableHead>
                        <TableHead className="text-on-surface-variant text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filtered.length > 0 ? (
                        filtered.map(employee => (
                            <TableRow key={employee.id} className="border-outline-variant/50 hover:bg-surface-container-high transition-colors">
                                <TableCell>
                                    <Link href={`/admin/employees/${employee.id}`} className="font-medium text-on-surface hover:text-primary transition-colors">{employee.full_name}</Link>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-on-surface-variant border-outline-variant bg-surface-container-high">{employee.designation || "None"}</Badge>
                                </TableCell>
                                <TableCell className="text-on-surface">
                                    {employee.phone_number ? (
                                        <span className="inline-flex items-center gap-1.5"><Phone className="w-3 h-3 text-outline" />{employee.phone_number}</span>
                                    ) : <span className="text-outline">&mdash;</span>}
                                </TableCell>
                                <TableCell className="text-on-surface">
                                    {employee.location ? (
                                        <span className="inline-flex items-center gap-1.5"><MapPin className="w-3 h-3 text-outline" />{employee.location}</span>
                                    ) : <span className="text-outline">&mdash;</span>}
                                </TableCell>
                                <TableCell className="text-on-surface-variant">
                                    {employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : new Date(employee.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="inline-flex items-center gap-1">
                                        {!isArchived && <EditEmployeeDialog employee={employee} designations={designations} />}
                                        <EmployeeActions employeeId={employee.id} employeeName={employee.full_name} isArchived={isArchived} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow><TableCell colSpan={6} className="text-center py-6 text-outline">{isArchived ? 'No archived employees found.' : 'No active employees found.'}</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
