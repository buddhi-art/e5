'use client'

import { useRef, useState } from 'react'
import { Film, Printer, Download, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export interface InvoicePreviewProps {
  clientName: string
  clientEmail?: string
  clientPhone?: string
  packageTitle: string
  packageNumber?: string
  creationDate: string
  items: Array<{
    description: string
    quantity: number
    unit_cost: number
  }>
  discountAmount: number
  taxPercent: number
  paymentStatus: string
  paymentMethod: string
  notes?: string
}

export function InvoicePreview({
  clientName,
  clientEmail,
  clientPhone,
  packageTitle,
  packageNumber = 'INV-2026-DRAFT',
  creationDate,
  items,
  discountAmount,
  taxPercent,
  paymentStatus,
  paymentMethod,
  notes
}: InvoicePreviewProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  // Subtotal calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_cost || 0)), 0)
  const afterDiscount = Math.max(0, subtotal - Number(discountAmount || 0))
  const taxAmount = (afterDiscount * Number(taxPercent || 0)) / 100
  const grandTotal = afterDiscount + taxAmount

  function handlePrint() {
    window.print()
  }

  async function handleDownloadPDF() {
    if (!invoiceRef.current) return
    setDownloading(true)
    const toastId = toast.loading('Generating PDF invoice...')

    try {
      const element = invoiceRef.current

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          const target = clonedDoc.getElementById('printable-invoice')
          if (target) {
            target.style.width = '800px'
            target.style.maxWidth = '800px'
            target.style.margin = '0 auto'
            target.style.backgroundColor = '#ffffff'
            target.style.color = '#0f172a'
            const allElements = target.getElementsByTagName('*')
            for (let i = 0; i < allElements.length; i++) {
              const el = allElements[i] as HTMLElement
              const style = window.getComputedStyle(el)
              if (style.color && (style.color.includes('oklch') || style.color.includes('var('))) {
                el.style.color = '#1e293b'
              }
              if (style.backgroundColor && (style.backgroundColor.includes('oklch') || style.backgroundColor.includes('var('))) {
                el.style.backgroundColor = style.backgroundColor.includes('white') ? '#ffffff' : '#f8fafc'
              }
            }
          }
        }
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      const cleanFileName = `Invoice_${(clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_')}_${creationDate || 'Draft'}.pdf`
      pdf.save(cleanFileName)

      toast.dismiss(toastId)
      toast.success(`Invoice downloaded: ${cleanFileName}`)
    } catch (err) {
      console.error('PDF generation error, switching to fallback PDF generator:', err)
      try {
        const pdf = new jsPDF('p', 'mm', 'a4')
        const cleanFileName = `Invoice_${(clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_')}_${creationDate || 'Draft'}.pdf`

        pdf.setFontSize(18)
        pdf.text('E5 CHRONICLES - INVOICE', 14, 20)
        pdf.setFontSize(10)
        pdf.text(`Invoice #: ${packageNumber}`, 14, 28)
        pdf.text(`Date: ${creationDate || new Date().toISOString().split('T')[0]}`, 14, 34)
        pdf.text(`Billed To: ${clientName || 'Client'}`, 14, 40)
        if (clientEmail) pdf.text(`Email: ${clientEmail}`, 14, 46)
        if (clientPhone) pdf.text(`Phone: ${clientPhone}`, 14, 52)

        pdf.setFontSize(12)
        pdf.text(`Package Title: ${packageTitle}`, 14, 62)

        let y = 72
        pdf.setFontSize(10)
        pdf.text('Description', 14, y)
        pdf.text('Qty', 130, y)
        pdf.text('Unit Cost', 150, y)
        pdf.text('Subtotal', 180, y)
        y += 4
        pdf.line(14, y, 196, y)
        y += 6

        items.forEach((item) => {
          const lineTotal = Number(item.quantity || 0) * Number(item.unit_cost || 0)
          pdf.text((item.description || 'Item').substring(0, 45), 14, y)
          pdf.text(String(item.quantity || 1), 130, y)
          pdf.text(`Rs. ${Number(item.unit_cost || 0).toLocaleString()}`, 150, y)
          pdf.text(`Rs. ${lineTotal.toLocaleString()}`, 180, y)
          y += 8
        })

        y += 4
        pdf.line(14, y, 196, y)
        y += 8
        pdf.setFontSize(12)
        pdf.text(`Grand Total: Rs. ${grandTotal.toLocaleString()}`, 14, y)

        pdf.save(cleanFileName)
        toast.dismiss(toastId)
        toast.success(`Invoice downloaded: ${cleanFileName}`)
      } catch (fallbackErr) {
        console.error('Fallback PDF error:', fallbackErr)
        toast.dismiss(toastId)
        toast.error('Failed to generate PDF. Please use "Print View" and select Save as PDF.')
      }
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-surface-container-high border border-outline-variant/60 rounded-2xl p-4 shadow-sm">
        <div>
          <h4 className="font-semibold text-sm text-foreground">Live Invoice Card & Export</h4>
          <p className="text-xs text-on-surface-variant">Real-time formatted invoice preview</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-surface-container-highest text-foreground hover:bg-outline-variant/40 rounded-xl transition-all shadow-xs"
          >
            <Printer className="w-4 h-4 text-primary" />
            Print View
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Exporting...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Invoice Card Container */}
      <div
        ref={invoiceRef}
        id="printable-invoice"
        className="bg-white text-slate-900 border border-slate-200 rounded-2xl p-8 shadow-xl space-y-6 print:p-0 print:border-none print:shadow-none font-sans"
      >
        {/* Header Branding */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-xl text-slate-900 tracking-tight">E5 CHRONICLES</h2>
              <p className="text-xs text-slate-500 font-medium">Creative Media & Video Production</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-lg mb-1">
              INVOICE
            </span>
            <p className="text-xs font-mono font-bold text-slate-700">{packageNumber}</p>
            <p className="text-xs text-slate-500">Date: {creationDate || new Date().toISOString().split('T')[0]}</p>
          </div>
        </div>

        {/* Client & Company Information Grid */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Billed To:</span>
            <p className="font-bold text-sm text-slate-900">{clientName || 'Select a Client'}</p>
            {clientEmail && <p className="text-xs text-slate-600">{clientEmail}</p>}
            {clientPhone && <p className="text-xs text-slate-600">{clientPhone}</p>}
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Package Title:</span>
            <p className="font-bold text-sm text-indigo-900">{packageTitle || 'Untitled Package'}</p>
            <div className="mt-2 flex items-center justify-end gap-2">
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                paymentStatus === 'paid'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : paymentStatus === 'partially_paid'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {paymentStatus === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {paymentStatus.replace('_', ' ').toUpperCase()}
              </span>

              <span className="text-[11px] text-slate-500 font-medium">
                ({paymentMethod.replace('_', ' ')})
              </span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {items.map((item, idx) => {
                const lineTotal = Number(item.quantity || 0) * Number(item.unit_cost || 0)
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-3 px-4 font-semibold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium">{item.description || 'Line Item'}</td>
                    <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono">Rs. {Number(item.unit_cost || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">Rs. {lineTotal.toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Totals Box */}
        <div className="flex justify-end pt-2">
          <div className="w-64 space-y-2 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="font-medium text-slate-500">Subtotal:</span>
              <span className="font-mono font-semibold">Rs. {subtotal.toLocaleString()}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between py-1 text-emerald-600 border-b border-slate-100">
                <span className="font-medium">Discount:</span>
                <span className="font-mono font-semibold">- Rs. {Number(discountAmount).toLocaleString()}</span>
              </div>
            )}

            {taxPercent > 0 && (
              <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                <span className="font-medium">Tax ({taxPercent}%):</span>
                <span className="font-mono font-semibold">+ Rs. {taxAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-bold text-slate-900">
              <span>Grand Total:</span>
              <span className="font-mono text-indigo-700 text-base">Rs. {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms Footer */}
        {notes && (
          <div className="border-t border-slate-200 pt-4 text-xs text-slate-500">
            <span className="font-bold text-slate-700 block mb-1">Notes & Terms:</span>
            <p className="whitespace-pre-line leading-relaxed">{notes}</p>
          </div>
        )}

        <div className="border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400">
          Thank you for choosing E5 Chronicles. For billing inquiries, contact billing@e5chronicles.com
        </div>
      </div>
    </div>
  )
}
