/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createEquipment, updateEquipment, addEquipmentCategory } from './actions'
import { Equipment } from '@/types/equipment'

export function EquipmentForm({ initialData }: { initialData?: Equipment }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [file, setFile] = useState<File | null>(null)

  const [name, setName] = useState(initialData?.name || '')
  const [brand, setBrand] = useState(initialData?.brand || '')
  const [model, setModel] = useState(initialData?.model || '')
  const [serialNumber, setSerialNumber] = useState(initialData?.serial_number || '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [purchaseDate, setPurchaseDate] = useState(initialData?.purchase_date ? initialData.purchase_date.split('T')[0] : '')
  const [purchasePrice, setPurchasePrice] = useState(initialData?.purchase_price ? String(initialData.purchase_price) : '')
  const [currentValue, setCurrentValue] = useState(initialData?.current_value ? String(initialData.current_value) : '')
  const [location, setLocation] = useState(initialData?.location || '')
  const [vendorName, setVendorName] = useState((initialData as any)?.vendor_name || '')
  const [vendorPhone, setVendorPhone] = useState((initialData as any)?.vendor_phone || '')
  const [vendorLocation, setVendorLocation] = useState((initialData as any)?.vendor_location || '')
  const [notes, setNotes] = useState(initialData?.notes || '')

  const [categories, setCategories] = useState<string[]>([
    'Camera', 'Lens', 'Light', 'Audio', 'Grip', 'Other',
  ])
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')

  useEffect(() => {
    fetch('/admin/equipment/api/categories')
      .then(res => res.json())
      .then(data => { if (data?.length) setCategories(data) })
      .catch(() => { })
  }, [])

  async function handleAddCategory() {
    if (!newCategory.trim()) return
    const result = await addEquipmentCategory(newCategory.trim())
    if (result.error) {
      toast.error(result.error)
    } else {
      setCategories(prev => [...prev, newCategory.trim()])
      setCategory(newCategory.trim())
      setShowNewCategory(false)
      setNewCategory('')
      toast.success('Category added')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !category) {
      toast.error('Name and category are required')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('category', category)
      if (brand) formData.append('brand', brand)
      if (model) formData.append('model', model)
      if (serialNumber) formData.append('serial_number', serialNumber)
      if (purchaseDate) formData.append('purchase_date', purchaseDate)
      if (purchasePrice) formData.append('purchase_price', purchasePrice)
      if (currentValue) formData.append('current_value', currentValue)
      if (location) formData.append('location', location)
      if (vendorName) formData.append('vendor_name', vendorName)
      if (vendorPhone) formData.append('vendor_phone', vendorPhone)
      if (vendorLocation) formData.append('vendor_location', vendorLocation)
      if (notes) formData.append('notes', notes)
      if (file) formData.append('photo', file)

      let result
      if (initialData) {
        result = await updateEquipment(initialData.id, formData)
      } else {
        result = await createEquipment(formData)
      }

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(initialData ? 'Equipment updated' : 'Equipment added')
        router.push(initialData ? `/admin/equipment/${initialData.id}` : '/admin/equipment')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-on-surface">Equipment Name *</label>
          <Input placeholder="e.g. Sony A7S III" value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-on-surface">Category *</label>
          {showNewCategory ? (
            <div className="flex gap-2">
              <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category name" />
              <Button type="button" size="sm" onClick={handleAddCategory}>Add</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowNewCategory(false)}>Cancel</Button>
            </div>
          ) : (
            <Select value={category} onValueChange={(v: string | null) => {
              if (v === '__ADD_NEW__') setShowNewCategory(true)
              else setCategory(v || '')
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
                <SelectItem value="__ADD_NEW__" className="text-primary font-medium">+ Add New</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-on-surface">Brand</label>
          <Input placeholder="e.g. Sony" value={brand} onChange={e => setBrand(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-on-surface">Model</label>
          <Input placeholder="e.g. ILCE-7SM3" value={model} onChange={e => setModel(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-on-surface">Serial Number</label>
          <Input placeholder="Leave blank if unknown" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-on-surface">Storage Location</label>
          <Input placeholder="e.g. Shelf A, Studio 1" value={location} onChange={e => setLocation(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-on-surface">Purchase Date</label>
          <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-on-surface">Purchase Price (NPR)</label>
            <Input type="number" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-on-surface">Current Value (NPR)</label>
            <Input type="number" step="0.01" value={currentValue} onChange={e => setCurrentValue(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Vendor Information */}
      <div className="pt-4 border-t border-outline-variant">
        <h3 className="text-sm font-semibold text-on-surface mb-3">Vendor Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-on-surface">Vendor Name</label>
            <Input placeholder="e.g. Sony Center" value={vendorName} onChange={e => setVendorName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-on-surface">Vendor Phone</label>
            <Input type="tel" placeholder="e.g. 9800000000" value={vendorPhone} onChange={e => setVendorPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-on-surface">Vendor Location</label>
            <Input placeholder="e.g. Kathmandu" value={vendorLocation} onChange={e => setVendorLocation(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-on-surface">Photo (Optional)</label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-on-surface">Notes</label>
        <Textarea placeholder="Condition notes, accessories included, etc." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : (initialData ? 'Update Equipment' : 'Add Equipment')}
        </Button>
      </div>
    </form>
  )
}
