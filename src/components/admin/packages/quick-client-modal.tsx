'use client'

import { useState } from 'react'
import { Plus, Building2, Mail, Phone, MapPin, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { quickCreateClient } from '@/app/admin/packages/actions'

interface QuickClientModalProps {
  onClientCreated: (client: { id: string; company_name: string; contact_person?: string }) => void
}

export function QuickClientModal({ onClientCreated }: QuickClientModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!companyName.trim()) {
      toast.error('Client/Company Name is required')
      return
    }

    setLoading(true)
    const res = await quickCreateClient({
      companyName: companyName.trim(),
      contactEmail: email.trim(),
      phone: phone.trim(),
      location: location.trim()
    })
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
      return
    }

    toast.success(`Client "${companyName}" created successfully!`)
    if (res.client) {
      onClientCreated(res.client)
    }
    setIsOpen(false)
    setCompanyName('')
    setEmail('')
    setPhone('')
    setLocation('')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-all shadow-xs shrink-0"
      >
        <Plus className="w-4 h-4" />
        Add Client
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-outline-variant/60 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-base text-foreground tracking-tight">Quick Add Client</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-on-surface-variant hover:text-foreground rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Company / Client Name <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant/70" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Productions"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant/70" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@company.com"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant/70" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+977 9800000000"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Location Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant/70" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Kathmandu, Nepal"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-foreground rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
