/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Package, ArrowLeft, Camera, Video, DollarSign, Plus,
  MapPin, Calendar, Users, Truck, RotateCcw, Link2, MessageSquare,
  CheckCircle2, Clock, PlayCircle, Loader2, Save, CreditCard, ShieldAlert,
  History, Sparkles, Download, Printer, FileText, X
} from 'lucide-react'
import { toast } from 'sonner'
import { InvoicePreview } from '@/components/admin/packages/invoice-preview'
import {
  getPackageDetails,
  incrementRevisionCount,
  updateLogistics,
  updatePostProduction,
  updateDeliverableStatus,
  addPackageDeliverable,
  recordPackagePayment,
  getEmployeesForSelect
} from '../actions'

export default function PackageWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: packageId } = use(params)

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'logistics' | 'postprod' | 'payments'>('logistics')

  // Data from backend
  const [pkgData, setPkgData] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])

  // Tab 1: Logistics state
  const [locationAddress, setLocationAddress] = useState('')
  const [shootDate, setShootDate] = useState('')
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [vehicleInput, setVehicleInput] = useState('')
  const [vehiclesTaken, setVehiclesTaken] = useState<string[]>([])
  const [savingLogistics, setSavingLogistics] = useState(false)

  // Site Revision Modal
  const [revisionModalOpen, setRevisionModalOpen] = useState(false)
  const [visitReason, setVisitReason] = useState('')
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().split('T')[0])

  // PDF Invoice Export Modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [visitStaffIds, setVisitStaffIds] = useState<string[]>([])
  const [incrementing, setIncrementing] = useState(false)

  // Tab 2: Post-Production state
  const [selectedEditorIds, setSelectedEditorIds] = useState<string[]>([])
  const [deliverableLinks, setDeliverableLinks] = useState('')
  const [clientRevisionNotes, setClientRevisionNotes] = useState('')
  const [newDeliverableTitle, setNewDeliverableTitle] = useState('')
  const [savingPostProd, setSavingPostProd] = useState(false)

  // Tab 3: Payments state
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [recordingPayment, setRecordingPayment] = useState(false)

  async function loadData() {
    setLoading(true)
    const [res, empList] = await Promise.all([
      getPackageDetails(packageId),
      getEmployeesForSelect()
    ])
    setLoading(false)

    if (res.error || !res.package) {
      toast.error(res.error || 'Failed to load package workspace')
      return
    }

    setPkgData(res)
    setEmployees(empList || [])

    // Populate logistics form
    if (res.logistics) {
      setLocationAddress(res.logistics.location_address || '')
      setShootDate(res.logistics.shoot_date || '')
      setSelectedStaffIds(res.logistics.assigned_staff_ids || [])
      setVehiclesTaken(res.logistics.vehicles_taken || [])
    }

    // Populate postprod form
    if (res.postProd) {
      setSelectedEditorIds(res.postProd.assigned_editor_ids || [])
      setDeliverableLinks(res.postProd.deliverable_links || '')
      setClientRevisionNotes(res.postProd.client_revision_notes || '')
    }
  }

  useEffect(() => {
    loadData()
  }, [packageId])

  // Handlers for Tab 1
  async function handleSaveLogistics(e: React.FormEvent) {
    e.preventDefault()
    setSavingLogistics(true)
    const res = await updateLogistics(packageId, {
      locationAddress,
      shootDate,
      assignedStaffIds: selectedStaffIds,
      vehiclesTaken
    })
    setSavingLogistics(false)

    if (res.error) {
      toast.error(res.error)
      return
    }

    toast.success('Logistics & Staff assignments updated!')
    loadData()
  }

  function handleAddVehicle() {
    if (!vehicleInput.trim()) return
    setVehiclesTaken(prev => [...prev, vehicleInput.trim()])
    setVehicleInput('')
  }

  function handleRemoveVehicle(idx: number) {
    setVehiclesTaken(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleIncrementRevision(e: React.FormEvent) {
    e.preventDefault()
    if (!visitReason.trim()) {
      toast.error('Visit reason is required')
      return
    }

    setIncrementing(true)
    const res = await incrementRevisionCount(packageId, visitDate, visitStaffIds, visitReason)
    setIncrementing(false)

    if (res.error) {
      toast.error(res.error)
      return
    }

    toast.success(`Revision count incremented to ${res.revisionCount}!`)
    setRevisionModalOpen(false)
    setVisitReason('')
    setVisitStaffIds([])
    loadData()
  }

  // Handlers for Tab 2
  async function handleSavePostProd(e: React.FormEvent) {
    e.preventDefault()
    setSavingPostProd(true)
    const res = await updatePostProduction(packageId, {
      assignedEditorIds: selectedEditorIds,
      deliverableLinks,
      clientRevisionNotes
    })
    setSavingPostProd(false)

    if (res.error) {
      toast.error(res.error)
      return
    }

    toast.success('Post-production details saved!')
    loadData()
  }

  async function handleStatusChange(deliverableId: string, newStatus: any) {
    const res = await updateDeliverableStatus(deliverableId, packageId, newStatus)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success(`Deliverable status updated`)
    loadData()
  }

  async function handleAddDeliverable(e: React.FormEvent) {
    e.preventDefault()
    if (!newDeliverableTitle.trim()) return

    const res = await addPackageDeliverable(packageId, newDeliverableTitle)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success('Deliverable added!')
    setNewDeliverableTitle('')
    loadData()
  }

  // Handlers for Tab 3
  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(paymentAmount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    setRecordingPayment(true)
    const formData = new FormData()
    formData.append('package_id', packageId)
    formData.append('amount', String(amt))
    formData.append('payment_date', paymentDate)
    formData.append('payment_method', paymentMethod)
    formData.append('notes', paymentNotes)

    const res = await recordPackagePayment(formData)
    setRecordingPayment(false)

    if (res.error) {
      toast.error(res.error)
      return
    }

    toast.success('Payment recorded successfully!')
    setPaymentAmount('')
    setPaymentNotes('')
    loadData()
  }

  if (loading || !pkgData) {
    return (
      <div className="p-12 text-center text-on-surface-variant space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-sm font-semibold">Loading Package Workspace...</p>
      </div>
    )
  }

  const pkg = pkgData.package
  const client = pkg.clients
  const logistics = pkgData.logistics
  const siteVisits = pkgData.siteVisits || []
  const postProd = pkgData.postProd
  const deliverables = pkgData.deliverables || []
  const payments = pkgData.payments || []
  const auditLogs = pkgData.auditLogs || []

  const remainingBalance = Math.max(0, Number(pkg.grand_total) - Number(pkg.paid_amount))

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/40 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/packages"
              className="w-9 h-9 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-foreground transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 bg-primary/10 rounded-md">
                  {pkg.package_number}
                </span>
                <h1 className="text-lg font-bold text-foreground tracking-tight">
                  {pkg.title}
                </h1>
              </div>

              <p className="text-xs text-on-surface-variant mt-0.5">
                Client: <span className="font-semibold text-foreground">{client?.company_name}</span> • Created: {pkg.creation_date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Grand Total</span>
              <span className="text-lg font-black font-mono text-primary">Rs. {Number(pkg.grand_total).toLocaleString()}</span>
            </div>

            <div className="h-8 w-px bg-outline-variant/60" />

            <div className="text-right">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Paid Amount</span>
              <span className="text-lg font-black font-mono text-emerald-600">Rs. {Number(pkg.paid_amount).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Status badges bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1 font-bold px-3 py-1 rounded-full text-xs ${
              pkg.payment_status === 'paid'
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : pkg.payment_status === 'partially_paid'
                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
            }`}>
              {pkg.payment_status === 'paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              Payment: {(pkg.payment_status || 'unpaid').replace('_', ' ').toUpperCase()}
            </span>

            <span className="text-on-surface-variant font-medium">
              Site Revision Visits: <span className="font-bold text-foreground font-mono">{logistics.revision_count}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {remainingBalance > 0 && (
              <span className="text-rose-600 font-semibold font-mono bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                Remaining Balance: Rs. {remainingBalance.toLocaleString()}
              </span>
            )}

            <button
              type="button"
              onClick={() => setShowInvoiceModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all shadow-md shrink-0"
            >
              <Download className="w-4 h-4" />
              Download PDF Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-px">
        <button
          onClick={() => setActiveTab('logistics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'logistics'
              ? 'border-primary text-primary bg-primary/10'
              : 'border-transparent text-on-surface-variant hover:text-foreground hover:bg-surface-container-high/40'
          }`}
        >
          <Camera className="w-4 h-4" />
          Tab 1: Videography & On-Site Logistics
        </button>

        <button
          onClick={() => setActiveTab('postprod')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'postprod'
              ? 'border-primary text-primary bg-primary/10'
              : 'border-transparent text-on-surface-variant hover:text-foreground hover:bg-surface-container-high/40'
          }`}
        >
          <Video className="w-4 h-4" />
          Tab 2: Post-Production & Editing Hub
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'payments'
              ? 'border-primary text-primary bg-primary/10'
              : 'border-transparent text-on-surface-variant hover:text-foreground hover:bg-surface-container-high/40'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Tab 3: Payments & Activity Log
        </button>
      </div>

      {/* Tab 1 Content: On-Site Logistics */}
      {activeTab === 'logistics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Revision Counter & History (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Revision Counter Card */}
              <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-primary" />
                    Site Revision Tracker
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full">
                    {logistics.revision_count === 0 ? '0 Trips (Finished in 1)' : `${logistics.revision_count} Extra Trips`}
                  </span>
                </div>

                <div className="bg-surface-container-high/60 rounded-xl p-4 text-center space-y-2">
                  <span className="text-xs text-on-surface-variant font-medium block">Total Revision Count</span>
                  <span className="text-4xl font-black font-mono text-foreground block">
                    {logistics.revision_count}
                  </span>
                  <p className="text-[11px] text-on-surface-variant">
                    0 = Finished on first trip. Increment every extra site visit.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-xl shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  + Increment Revision & Log Visit
                </button>
              </div>

              {/* Visit Log History Timeline */}
              <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-outline-variant/40 pb-2">
                  <History className="w-4 h-4 text-primary" />
                  Visit Log History ({siteVisits.length})
                </h3>

                {siteVisits.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic py-4 text-center">
                    No extra site revision visits logged yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {siteVisits.map((visit: any, idx: number) => {
                      const staffNames = (visit.staff_ids || []).map((stId: string) => {
                        const emp = employees.find(e => e.id === stId)
                        return emp?.full_name || stId
                      })
                      return (
                        <div key={visit.id || idx} className="p-3 bg-surface-container-high/40 rounded-xl border border-outline-variant/40 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-on-surface-variant font-semibold">
                            <span>Visit Date: {visit.visit_date}</span>
                            <span className="text-[10px] text-primary font-mono">By: {visit.profiles?.full_name || 'Admin'}</span>
                          </div>

                          <p className="text-foreground font-medium">{visit.reason}</p>

                          {staffNames.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 pt-1">
                              <span className="text-[10px] text-on-surface-variant">Staff:</span>
                              {staffNames.map((stName: string) => (
                                <span key={stName} className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-semibold">
                                  {stName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Logistics Details (7 cols) */}
            <div className="lg:col-span-7">
              <form onSubmit={handleSaveLogistics} className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5 shadow-sm space-y-5">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-outline-variant/40 pb-2">
                  <Truck className="w-4 h-4 text-primary" />
                  Staff Assignment, Location & Transport
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Shoot Location */}
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                      Shoot Location Address / Google Maps Link
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant/70" />
                      <input
                        type="text"
                        value={locationAddress}
                        onChange={(e) => setLocationAddress(e.target.value)}
                        placeholder="e.g. Hotel Himalaya, Lalitpur"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                      />
                    </div>
                  </div>

                  {/* Shoot Date */}
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                      Shoot Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant/70" />
                      <input
                        type="date"
                        value={shootDate}
                        onChange={(e) => setShootDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                      />
                    </div>
                  </div>
                </div>

                {/* Staff Assignment Multi-Select */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 flex items-center justify-between">
                    <span>On-Site Staff / Videographers</span>
                    <span className="text-[10px] text-on-surface-variant">Tag team members who went on site</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant max-h-52 overflow-y-auto">
                    {employees.map(emp => {
                      const isSelected = selectedStaffIds.includes(emp.id)
                      const vehicleInfo = emp.social_urls?.vehicle_details || (emp.social_urls?.vehicle === 'yes' ? 'Owns Vehicle' : '')
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedStaffIds(prev => prev.filter(id => id !== emp.id))
                            } else {
                              setSelectedStaffIds(prev => [...prev, emp.id])
                            }
                          }}
                          className={`p-2.5 rounded-lg text-xs font-medium text-left border transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-primary/10 border-primary text-primary font-semibold'
                              : 'border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                        >
                          <div className="truncate">
                            <span className="block font-semibold truncate text-foreground">{emp.full_name}</span>
                            <span className="text-[10px] text-on-surface-variant block">{emp.designation || 'Staff'}</span>
                            {vehicleInfo && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                                🏍️ {vehicleInfo}
                              </span>
                            )}
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Vehicles & Transport Log */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Vehicles & Transport Log
                  </label>

                  {/* Dropdown to select from employee vehicles */}
                  <div className="flex items-center gap-2 mb-2">
                    <select
                      value=""
                      onChange={(e) => {
                        const val = e.target.value
                        if (val && !vehiclesTaken.includes(val)) {
                          setVehiclesTaken(prev => [...prev, val])
                        }
                        e.target.value = ''
                      }}
                      className="flex-1 px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                    >
                      <option value="">-- Select Employee Vehicle --</option>
                      {employees.filter(emp => emp.social_urls?.vehicle === 'yes' || emp.social_urls?.vehicle_details).map(emp => {
                        const vehicleLabel = emp.social_urls?.vehicle_details
                          ? `${emp.full_name} — ${emp.social_urls.vehicle_details}`
                          : `${emp.full_name}'s Vehicle`
                        const isAlreadyAdded = vehiclesTaken.includes(vehicleLabel)
                        return (
                          <option key={emp.id} value={vehicleLabel} disabled={isAlreadyAdded}>
                            {vehicleLabel}{isAlreadyAdded ? ' (Already Added)' : ''}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  {/* Manual vehicle entry */}
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={vehicleInput}
                      onChange={(e) => setVehicleInput(e.target.value)}
                      placeholder='Or type manually: "Yamaha FZ - Ba 2 Pa 1234"'
                      className="flex-1 px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                    <button
                      type="button"
                      onClick={handleAddVehicle}
                      className="px-3 py-2 text-xs font-semibold bg-surface-container-high text-foreground hover:bg-outline-variant/40 rounded-xl transition-all border border-outline-variant/60 shrink-0"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Tagged vehicles */}
                  <div className="flex flex-wrap items-center gap-2">
                    {vehiclesTaken.map((veh, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-high text-foreground rounded-full text-xs font-medium border border-outline-variant/60">
                        <Truck className="w-3 h-3 text-primary" />
                        {veh}
                        <button type="button" onClick={() => handleRemoveVehicle(idx)} className="text-on-surface-variant hover:text-error">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end border-t border-outline-variant/40 pt-3">
                  <button
                    type="submit"
                    disabled={savingLogistics}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {savingLogistics && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Logistics Details
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2 Content: Post-Production & Editing Hub */}
      {activeTab === 'postprod' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Editor Info & Checklist (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Deliverable Progress Checklist */}
            <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-primary" />
                  Deliverable Progress Checklist ({deliverables.length})
                </h3>
              </div>

              {/* Add New Deliverable Bar */}
              <form onSubmit={handleAddDeliverable} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newDeliverableTitle}
                  onChange={(e) => setNewDeliverableTitle(e.target.value)}
                  placeholder="e.g. 1x Reel Video #4"
                  className="flex-1 px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Add Deliverable
                </button>
              </form>

              {/* Checklist Table */}
              <div className="overflow-hidden rounded-xl border border-outline-variant/50">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-high text-on-surface-variant font-semibold uppercase text-[10px] tracking-wider border-b border-outline-variant/50">
                    <tr>
                      <th className="py-2.5 px-3">Deliverable Item</th>
                      <th className="py-2.5 px-3 text-center">Status Tag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {deliverables.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="py-6 text-center text-on-surface-variant">
                          No deliverable items added yet.
                        </td>
                      </tr>
                    ) : (
                      deliverables.map((del: any) => (
                        <tr key={del.id} className="hover:bg-surface-container-high/40 transition-colors">
                          <td className="py-3 px-3 font-semibold text-foreground">
                            {del.title}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <select
                              value={del.status}
                              onChange={(e) => handleStatusChange(del.id, e.target.value)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                                del.status === 'approved'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                  : del.status === 'client_review'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                  : del.status === 'in_editing'
                                  ? 'bg-sky-500/10 text-sky-600 border-sky-500/30'
                                  : 'bg-surface-container-high text-on-surface-variant border-outline-variant'
                              }`}
                            >
                              <option value="not_started">Not Started</option>
                              <option value="in_editing">In Editing</option>
                              <option value="client_review">Client Review</option>
                              <option value="approved">Approved</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Editor Info & Project Links (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <form onSubmit={handleSavePostProd} className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-outline-variant/40 pb-2">
                <Users className="w-4 h-4 text-primary" />
                Assigned Editors & Project Links
              </h3>

              {/* Editor Assignment Multi-Select */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Assigned Video Editors
                </label>
                <div className="grid grid-cols-2 gap-2 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant max-h-36 overflow-y-auto">
                  {employees.map(emp => {
                    const isSelected = selectedEditorIds.includes(emp.id)
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedEditorIds(prev => prev.filter(id => id !== emp.id))
                          } else {
                            setSelectedEditorIds(prev => [...prev, emp.id])
                          }
                        }}
                        className={`p-2 rounded-lg text-xs font-medium text-left border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary font-semibold'
                            : 'border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        <span className="truncate">{emp.full_name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Deliverable Links Box */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Deliverable Folder Links (Google Drive / Frame.io)
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant/70" />
                  <input
                    type="url"
                    value={deliverableLinks}
                    onChange={(e) => setDeliverableLinks(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
              </div>

              {/* Client Revision Notes */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Client Revision Notes & Feedback
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant/70" />
                  <textarea
                    rows={3}
                    value={clientRevisionNotes}
                    onChange={(e) => setClientRevisionNotes(e.target.value)}
                    placeholder="Log client feedback for video edits..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end border-t border-outline-variant/40 pt-3">
                <button
                  type="submit"
                  disabled={savingPostProd}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {savingPostProd && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Editing Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3 Content: Payments & Activity Audit Log */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Record Payment & History (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Record Payment Form */}
            <form onSubmit={handleRecordPayment} className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-outline-variant/40 pb-2">
                <CreditCard className="w-4 h-4 text-primary" />
                Record Partial / Full Payment
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Amount Received (Rs.) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full px-3 py-2 text-xs font-mono bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="qr_code">QR Code</option>
                    <option value="cheque">Cheque</option>
                    <option value="esewa">eSewa</option>
                    <option value="khalti">Khalti</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Payment Notes / Ref #
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g. Cheque #49201"
                    className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={recordingPayment}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {recordingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                Record Payment Entry
              </button>
            </form>

            {/* Payments Log Table */}
            <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-outline-variant/40 pb-2">
                <History className="w-4 h-4 text-primary" />
                Payment History ({payments.length})
              </h3>

              {payments.length === 0 ? (
                <p className="text-xs text-on-surface-variant italic text-center py-4">
                  No payment entries recorded yet.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-outline-variant/50">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container-high text-on-surface-variant font-semibold uppercase text-[10px] tracking-wider border-b border-outline-variant/50">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40">
                      {payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-surface-container-high/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-on-surface-variant">{p.payment_date}</td>
                          <td className="py-2.5 px-3 font-semibold text-foreground capitalize">{p.payment_method.replace('_', ' ')}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                            Rs. {Number(p.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Activity Audit Trail (6 cols) */}
          <div className="lg:col-span-6">
            <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-outline-variant/40 pb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Activity Audit Trail ({auditLogs.length})
              </h3>

              {auditLogs.length === 0 ? (
                <p className="text-xs text-on-surface-variant italic text-center py-4">
                  No activity logged yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="p-3 bg-surface-container-high/40 rounded-xl border border-outline-variant/40 text-xs space-y-1">
                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span className="font-semibold text-primary">{log.profiles?.full_name || 'Admin'}</span>
                        <span className="text-[10px] font-mono text-on-surface-variant/70">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed font-medium">{log.action}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal Dialog */}
      {revisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-outline-variant/60 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-base text-foreground tracking-tight">Increment Revision Visit</h3>
              </div>
            </div>

            <form onSubmit={handleIncrementRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Visit Reason <span className="text-error">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  placeholder="e.g. Additional video shoot requested by client for extra product line"
                  className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Visit Date
                </label>
                <input
                  type="date"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Staff Who Went On Site
                </label>
                <div className="grid grid-cols-2 gap-2 bg-surface-container-lowest p-2 rounded-xl border border-outline-variant max-h-32 overflow-y-auto">
                  {employees.map(emp => {
                    const isSelected = visitStaffIds.includes(emp.id)
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setVisitStaffIds(prev => prev.filter(id => id !== emp.id))
                          } else {
                            setVisitStaffIds(prev => [...prev, emp.id])
                          }
                        }}
                        className={`p-1.5 rounded-lg text-xs font-medium text-left transition-all ${
                          isSelected ? 'bg-primary/10 text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        {emp.full_name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-foreground rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={incrementing}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {incrementing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Visit Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Export Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-outline-variant/60 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Package Invoice Export</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="p-1 text-on-surface-variant hover:text-foreground rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <InvoicePreview
              clientName={client?.company_name || ''}
              clientEmail={client?.contact_email}
              clientPhone={client?.phone_number}
              packageTitle={pkg.title}
              packageNumber={pkg.package_number}
              creationDate={pkg.creation_date}
              items={pkgData.items || []}
              discountAmount={Number(pkg.discount_amount || 0)}
              taxPercent={Number(pkg.tax_percent || 0)}
              paymentStatus={pkg.payment_status}
              paymentMethod={pkg.payment_method || 'bank_transfer'}
              notes={pkg.notes}
            />
          </div>
        </div>
      )}
    </div>
  )
}
