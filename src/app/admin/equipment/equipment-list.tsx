'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Equipment } from '@/types/equipment'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Image as ImageIcon } from 'lucide-react'
import { StorageImage } from '@/components/storage-image'

export function EquipmentList({ initialEquipment }: { initialEquipment: Equipment[] }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredEquipment = initialEquipment.filter(eq => {
    const matchesSearch =
      eq.name.toLowerCase().includes(search.toLowerCase()) ||
      (eq.serial_number && eq.serial_number.toLowerCase().includes(search.toLowerCase())) ||
      (eq.brand && eq.brand.toLowerCase().includes(search.toLowerCase()))

    const matchesCategory = categoryFilter === 'all' || eq.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || eq.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Get unique categories for filter
  const categories = Array.from(new Set(initialEquipment.map(e => e.category)))

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search equipment, brand, serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={(v: string | null) => setCategoryFilter(v || 'all')}>
            <SelectTrigger className="w-[140px] bg-white dark:bg-zinc-900">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v: string | null) => setStatusFilter(v || 'all')}>
            <SelectTrigger className="w-[140px] bg-white dark:bg-zinc-900">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="checked_out">Checked Out</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredEquipment.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500">No equipment found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEquipment.map((eq) => (
            <Link key={eq.id} href={`/admin/equipment/${eq.id}`} className="block group">
              <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-sky-500 dark:hover:border-sky-500 transition-colors">
                <div className="w-20 h-20 rounded-md bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {eq.image_url ? (
                    <StorageImage
                      bucket="equipment-photos"
                      filePath={eq.image_url}
                      alt={eq.name}
                      className="w-full h-full object-cover"
                      fallback={<ImageIcon className="w-6 h-6 text-zinc-400" />}
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-zinc-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-sky-500 transition-colors">
                      {eq.name}
                    </h3>
                    <Badge variant={
                      eq.status === 'available' ? 'default' :
                        eq.status === 'checked_out' ? 'secondary' :
                          eq.status === 'maintenance' ? 'destructive' : 'outline'
                    } className="capitalize flex-shrink-0">
                      {eq.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-xs text-zinc-500 space-y-1">
                    <p className="truncate">{eq.brand} {eq.model}</p>
                    <p className="truncate">S/N: {eq.serial_number || 'N/A'}</p>
                    <p className="truncate">Location: {eq.location || 'Unassigned'}</p>
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
