'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Printer, Download } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export function PrintButton() {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async () => {
    const element = document.querySelector('.print-area') as HTMLElement
    if (!element) return

    setIsGenerating(true)
    try {
      const originalBackground = element.style.background
      element.style.background = 'white'
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      })
      
      element.style.background = originalBackground

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save('invoice.pdf')
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={() => typeof window !== 'undefined' && window.print()} variant="outline">
        <Printer className="w-4 h-4 mr-2" />
        Print
      </Button>
      <Button 
        onClick={generatePDF} 
        disabled={isGenerating}
        className="bg-inverse-surface text-inverse-on-surface hover:bg-inverse-surface/90"
      >
        <Download className="w-4 h-4 mr-2" />
        {isGenerating ? 'Generating...' : 'Download PDF'}
      </Button>
    </div>
  )
}
