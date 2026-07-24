/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Package, ArrowLeft, Plus, Minus, Sparkles, DollarSign,
  Calculator, Save, Calendar, FileText, Loader2, CreditCard, Trash2, X
} from 'lucide-react'
import { toast } from 'sonner'
import { getClientsForSelect, createPackage } from '@/app/admin/packages/actions'
import { listPackages, createPackage as createCustomPackage, deletePackage as deleteCustomPackage, type ProjectPackage } from '@/app/admin/projects/package-actions'
import { QuickClientModal } from '@/components/admin/packages/quick-client-modal'
import { InvoicePreview } from '@/components/admin/packages/invoice-preview'

export interface LineItem {
  id: string
  description: string
  quantity: number
  unit_cost: number
}

const PACKAGE_PRESETS = [
  {
    name: 'Standard Social Media Package',
    title: '4 Social Media Videos + 3 Banner Designs',
    items: [
      { description: 'Reels/Shorts Video Production & Editing', quantity: 4, unit_cost: 15000 },
      { description: 'Graphic Banner Designs (IG/FB)', quantity: 3, unit_cost: 3000 },
      { description: 'On-site Videography Session (1 Day)', quantity: 1, unit_cost: 10000 },
    ]
  },
  {
    name: 'Event Coverage Package',
    title: 'Full Day Event Coverage & Highlights Video',
    items: [
      { description: 'Full Day Multi-Cam Event Shoot', quantity: 1, unit_cost: 35000 },
      { description: 'Event Highlight Reel (2-3 Mins)', quantity: 1, unit_cost: 20000 },
      { description: 'Edited Event Photos (100+ Retouched)', quantity: 1, unit_cost: 15000 },
    ]
  },
  {
    name: 'Brand Commercial & Campaign Package',
    title: 'High-End Brand Ad & Commercial Video',
    items: [
      { description: 'Scriptwriting & Storyboarding', quantity: 1, unit_cost: 15000 },
      { description: 'Commercial Video Shooting (4K Cinema)', quantity: 2, unit_cost: 40000 },
      { description: 'Color Grading & Motion Graphics Editing', quantity: 1, unit_cost: 25000 },
      { description: 'Social Media Cutdowns (15s & 30s)', quantity: 3, unit_cost: 5000 },
    ]
  }
]

