'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { setProjectBudget } from '../../actions'

export function BudgetForm({ projectId, initialBudget }: { projectId: string; initialBudget: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const result = await setProjectBudget(projectId, formData)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Budget saved successfully')
            router.refresh()
        }

        setLoading(false)
    }

    return (
        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg text-zinc-900 dark:text-white">Set Project Budget</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Budget Amount (NPR) *</Label>
                            <Input
                                name="budget_amount"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                defaultValue={initialBudget?.budget_amount || ''}
                                placeholder="e.g. 500000"
                                className="bg-zinc-50 dark:bg-zinc-800/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Contingency (%)</Label>
                            <Input
                                name="contingency_percent"
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                defaultValue={initialBudget?.contingency_percent || 10}
                                className="bg-zinc-50 dark:bg-zinc-800/50"
                            />
                            <p className="text-xs text-zinc-500">Recommended: 10%</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Textarea
                            name="notes"
                            defaultValue={initialBudget?.notes || ''}
                            placeholder="Budget assumptions, scope notes..."
                            className="bg-zinc-50 dark:bg-zinc-800/50 min-h-[80px]"
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-white font-semibold">
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Saving...' : initialBudget ? 'Update Budget' : 'Set Budget'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
