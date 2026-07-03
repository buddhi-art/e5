'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { seedLeaveBalances } from '../actions'
import { toast } from 'sonner'

export function SeedBalancesButton({ year }: { year: number }) {
  const [loading, setLoading] = useState(false)

  async function handleSeed() {
    if (!confirm(`Are you sure you want to generate leave balances for all active employees for ${year}? Existing balances will not be overwritten.`)) return
    
    setLoading(true)
    const res = await seedLeaveBalances(year)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success(`Successfully seeded ${res.count} new balances for ${year}.`)
    }
    setLoading(false)
  }

  return (
    <Button 
      onClick={handleSeed} 
      disabled={loading}
      className="bg-primary hover:bg-primary/90 text-primary-foreground btn-morph"
    >
      <Play className="w-4 h-4 mr-2" />
      {loading ? 'Generating...' : `Generate Balances for ${year}`}
    </Button>
  )
}