export default function CreatePackagePage() {
  const router = useRouter()

  // Form State
  const [clients, setClients] = useState<Array<{ id: string; company_name: string; contact_person?: string; contact_email?: string; phone_number?: string }>>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [title, setTitle] = useState('')
  const [creationDate, setCreationDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedPreset, setSelectedPreset] = useState('')

  // Custom Package Templates state
  const [customPackages, setCustomPackages] = useState<ProjectPackage[]>([])
  const [isAddPresetModalOpen, setIsAddPresetModalOpen] = useState(false)
  const [newCustomPackageName, setNewCustomPackageName] = useState('')
  const [creatingCustomPreset, setCreatingCustomPreset] = useState(false)
  const [deletingCustomId, setDeletingCustomId] = useState<string | null>(null)

  // Line items spreadsheet
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_cost: 0 }
  ])

  // Financial calculations
  const [discountAmount, setDiscountAmount] = useState(0)
  const [taxPercent, setTaxPercent] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'partially_paid' | 'paid'>('unpaid')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [notes, setNotes] = useState('')

  const [saving, setSaving] = useState(false)
  const [loadingClients, setLoadingClients] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoadingClients(true)
      const [clientData, pkgData] = await Promise.all([
        getClientsForSelect(),
        listPackages()
      ])
      setClients(clientData || [])
      if (pkgData.data) {
        setCustomPackages(pkgData.data)
      }
      setLoadingClients(false)
    }
    loadData()
  }, [])

  // Auto-calculate live numbers
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_cost || 0)), 0)
  const afterDiscount = Math.max(0, subtotal - Number(discountAmount || 0))
  const taxAmount = (afterDiscount * Number(taxPercent || 0)) / 100
  const grandTotal = afterDiscount + taxAmount

  // Preset Template Loader
  function handleSelectPreset(presetName: string) {
    setSelectedPreset(presetName)
    const preset = PACKAGE_PRESETS.find(p => p.name === presetName)
    if (preset) {
      if (!title) setTitle(preset.title)

      const newItems = preset.items.map((it, idx) => ({
        id: String(Date.now() + idx),
        description: it.description,
        quantity: it.quantity,
        unit_cost: it.unit_cost
      }))
      setItems(newItems)
      toast.info(`Loaded "${preset.name}" preset!`)
    } else {
      const custom = customPackages.find(p => p.name === presetName)
      if (custom) {
        setTitle(custom.name)
        toast.info(`Selected "${custom.name}" package!`)
      }
    }
  }

  async function handleCreateCustomPreset(e: React.FormEvent) {
    e.preventDefault()
    if (!newCustomPackageName.trim()) {
      toast.error('Package name is required')
      return
    }

    setCreatingCustomPreset(true)
    const res = await createCustomPackage(newCustomPackageName.trim())
    setCreatingCustomPreset(false)

    if (res.error) {
      toast.error(res.error)
      return
    }

    if (res.data) {
      toast.success(`Custom Package "${res.data.name}" added successfully!`)
      setCustomPackages(prev => [res.data!, ...prev])
      setSelectedPreset(res.data.name)
      if (!title) setTitle(res.data.name)
      setNewCustomPackageName('')
      setIsAddPresetModalOpen(false)
    }
  }

  async function handleDeleteCustomPreset(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete custom package "${name}"?`)) return

    setDeletingCustomId(id)
    const res = await deleteCustomPackage(id)
    setDeletingCustomId(null)

    if (res.error) {
      toast.error(res.error)
      return
    }

    toast.success(`Package "${name}" deleted!`)
    setCustomPackages(prev => prev.filter(p => p.id !== id))
    if (selectedPreset === name) {
      setSelectedPreset('')
    }
  }

  // Row Manipulation
  function updateLineItem(id: string, field: keyof LineItem, val: string | number) {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: val }
      }
      return item
    }))
  }

  function addRowBelow(index: number) {
    const newItem: LineItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(index + items.length + 1),
      description: '',
      quantity: 1,
      unit_cost: 0
    }
    const updated = [...items]
    updated.splice(index + 1, 0, newItem)
    setItems(updated)
  }

  function removeRow(index: number) {
    if (items.length <= 1) {
      toast.warning('Package must have at least one line item')
      return
    }
    const updated = items.filter((_, idx) => idx !== index)
    setItems(updated)
  }

  // Keyboard shortcut: Pressing Enter on last unit cost box adds a new row
  function handleKeyDownOnLastCost(e: React.KeyboardEvent, index: number) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addRowBelow(index)
    }
  }

  function handleClientCreated(newClient: { id: string; company_name: string; contact_person?: string }) {
    setClients(prev => [newClient, ...prev])
    setSelectedClientId(newClient.id)
  }

  async function handleSavePackage(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedClientId) {
      toast.error('Please select a client')
      return
    }
    if (!title.trim()) {
      toast.error('Package title is required')
      return
    }

    const validItems = items.filter(it => it.description.trim().length > 0)
    if (validItems.length === 0) {
      toast.error('Please enter at least one line item description')
      return
    }

    setSaving(true)
    const formData = new FormData()
    formData.append('client_id', selectedClientId)
    formData.append('title', title.trim())
    formData.append('preset_template', selectedPreset)
    formData.append('creation_date', creationDate)
    formData.append('status', 'in_progress')
    formData.append('payment_status', paymentStatus)
    formData.append('payment_method', paymentMethod)
    formData.append('discount_amount', String(discountAmount))
    formData.append('tax_percent', String(taxPercent))
    formData.append('notes', notes)
    formData.append('items', JSON.stringify(validItems))

    const res = await createPackage(formData)
    setSaving(false)

    if (res.error) {
      toast.error(res.error)
      return
    }

    toast.success('Package saved successfully!')
    router.push('/admin/packages')
  }

  const selectedClient = clients.find(c => c.id === selectedClientId)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/packages"
            className="w-9 h-9 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Package Creation & Invoice Builder
            </h1>
            <p className="text-xs text-on-surface-variant">
              Generate custom video packages & client invoices
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSavePackage}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Package
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Builder (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section A: Client & Package Info */}
          <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-outline-variant/40 pb-2">
              <FileText className="w-4 h-4 text-primary" />
              1. Client & Package Header
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Searchable Client Dropdown & Quick Add Modal */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Client Name <span className="text-error">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    disabled={loadingClients}
                    className="flex-1 px-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                  >
                    <option value="">-- Select Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}{c.contact_person ? ` (${c.contact_person})` : ''}
                      </option>
                    ))}
                  </select>

                  <QuickClientModal onClientCreated={handleClientCreated} />
                </div>
              </div>

              {/* Creation Date Picker */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Creation Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant/70" />
                  <input
                    type="date"
                    value={creationDate}
                    onChange={(e) => setCreationDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Package Title */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Package Name / Title <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='e.g. "4 Videos + 3 Designs"'
                  className="w-full px-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              {/* Package Presets / Templates */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-on-surface-variant">
                    Package Presets / Templates
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddPresetModalOpen(true)}
                    className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add Package
                  </button>
                </div>
                <div className="relative">
                  <Sparkles className="w-4 h-4 absolute left-3 top-3 text-amber-500" />
                  <select
                    value={selectedPreset}
                    onChange={(e) => handleSelectPreset(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                  >
                    <option value="">-- Load Pre-made Template --</option>
                    <optgroup label="System Templates">
                      {PACKAGE_PRESETS.map(p => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </optgroup>
                    {customPackages.length > 0 && (
                      <optgroup label="Custom Packages">
                        {customPackages.map(cp => (
                          <option key={cp.id} value={cp.name}>{cp.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Spreadsheet-Style Line Item Grid */}
          <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                2. Spreadsheet Line Item Grid
              </h3>
              <span className="text-[11px] text-on-surface-variant font-mono">
                Press Enter on cost box to insert row
              </span>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto rounded-xl border border-outline-variant/50">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-high text-on-surface-variant font-semibold uppercase text-[10px] tracking-wider border-b border-outline-variant/50">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-32 text-right">Unit Cost (Rs.)</th>
                    <th className="py-2.5 px-3 w-32 text-right">Subtotal (Rs.)</th>
                    <th className="py-2.5 px-2 w-16 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {items.map((item, idx) => {
                    const rowSubtotal = (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0)
                    const isLast = idx === items.length - 1
                    return (
                      <tr key={item.id} className="hover:bg-surface-container-high/40 transition-colors">
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                            placeholder="Service or item description..."
                            className="w-full px-2.5 py-1.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full text-center px-2 py-1.5 text-xs font-mono bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unit_cost}
                            onChange={(e) => updateLineItem(item.id, 'unit_cost', parseFloat(e.target.value) || 0)}
                            onKeyDown={(e) => isLast && handleKeyDownOnLastCost(e, idx)}
                            className="w-full text-right px-2 py-1.5 text-xs font-mono bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                          />
                        </td>
                        <td className="p-2 text-right font-mono font-semibold text-foreground">
                          Rs. {rowSubtotal.toLocaleString()}
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => addRowBelow(idx)}
                              title="Insert row below"
                              className="p-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => removeRow(idx)}
                              disabled={items.length <= 1}
                              title="Remove row"
                              className="p-1 rounded-md bg-error/10 text-error hover:bg-error/20 transition-colors disabled:opacity-30"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section C: Financial Calculations & Options */}
          <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-outline-variant/40 pb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              3. Financial Summary & Payment Options
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Toggles / Fixed Discount & Tax */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Fixed Discount Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm font-mono bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Tax Percentage (VAT/GST %)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 13"
                    className="w-full px-3 py-2 text-sm font-mono bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
              </div>

              {/* Payment Status & Method */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Fully Paid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Payment Method
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant/70" />
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="qr_code">QR Code</option>
                      <option value="cheque">Cheque</option>
                      <option value="esewa">eSewa</option>
                      <option value="khalti">Khalti</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes / Terms */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Invoice Notes & Terms
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment due within 15 days of invoice date..."
                className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
              />
            </div>

            {/* Grand Total Highlight */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Live Grand Total</span>
                <p className="text-[11px] text-on-surface-variant">Includes subtotal, discounts & taxes</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-primary">
                  Rs. {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Live Preview Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <InvoicePreview
            clientName={selectedClient?.company_name || ''}
            clientEmail={selectedClient?.contact_email}
            clientPhone={selectedClient?.phone_number}
            packageTitle={title}
            creationDate={creationDate}
            items={items}
            discountAmount={discountAmount}
            taxPercent={taxPercent}
            paymentStatus={paymentStatus}
            paymentMethod={paymentMethod}
            notes={notes}
          />
        </div>
      </div>

      {/* Add & Manage Custom Packages Modal */}
      {isAddPresetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-outline-variant/60 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-base text-foreground tracking-tight">Add & Manage Custom Packages</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPresetModalOpen(false)}
                className="p-1 text-on-surface-variant hover:text-foreground rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form to Create New Custom Package */}
            <form onSubmit={handleCreateCustomPreset} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Custom Package Name
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={newCustomPackageName}
                    onChange={(e) => setNewCustomPackageName(e.target.value)}
                    placeholder="e.g. Social Media & Reels Bundle"
                    className="flex-1 px-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                  <button
                    type="submit"
                    disabled={creatingCustomPreset || !newCustomPackageName.trim()}
                    className="flex items-center gap-1 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-xs transition-all disabled:opacity-50 shrink-0"
                  >
                    {creatingCustomPreset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Save
                  </button>
                </div>
              </div>
            </form>

            {/* Existing Custom Packages List with Delete Action */}
            <div className="space-y-2 pt-2 border-t border-outline-variant/40">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Saved Custom Packages ({customPackages.length})
              </h4>
              {customPackages.length === 0 ? (
                <p className="text-xs text-on-surface-variant/70 italic py-2">
                  No custom packages added yet. Type a name above to create one.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {customPackages.map((cp) => (
                    <div
                      key={cp.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 hover:border-outline-variant transition-colors"
                    >
                      <span className="text-xs font-medium text-foreground truncate pr-2">
                        {cp.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomPreset(cp.id, cp.name)}
                        disabled={deletingCustomId === cp.id}
                        className="p-1 text-error hover:bg-error/10 rounded-lg transition-colors shrink-0"
                        title="Delete custom package"
                      >
                        {deletingCustomId === cp.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-outline-variant/40">
              <button
                type="button"
                onClick={() => setIsAddPresetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-foreground rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
