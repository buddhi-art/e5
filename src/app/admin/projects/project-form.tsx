'use client'

import { useState } from 'react'
import { createProject } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'

type Client = {
  id: string
  company_name: string
}

export function ProjectForm({ clients }: { clients: Client[] }) {
  const [loading, setLoading] = useState(false)
  const [clientId, setClientId] = useState('')

  async function handleSubmit(formData: FormData) {
    if (!clientId) {
      toast.error("Please select a client")
      return
    }
    formData.set('client_id', clientId)
    setLoading(true)
    const result = await createProject(formData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Project created successfully')
      const form = document.getElementById('project-form') as HTMLFormElement
      form.reset()
      setClientId('')
    }
    setLoading(false)
  }

  return (
    <form id="project-form" action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-zinc-700 dark:text-zinc-300">Client</Label>
        <Select value={clientId} onValueChange={(val) => setClientId(val || '')}>
          <SelectTrigger className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white">
            <SelectValue placeholder="Select a client">
              {clientId ? clients.find(c => c.id === clientId)?.company_name : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id}>{client.company_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title" className="text-zinc-700 dark:text-zinc-300">Project Title</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="e.g., Summer Campaign Video"
          className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date" className="text-zinc-700 dark:text-zinc-300">From Date</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date" className="text-zinc-700 dark:text-zinc-300">Due Date</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            className="bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      </div>
      <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200" disabled={loading}>
        {loading ? 'Creating...' : 'Create Project'}
      </Button>
    </form>
  )
}
