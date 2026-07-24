'use client'

import { useRef, useState } from 'react'
import { Film, Download, CheckCircle2, Clock, Landmark, FileText, Phone, Mail, MapPin } from 'lucide-react'
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
  paidAmount?: number
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
  paidAmount = 0,
  paymentMethod,
  notes
}: InvoicePreviewProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  // Financial calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_cost || 0)), 0)
  const afterDiscount = Math.max(0, subtotal - Number(discountAmount || 0))
  const taxAmount = (afterDiscount * Number(taxPercent || 0)) / 100
  const grandTotal = afterDiscount + taxAmount

  const effectivePaidAmount = paymentStatus === 'paid'
    ? grandTotal
    : paymentStatus === 'unpaid'
    ? 0
    : Math.min(grandTotal, Math.max(0, Number(paidAmount || 0)))

  const remainingDue = Math.max(0, grandTotal - effectivePaidAmount)

  async function handleDownloadPDF() {
    if (!invoiceRef.current) return
    setDownloading(true)
    const toastId = toast.loading('Generating high-res PDF invoice...')

    try {
      const element = invoiceRef.current

      // Capture HTML invoice as high-res PNG canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1000
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
      const cleanFileName = `Invoice_${(clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_')}_${packageNumber || 'Draft'}.pdf`
      pdf.save(cleanFileName)

      toast.dismiss(toastId)
      toast.success(`Invoice downloaded: ${cleanFileName}`)
    } catch (err) {
      console.error('Canvas capture failed, generating executive fallback PDF:', err)
      try {
        generateExecutivePdfFallback()
        toast.dismiss(toastId)
        toast.success(`Invoice downloaded successfully!`)
      } catch (fallbackErr) {
        console.error('Fallback PDF error:', fallbackErr)
        toast.dismiss(toastId)
        toast.error('Failed to generate PDF. Please use "Print View" and select Save as PDF.')
      }
    } finally {
      setDownloading(false)
    }
  }

  // Executive jsPDF fallback generator with full styling, colors, tables & financial breakdown
  function generateExecutivePdfFallback() {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const cleanFileName = `Invoice_${(clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_')}_${packageNumber || 'Draft'}.pdf`

    // Colors
    const primaryNavy = [15, 23, 42]     // #0f172a
    const accentIndigo = [79, 70, 229]   // #4f46e5
    const textDark = [30, 41, 59]        // #1e293b
    const textMuted = [100, 116, 139]    // #64748b
    const bgLight = [248, 250, 252]      // #f8fafc
    const greenColor = [5, 150, 105]     // #059669
    const amberColor = [217, 119, 6]     // #d97706
    const redColor = [220, 38, 38]       // #dc2626

    // Header Banner
    pdf.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2])
    pdf.rect(0, 0, 210, 38, 'F')

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(20)
    pdf.setTextColor(255, 255, 255)
    pdf.text('E5 CHRONICLES', 14, 18)

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(203, 213, 225)
    pdf.text('Marketing, Videography & Editing Agency | PAN: 609876543', 14, 25)
    pdf.text('Birtamode, Jhapa, Nepal | Email: billing@e5chronicles.com | Tel: +977 980-0000000', 14, 31)

    // Invoice Header Badge Right
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.setTextColor(255, 255, 255)
    pdf.text('INVOICE', 196, 16, { align: 'right' })

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(226, 232, 240)
    pdf.text(`# ${packageNumber}`, 196, 23, { align: 'right' })
    pdf.text(`Date: ${creationDate || new Date().toISOString().split('T')[0]}`, 196, 29, { align: 'right' })

    let y = 46

    // Billed To & Package Detail Box
    pdf.setFillColor(bgLight[0], bgLight[1], bgLight[2])
    pdf.roundedRect(14, y, 182, 32, 3, 3, 'F')

    // Left Column: Billed To
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2])
    pdf.text('BILLED TO:', 18, y + 7)

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(textDark[0], textDark[1], textDark[2])
    pdf.text(clientName || 'Select a Client', 18, y + 14)

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2])
    let clientSubText = []
    if (clientEmail) clientSubText.push(`Email: ${clientEmail}`)
    if (clientPhone) clientSubText.push(`Phone: ${clientPhone}`)
    pdf.text(clientSubText.join(' | ') || 'Client Contact', 18, y + 21)

    // Right Column: Package Title & Status Badge
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2])
    pdf.text('PACKAGE TITLE & PAYMENT STATUS:', 115, y + 7)

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(accentIndigo[0], accentIndigo[1], accentIndigo[2])
    pdf.text((packageTitle || 'Untitled Package').substring(0, 38), 115, y + 14)

    // Status Pill
    const badgeText = paymentStatus === 'paid'
      ? 'PAID IN FULL'
      : paymentStatus === 'partially_paid'
      ? `PARTIALLY PAID (PAID: RS. ${effectivePaidAmount.toLocaleString()})`
      : 'UNPAID'

    const badgeColor = paymentStatus === 'paid' ? greenColor : paymentStatus === 'partially_paid' ? amberColor : redColor
    pdf.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2])
    pdf.roundedRect(115, y + 18, 77, 8, 2, 2, 'F')
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 255, 255)
    pdf.text(badgeText, 153.5, y + 23.5, { align: 'center' })

    y += 38

    // Line Items Table Header
    pdf.setFillColor(accentIndigo[0], accentIndigo[1], accentIndigo[2])
    pdf.rect(14, y, 182, 9, 'F')

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 255, 255)
    pdf.text('#', 18, y + 6)
    pdf.text('Description', 28, y + 6)
    pdf.text('Qty', 125, y + 6, { align: 'center' })
    pdf.text('Unit Cost (Rs.)', 155, y + 6, { align: 'right' })
    pdf.text('Subtotal (Rs.)', 191, y + 6, { align: 'right' })

    y += 9

    // Line Items Rows
    items.forEach((item, idx) => {
      const lineTotal = Number(item.quantity || 0) * Number(item.unit_cost || 0)

      if (idx % 2 === 1) {
        pdf.setFillColor(bgLight[0], bgLight[1], bgLight[2])
        pdf.rect(14, y, 182, 8, 'F')
      }

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(textDark[0], textDark[1], textDark[2])

      pdf.text(String(idx + 1), 18, y + 5.5)
      pdf.text((item.description || 'Line Item').substring(0, 48), 28, y + 5.5)
      pdf.text(String(item.quantity || 1), 125, y + 5.5, { align: 'center' })
      pdf.text(Number(item.unit_cost || 0).toLocaleString(), 155, y + 5.5, { align: 'right' })
      pdf.setFont('helvetica', 'bold')
      pdf.text(lineTotal.toLocaleString(), 191, y + 5.5, { align: 'right' })

      y += 8
    })

    // Divider Line
    pdf.setDrawColor(203, 213, 225)
    pdf.line(14, y + 2, 196, y + 2)
    y += 6

    // Financial Totals Section (Right Aligned)
    const totalBoxX = 120
    const totalBoxWidth = 76

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2])
    pdf.text('Subtotal:', totalBoxX, y + 4)
    pdf.setTextColor(textDark[0], textDark[1], textDark[2])
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Rs. ${subtotal.toLocaleString()}`, 191, y + 4, { align: 'right' })
    y += 6

    if (discountAmount > 0) {
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(greenColor[0], greenColor[1], greenColor[2])
      pdf.text('Discount:', totalBoxX, y + 4)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`- Rs. ${Number(discountAmount).toLocaleString()}`, 191, y + 4, { align: 'right' })
      y += 6
    }

    if (taxPercent > 0) {
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2])
      pdf.text(`Tax (${taxPercent}%):`, totalBoxX, y + 4)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(textDark[0], textDark[1], textDark[2])
      pdf.text(`+ Rs. ${taxAmount.toLocaleString()}`, 191, y + 4, { align: 'right' })
      y += 6
    }

    // Grand Total Row
    pdf.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2])
    pdf.rect(totalBoxX - 2, y + 2, totalBoxWidth + 2, 8, 'F')
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 255, 255)
    pdf.text('GRAND TOTAL:', totalBoxX, y + 7.5)
    pdf.text(`Rs. ${grandTotal.toLocaleString()}`, 191, y + 7.5, { align: 'right' })
    y += 12

    // Paid Amount & Balance Due Box
    if (effectivePaidAmount > 0) {
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(greenColor[0], greenColor[1], greenColor[2])
      pdf.text('Paid Amount (Received):', totalBoxX, y + 4)
      pdf.text(`Rs. ${effectivePaidAmount.toLocaleString()}`, 191, y + 4, { align: 'right' })
      y += 6
    }

    // Balance Due Box
    const dueBgColor = remainingDue === 0 ? [209, 250, 229] : [254, 226, 226]
    const dueTextColor = remainingDue === 0 ? greenColor : redColor

    pdf.setFillColor(dueBgColor[0], dueBgColor[1], dueBgColor[2])
    pdf.roundedRect(totalBoxX - 2, y + 2, totalBoxWidth + 2, 8, 2, 2, 'F')

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(dueTextColor[0], dueTextColor[1], dueTextColor[2])
    pdf.text('BALANCE DUE:', totalBoxX, y + 7.5)
    pdf.text(`Rs. ${remainingDue.toLocaleString()}`, 191, y + 7.5, { align: 'right' })

    y += 18

    // Bank Payment Details Box
    pdf.setFillColor(bgLight[0], bgLight[1], bgLight[2])
    pdf.setDrawColor(226, 232, 240)
    pdf.roundedRect(14, y, 182, 24, 2, 2, 'FD')

    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(accentIndigo[0], accentIndigo[1], accentIndigo[2])
    pdf.text('PAYMENT DETAILS / BANK TRANSFER:', 18, y + 6)

    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(textDark[0], textDark[1], textDark[2])
    pdf.text('Bank Name: Nabil Bank Ltd. | Account Name: E5 Chronicles Pvt. Ltd.', 18, y + 12)
    pdf.text('Account Number: 0120010098765401 | Branch: New Baneshwor, Kathmandu', 18, y + 17)
    pdf.text(`Payment Method: ${(paymentMethod || 'Bank Transfer').replace('_', ' ').toUpperCase()}`, 18, y + 22)

    y += 30

    // Watermark Stamp if fully paid
    if (remainingDue === 0 && grandTotal > 0) {
      pdf.setDrawColor(greenColor[0], greenColor[1], greenColor[2])
      pdf.setLineWidth(0.8)
      pdf.roundedRect(65, y - 4, 80, 12, 3, 3, 'D')
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(greenColor[0], greenColor[1], greenColor[2])
      pdf.text('*** PAID IN FULL ***', 105, y + 3.5, { align: 'center' })
      y += 14
    }

    // Notes & Footer
    if (notes) {
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2])
      pdf.text('NOTES & TERMS:', 14, y + 4)
      pdf.setFont('helvetica', 'normal')
      pdf.text(notes.substring(0, 160), 14, y + 9)
      y += 14
    }

    pdf.setFontSize(8)
    pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2])
    pdf.text('Thank you for choosing E5 Chronicles. For billing inquiries, contact billing@e5chronicles.com', 105, 285, { align: 'center' })

    pdf.save(cleanFileName)
  }

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-surface-container-high border border-outline-variant/60 rounded-2xl p-4 shadow-sm">
        <div>
          <h4 className="font-semibold text-sm text-foreground">Live Executive Invoice & PDF Export</h4>
          <p className="text-xs text-on-surface-variant">Real-time formatted invoice preview</p>
        </div>
        <div className="flex items-center gap-2">
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
        style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
        className="bg-white text-slate-900 border border-slate-200 rounded-2xl p-8 shadow-xl space-y-6 print:p-0 print:border-none print:shadow-none font-sans"
      >
        {/* Top Header Branding Banner */}
        <div style={{ backgroundColor: '#0f172a', color: '#ffffff' }} className="rounded-xl p-6 flex items-start justify-between shadow-md">
          <div className="flex items-center gap-4">
            <div style={{ backgroundColor: '#4f46e5', color: '#ffffff' }} className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-md">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 style={{ color: '#ffffff' }} className="font-black text-xl tracking-tight">E5 CHRONICLES</h2>
              <p style={{ color: '#94a3b8' }} className="text-xs font-medium">Marketing, Videography & Editing Agency</p>
              <p style={{ color: '#64748b' }} className="text-[11px] font-mono mt-0.5">PAN / VAT: 609876543 | Birtamode, Jhapa, Nepal</p>
            </div>
          </div>

          <div className="text-right">
            <span style={{ backgroundColor: '#312e81', color: '#818cf8' }} className="inline-block px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg mb-1">
              INVOICE
            </span>
            <p style={{ color: '#f8fafc' }} className="text-xs font-mono font-bold">{packageNumber}</p>
            <p style={{ color: '#94a3b8' }} className="text-xs">Date: {creationDate || new Date().toISOString().split('T')[0]}</p>
          </div>
        </div>

        {/* Client & Company Information Grid */}
        <div style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }} className="grid grid-cols-2 gap-6 rounded-xl p-5 border">
          <div>
            <span style={{ color: '#64748b' }} className="text-[10px] font-bold uppercase tracking-wider block mb-1">BILLED TO:</span>
            <p style={{ color: '#0f172a' }} className="font-bold text-sm">{clientName || 'Select a Client'}</p>
            {clientEmail && <p style={{ color: '#475569' }} className="text-xs flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3 text-indigo-500" /> {clientEmail}</p>}
            {clientPhone && <p style={{ color: '#475569' }} className="text-xs flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-indigo-500" /> {clientPhone}</p>}
          </div>

          <div className="text-right">
            <span style={{ color: '#64748b' }} className="text-[10px] font-bold uppercase tracking-wider block mb-1">PACKAGE TITLE & STATUS:</span>
            <p style={{ color: '#312e81' }} className="font-bold text-sm">{packageTitle || 'Untitled Package'}</p>
            <div className="mt-2 flex items-center justify-end gap-2">
              <span style={{
                backgroundColor: paymentStatus === 'paid' ? '#d1fae5' : paymentStatus === 'partially_paid' ? '#fef3c7' : '#fee2e2',
                color: paymentStatus === 'paid' ? '#065f46' : paymentStatus === 'partially_paid' ? '#92400e' : '#991b1b',
                borderColor: paymentStatus === 'paid' ? '#6ee7b7' : paymentStatus === 'partially_paid' ? '#fcd34d' : '#fca5a5'
              }} className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full border">
                {paymentStatus === 'paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {paymentStatus === 'paid' ? 'PAID IN FULL' : paymentStatus === 'partially_paid' ? 'PARTIALLY PAID' : 'UNPAID'}
              </span>

              <span style={{ color: '#64748b' }} className="text-[11px] font-medium">
                ({paymentMethod.replace('_', ' ').toUpperCase()})
              </span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div style={{ borderColor: '#e2e8f0' }} className="overflow-hidden rounded-xl border">
          <table className="w-full text-left text-xs">
            <thead style={{ backgroundColor: '#4f46e5', color: '#ffffff' }} className="font-bold uppercase text-[10px] tracking-wider">
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
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ color: '#94a3b8' }} className="py-3 px-4 font-semibold">{idx + 1}</td>
                    <td style={{ color: '#0f172a' }} className="py-3 px-4 font-medium">{item.description || 'Line Item'}</td>
                    <td style={{ color: '#334155' }} className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                    <td style={{ color: '#334155' }} className="py-3 px-4 text-right font-mono">Rs. {Number(item.unit_cost || 0).toLocaleString()}</td>
                    <td style={{ color: '#0f172a' }} className="py-3 px-4 text-right font-mono font-bold">Rs. {lineTotal.toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Totals Box */}
        <div className="flex justify-end pt-2">
          <div className="w-72 space-y-2 text-xs text-slate-700">
            <div style={{ borderColor: '#f1f5f9' }} className="flex justify-between py-1 border-b">
              <span style={{ color: '#64748b' }} className="font-medium">Subtotal:</span>
              <span style={{ color: '#0f172a' }} className="font-mono font-semibold">Rs. {subtotal.toLocaleString()}</span>
            </div>

            {discountAmount > 0 && (
              <div style={{ color: '#059669', borderColor: '#f1f5f9' }} className="flex justify-between py-1 border-b">
                <span className="font-medium">Discount:</span>
                <span className="font-mono font-semibold">- Rs. {Number(discountAmount).toLocaleString()}</span>
              </div>
            )}

            {taxPercent > 0 && (
              <div style={{ borderColor: '#f1f5f9' }} className="flex justify-between py-1 border-b">
                <span style={{ color: '#64748b' }} className="font-medium">Tax ({taxPercent}%):</span>
                <span style={{ color: '#0f172a' }} className="font-mono font-semibold">+ Rs. {taxAmount.toLocaleString()}</span>
              </div>
            )}

            <div style={{ backgroundColor: '#0f172a', color: '#ffffff' }} className="flex justify-between py-2.5 rounded-lg px-3 text-sm font-bold shadow-xs">
              <span>Grand Total:</span>
              <span className="font-mono text-base">Rs. {grandTotal.toLocaleString()}</span>
            </div>

            {effectivePaidAmount > 0 && (
              <div style={{ backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }} className="flex justify-between py-1.5 rounded-lg px-3 text-xs font-bold border">
                <span>Paid Amount (Received):</span>
                <span className="font-mono">- Rs. {effectivePaidAmount.toLocaleString()}</span>
              </div>
            )}

            <div style={{
              backgroundColor: remainingDue === 0 ? '#d1fae5' : '#fee2e2',
              color: remainingDue === 0 ? '#065f46' : '#991b1b',
              borderColor: remainingDue === 0 ? '#6ee7b7' : '#fca5a5'
            }} className="flex justify-between py-2 rounded-lg px-3 text-sm font-bold border">
              <span>Balance Due:</span>
              <span className="font-mono text-base">Rs. {remainingDue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Bank Payment Details Box */}
        <div style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }} className="rounded-xl p-4 border space-y-1">
          <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs">
            <Landmark className="w-4 h-4" />
            <span>PAYMENT DETAILS / BANK TRANSFER:</span>
          </div>
          <div style={{ color: '#334155' }} className="text-[11px] grid grid-cols-2 gap-2 pt-1 font-mono">
            <div>
              <p><span className="font-semibold text-slate-500">Bank Name:</span> Nabil Bank Ltd.</p>
              <p><span className="font-semibold text-slate-500">Account Name:</span> E5 Chronicles Pvt. Ltd.</p>
            </div>
            <div>
              <p><span className="font-semibold text-slate-500">Account No:</span> 0120010098765401</p>
              <p><span className="font-semibold text-slate-500">Branch:</span> New Baneshwor, Kathmandu</p>
            </div>
          </div>
        </div>

        {/* Fully Paid Stamp */}
        {remainingDue === 0 && grandTotal > 0 && (
          <div className="flex justify-center pt-2">
            <div style={{ backgroundColor: '#ecfdf5', borderColor: '#34d399', color: '#047857' }} className="inline-flex items-center gap-2 px-8 py-2.5 border-2 rounded-xl shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-black uppercase tracking-widest">*** PAID IN FULL ***</span>
            </div>
          </div>
        )}

        {/* Notes & Terms Footer */}
        {notes && (
          <div style={{ borderColor: '#e2e8f0' }} className="border-t pt-4 text-xs text-slate-500">
            <span style={{ color: '#334155' }} className="font-bold block mb-1">Notes & Terms:</span>
            <p className="whitespace-pre-line leading-relaxed">{notes}</p>
          </div>
        )}

        <div style={{ borderColor: '#f1f5f9', color: '#94a3b8' }} className="border-t pt-4 text-center text-[10px]">
          Thank you for choosing E5 Chronicles. For billing inquiries, contact billing@e5chronicles.com
        </div>
      </div>
    </div>
  )
}
