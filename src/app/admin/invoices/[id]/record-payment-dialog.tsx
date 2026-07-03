'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CreditCard } from 'lucide-react'
import { recordPayment } from '../actions'
import { toast } from 'sonner'

export function RecordPaymentDialog({ invoice }: { invoice: any }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const balanceDue = invoice.grand_total - invoice.paid_amount

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set('invoice_id', invoice.id)

    const res = await recordPayment(formData)

    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Payment recorded successfully')
      setOpen(false)
    }

    setLoading(false)
  }

  if (balanceDue <= 0 && invoice.status === 'paid') return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="default" className="bg-m3-success hover:bg-m3-success/90 text-white border-none shadow-sm print:hidden">
          <CreditCard className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      } />
      <DialogContent className="bg-surface-container-low border-outline-variant text-on-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription className="text-on-surface-variant">
            Record a payment received for invoice {invoice.invoice_number}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount Received ({invoice.currency})</Label>
            <Input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={balanceDue.toString()}
              defaultValue={balanceDue}
              required
              className="bg-surface-container-lowest"
            />
            <p className="text-xs text-outline">Balance due: {Number(balanceDue).toLocaleString()}</p>
          </div>

          <div className="space-y-2">
            <Label>Payment Date</Label>
            <Input
              name="payment_date"
              type="date"
              required
              defaultValue={new Date().toISOString().split('T')[0]}
              className="bg-surface-container-lowest [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select name="payment_method" required defaultValue="bank_transfer">
              <SelectTrigger className="bg-surface-container-lowest">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="esewa">eSewa</SelectItem>
                <SelectItem value="khalti">Khalti</SelectItem>
                <SelectItem value="connect_ips">ConnectIPS</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reference Number (Optional)</Label>
            <Input name="reference_number" placeholder="Transaction ID, Cheque #, etc." className="bg-surface-container-lowest" />
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea name="notes" placeholder="Any internal notes..." className="bg-surface-container-lowest resize-none h-20" />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-m3-success hover:bg-m3-success/90 text-white">
              {loading ? 'Recording...' : 'Save Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
