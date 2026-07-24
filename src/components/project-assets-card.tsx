'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Link2, Save, FileVideo, Palette, StickyNote, Edit } from 'lucide-react'
import { updateProjectAssets } from '@/app/admin/projects/actions'
import { toast } from 'sonner'

export function ProjectAssetsCard({
  projectId,
  isAdmin,
  initialRawFootage,
  initialBrandAssets,
  initialClientBrief
}: {
  projectId: string
  isAdmin: boolean
  initialRawFootage?: string
  initialBrandAssets?: string
  initialClientBrief?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [rawFootage, setRawFootage] = useState(initialRawFootage || '')
  const [brandAssets, setBrandAssets] = useState(initialBrandAssets || '')
  const [clientBrief, setClientBrief] = useState(initialClientBrief || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await updateProjectAssets(projectId, {
      raw_footage_link: rawFootage,
      brand_assets_link: brandAssets,
      client_brief_notes: clientBrief
    })
    setSaving(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Project assets updated')
      setIsEditing(false)
    }
  }

  if (!isAdmin && !rawFootage && !brandAssets && !clientBrief) {
    return null // Don't show empty card to non-admins
  }

  return (
    <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-on-surface">
          <Link2 className="w-5 h-5 text-primary" />
          Project Brief & Assets
        </CardTitle>
        {isAdmin && !isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-on-surface flex items-center gap-2 mb-1">
                <FileVideo className="w-4 h-4 text-m3-info" />
                Raw Footage Link (Drive/Dropbox)
              </label>
              <Input
                value={rawFootage}
                onChange={(e) => setRawFootage(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="bg-surface-container"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-on-surface flex items-center gap-2 mb-1">
                <Palette className="w-4 h-4 text-m3-warning" />
                Brand Assets Link (Logo, Fonts)
              </label>
              <Input
                value={brandAssets}
                onChange={(e) => setBrandAssets(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="bg-surface-container"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-on-surface flex items-center gap-2 mb-1">
                <StickyNote className="w-4 h-4 text-m3-success" />
                Client Brief / Notes
              </label>
              <Textarea
                value={clientBrief}
                onChange={(e) => setClientBrief(e.target.value)}
                placeholder="Client wants a fast-paced edit with energetic music..."
                className="bg-surface-container min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-on-primary">
                {saving ? 'Saving...' : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Links
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-outline flex items-center gap-1.5">
                  <FileVideo className="w-3.5 h-3.5" />
                  Raw Footage
                </span>
                {rawFootage ? (
                  <a href={rawFootage} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline truncate">
                    {rawFootage}
                  </a>
                ) : (
                  <span className="text-sm text-outline-variant italic">Not provided</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-outline flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  Brand Assets
                </span>
                {brandAssets ? (
                  <a href={brandAssets} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline truncate">
                    {brandAssets}
                  </a>
                ) : (
                  <span className="text-sm text-outline-variant italic">Not provided</span>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-1 sm:border-l border-outline-variant/30 sm:pl-4">
              <span className="text-xs font-medium text-outline flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" />
                Client Brief
              </span>
              {clientBrief ? (
                <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{clientBrief}</p>
              ) : (
                <span className="text-sm text-outline-variant italic">No brief provided</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
