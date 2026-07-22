'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Talent } from '@/types/talent'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StorageImage } from '@/components/storage-image'
import { Search, MapPin, DollarSign } from 'lucide-react'

const TALENT_TYPES = [
    'model', 'actor', 'voice_artist', 'dancer', 'makeup_artist',
    'stylist', 'photographer', 'freelance_editor', 'freelance_videographer',
    'sound_engineer', 'colorist', 'motion_designer', 'other',
]

export function TalentsGrid({ initialTalents }: { initialTalents: Talent[] }) {
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [activeFilter, setActiveFilter] = useState('all')

    const filteredTalents = initialTalents.filter(t => {
        const matchesSearch =
            t.full_name.toLowerCase().includes(search.toLowerCase()) ||
            (t.stage_name && t.stage_name.toLowerCase().includes(search.toLowerCase())) ||
            (t.location && t.location.toLowerCase().includes(search.toLowerCase()))

        const matchesType = typeFilter === 'all' || t.talent_type === typeFilter
        const matchesActive = activeFilter === 'all' ||
            (activeFilter === 'active' && t.is_active) ||
            (activeFilter === 'inactive' && !t.is_active)

        return matchesSearch && matchesType && matchesActive
    })

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                    <Input
                        placeholder="Search by name, stage name, or location..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
                        <SelectTrigger className="w-[160px] bg-surface-container-lowest">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {TALENT_TYPES.map(type => (
                                <SelectItem key={type} value={type} className="capitalize">{type.replace(/_/g, '')}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={activeFilter} onValueChange={(v) => v && setActiveFilter(v)}>
                        <SelectTrigger className="w-[130px] bg-surface-container-lowest">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {filteredTalents.length === 0 ? (
                <div className="text-center py-12 border border-dashed shape-medium border-outline-variant/50">
                    <p className="text-outline">No talents found matching your filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTalents.map((talent) => (
                        <Link key={talent.id} href={`/admin/talents/${talent.id}`} className="block group">
                            <div className="flex items-start gap-4 p-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest card-morph hover:border-primary transition-colors">
                                <div className="w-16 h-16 rounded-full bg-surface-container-high overflow-hidden flex-shrink-0 flex items-center justify-center">
                                    {talent.photo_url ? (
                                        <StorageImage
                                            bucket="talent-photos"
                                            filePath={talent.photo_url}
                                            alt={talent.full_name}
                                            className="w-full h-full object-cover"
                                            fallback={<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-400 to-orange-400 text-white font-bold text-lg">{talent.full_name.charAt(0).toUpperCase()}</div>}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-400 to-orange-400 text-white font-bold text-lg">
                                            {talent.full_name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                        <div>
                                            <h3 className="font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                                                {talent.full_name}
                                            </h3>
                                            {talent.stage_name && (
                                                <p className="text-xs text-outline">aka {talent.stage_name}</p>
                                            )}
                                        </div>
                                        <Badge variant={talent.is_active ? 'default' : 'outline'} className="capitalize flex-shrink-0 text-[10px]">
                                            {talent.talent_type.replace(/_/g, '')}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-on-surface-variant space-y-1 mt-2">
                                        {talent.location && (
                                            <p className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {talent.location}
                                            </p>
                                        )}
                                        {talent.rate_amount && (
                                            <p className="flex items-center gap-1">
                                                <DollarSign className="w-3 h-3" /> NPR {talent.rate_amount.toLocaleString('ne-NP')} / {talent.rate_type.replace('_', '')}
                                            </p>
                                        )}
                                        {talent.skills && talent.skills.length > 0 && (
                                            <p className="truncate">Skills: {talent.skills.slice(0, 3).join(',')}{talent.skills.length > 3 ? '...' : ''}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}