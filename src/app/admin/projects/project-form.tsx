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
import { PackageSelect } from '@/components/ui/package-select'
import { toast } from 'sonner'

type Client = {
  id: string
  company_name: string
}

export function ProjectForm({ clients }: { clients: Client[] }) {
  const [loading, setLoading] = useState(false)
  const [clientId, setClientId] = useState('')
  const [pkg, setPkg] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    if (!clientId) {
      toast.error("Please select a client")
      return
    }
    formData.set('client_id', clientId)
    formData.set('package', pkg || '')
    setLoading(true)
    const result = await createProject(formData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Project created successfully')
      const form = document.getElementById('project-form') as HTMLFormElement
      form.reset()
      setClientId('')
      setPkg(null)
    }
    setLoading(false)
  }

  return (
    <form id="project-form" action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-on-surface">Client</Label>
        <Select value={clientId} onValueChange={(val) => setClientId(val || '')}>
          <SelectTrigger className="bg-surface-container-high border-outline-variant text-on-surface">
            <SelectValue placeholder="Select a client">
              {clientId ? clients.find(c => c.id === clientId)?.company_name : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-surface-container-lowest border-outline-variant text-on-surface">
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id}>{client.company_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title" className="text-on-surface">Project Title</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="e.g., Summer Campaign Video"
          className="bg-surface-container-high border-outline-variant text-on-surface"
        />
      </div>
      <div>
        <PackageSelect
          name="package"
          value={pkg || undefined}
          onChange={(val) => setPkg(val)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date" className="text-on-surface">From Date</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            className="bg-surface-container-high border-outline-variant text-on-surface [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date" className="text-on-surface">Due Date</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            className="bg-surface-container-high border-outline-variant text-on-surface [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      </div>
      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 btn-morph" disabled={loading}>
        {loading ? 'Creating...' : 'Create Project'}
      </Button>
    </form>
  )
}
