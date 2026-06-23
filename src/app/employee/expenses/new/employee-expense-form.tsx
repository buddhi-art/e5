'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"
import { toast } from 'sonner'
import { createExpense } from '@/app/admin/expenses/actions'

export function EmployeeExpenseForm({ projects }: { projects: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [projectId, setProjectId] = useState('none')
  const [category, setCategory] = useState('operational')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    if (projectId !== 'none') formData.set('project_id', projectId)

    const result = await createExpense(formData)

    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
    } else {
      toast.success('Expense submitted successfully')
      router.push('/employee/expenses')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
          <CardDescription>Submit a new reimbursement request.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select name="category" value={category} onValueChange={(val) => val && setCategory(val)} required>
                <SelectTrigger className="bg-zinc-50 dark:bg-zinc-800/50">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="post_production">Post Production</SelectItem>
                  <SelectItem value="talent">Talent</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="gear_rental">Gear Rental</SelectItem>
                  <SelectItem value="props_wardrobe">Props & Wardrobe</SelectItem>
                  <SelectItem value="food_catering">Food & Catering</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount (NPR) *</Label>
              <Input name="amount" type="number" step="0.01" min="0" required className="bg-zinc-50 dark:bg-zinc-800/50" />
            </div>

            <div className="space-y-2">
              <Label>Expense Date *</Label>
              <Input name="expense_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-zinc-50 dark:bg-zinc-800/50 [color-scheme:light] dark:[color-scheme:dark]" />
            </div>

            <div className="space-y-2">
              <Label>Project (Optional)</Label>
              <Select value={projectId} onValueChange={(val) => val && setProjectId(val)}>
                <SelectTrigger className="bg-zinc-50 dark:bg-zinc-800/50">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Input name="description" required placeholder="What was this expense for?" className="bg-zinc-50 dark:bg-zinc-800/50" />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input type="checkbox" id="is_billable" name="is_billable" defaultChecked className="rounded border-zinc-300 text-sky-600 focus:ring-sky-600" />
            <Label htmlFor="is_billable" className="font-normal">This expense is billable to the client</Label>
          </div>

          <div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Label>Receipt Image *</Label>
            <Input name="receipt" type="file" accept="image/*,.pdf" required className="bg-zinc-50 dark:bg-zinc-800/50" />
            <p className="text-xs text-zinc-500">Upload a scan or photo of the receipt. Required for reimbursement.</p>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea name="notes" placeholder="Additional details..." className="bg-zinc-50 dark:bg-zinc-800/50 min-h-[80px]" />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-white font-semibold">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Submitting...' : 'Submit Expense'}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
