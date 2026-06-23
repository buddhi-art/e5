'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, DollarSign } from 'lucide-react'
import { updateExpenseStatus } from '../actions'
import { toast } from 'sonner'
import { useState } from 'react'

export function ExpenseActions({ expenseId, currentStatus }: { expenseId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false)

  async function handleStatusChange(status: string) {
    setLoading(true)
    const res = await updateExpenseStatus(expenseId, status)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success(`Expense marked as ${status}`)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === 'pending' && (
        <>
          <Button 
            onClick={() => handleStatusChange('rejected')} 
            disabled={loading} 
            variant="outline" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button 
            onClick={() => handleStatusChange('approved')} 
            disabled={loading} 
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve
          </Button>
        </>
      )}

      {currentStatus === 'approved' && (
        <Button 
          onClick={() => handleStatusChange('reimbursed')} 
          disabled={loading} 
          className="bg-sky-500 hover:bg-sky-600 text-white"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Mark Reimbursed
        </Button>
      )}
    </div>
  )
}
