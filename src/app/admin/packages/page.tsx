/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Package, Plus, Search, Filter, Calendar, DollarSign,
  CheckCircle2, Clock, Trash2, Eye, Edit, ChevronLeft, ChevronRight,
  TrendingUp, AlertCircle, RefreshCw, Loader2, X
} from 'lucide-react'
import { toast } from 'sonner'
import { getPackagesList, getPackageDashboardMetrics, deletePackage } from './actions'

export default function PackagesListPage() {
  const [packages, setPackages] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Summary Metrics
  const [metrics, setMetrics] = useState({
    totalPackages: 0,
    totalRevenue: 0,
    activePackages: 0,
    pendingPaymentsCount: 0,
  })

  // Search & Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function loadMetrics() {
    const res = await getPackageDashboardMetrics()
    if (res.metrics) {
      setMetrics(res.metrics)
    }
  }

  async function loadPackages() {
    setLoading(true)
    const res = await getPackagesList({
      search,
      status,
      paymentStatus,
      startDate,
      endDate,
      page,
      limit
    })
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
      return
    }

    setPackages(res.data || [])
    setTotalCount(res.total || 0)
  }

  useEffect(() => {
    loadMetrics()
  }, [])

  useEffect(() => {
    loadPackages()
  }, [search, status, paymentStatus, startDate, endDate, page])

  async function ConfirmDelete() {
    if (!deleteTargetId) return
    setDeleting(true)
    const res = await deletePackage(deleteTargetId)
    setDeleting(false)

    if (res.error) {
      toast.error(res.error)
      return
    }

    toast.success('Package soft-deleted successfully!')
    setDeleteTargetId(null)
    loadPackages()
    loadMetrics()
  }

  const totalPages = Math.ceil(totalCount / limit) || 1

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Package & Invoice Directory
          </h1>
          <p className="text-xs text-on-surface-variant">
            Manage video packages, client billing, logistics & deliverables
          </p>
        </div>

        <Link
          href="/admin/packages/create"
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-md transition-all shrink-0 w-fit"
        >
          <Plus className="w-4 h-4" />
          Create New Package
        </Link>
      </div>

      {/* Top Summary Cards (Mini Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Packages Created */}
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Total Packages</span>
            <span className="text-xl font-black text-foreground font-mono">{metrics.totalPackages}</span>
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Total Revenue</span>
            <span className="text-xl font-black text-emerald-600 font-mono">Rs. {metrics.totalRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 3: Active Packages */}
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Active Packages</span>
            <span className="text-xl font-black text-amber-600 font-mono">{metrics.activePackages}</span>
          </div>
        </div>

        {/* Card 4: Pending Payments */}
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Pending Payments</span>
            <span className="text-xl font-black text-rose-600 font-mono">{metrics.pendingPaymentsCount}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Bar */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant/70" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by Client Name or Package Title..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
            />
          </div>

          {/* Payment Status Filter */}
          <div className="lg:col-span-3">
            <select
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
            >
              <option value="all">All Payment Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Fully Paid</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="lg:col-span-5 flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden text-foreground"
            />
            <span className="text-xs text-on-surface-variant font-bold">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-high text-on-surface-variant font-semibold uppercase text-[10px] tracking-wider border-b border-outline-variant/60">
              <tr>
                <th className="py-3 px-4">ID / Invoice #</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Package Title</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-center">Creation Date</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading packages...
                  </td>
                </tr>
              ) : packages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                    No packages found matching criteria.
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => {
                  const client = pkg.clients
                  return (
                    <tr key={pkg.id} className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        {pkg.package_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {client?.company_name || 'Unknown Client'}
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium">
                        {pkg.title}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                        Rs. {Number(pkg.grand_total || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          pkg.payment_status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : pkg.payment_status === 'partially_paid'
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}>
                          {pkg.payment_status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {(pkg.payment_status || 'unpaid').replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-on-surface-variant font-mono">
                        {pkg.creation_date}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/admin/packages/${pkg.id}`}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Manage
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(pkg.id)}
                            className="p-1 text-error hover:bg-error/10 rounded-lg transition-colors"
                            title="Delete Package"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-outline-variant/40 flex items-center justify-between text-xs text-on-surface-variant">
          <span>Showing page {page} of {totalPages} ({totalCount} total packages)</span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold">{page}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Delete */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-outline-variant/60 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
              <h3 className="font-semibold text-base text-foreground">Confirm Soft Delete</h3>
              <button onClick={() => setDeleteTargetId(null)} className="text-on-surface-variant hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Are you sure you want to delete this package? It will be archived and hidden from the package directory.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-foreground rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={ConfirmDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-error text-error-container hover:bg-error/90 rounded-xl transition-all disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
