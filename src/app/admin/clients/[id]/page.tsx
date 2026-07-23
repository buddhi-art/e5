/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Phone, MapPin, Globe, Camera, Music2, MessageCircle, ArrowLeft, FolderKanban, CalendarDays } from 'lucide-react'
import { normalizeUrl } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { AddProjectDialog } from './add-project-dialog'
import { ClientMeetingDialog } from './client-meeting-dialog'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  // Fetch client details
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) {
    notFound()
  }

  // Fetch client projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  // Fetch client meetings
  const { data: meetings } = await supabase
    .from('client_meetings')
    .select('*')
    .eq('client_id', id)
    .order('meeting_date', { ascending: false })

  const social = client.social_urls as Record<string, string> || {}
  const hasSocialLinks = social.facebook || social.instagram || social.tiktok || social.threads

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4 morph-fade-in">
        <Link href="/admin/clients">
          <Button variant="outline" size="icon" className="btn-morph bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-1 flex items-center gap-3">
            {client.company_name}
            <Badge
              variant="outline"
              className={`border-outline-variant font-normal ${client.status === 'active' ? 'bg-m3-info-subtle text-m3-info border-m3-info' :
                client.status === 'potential' ? 'bg-m3-warning-subtle text-m3-warning border-m3-warning' :
                  'bg-surface-container-high text-on-surface-variant border-outline-variant'
                }`}
            >
              {client.status}
            </Badge>
          </h1>
          <p className="text-on-surface-variant">{client.nature_of_company || 'Unspecified Nature'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 md:col-span-1 h-fit morph-fade-in morph-delay-1">
          <CardHeader>
            <CardTitle className="text-on-surface text-lg">Client Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center mb-6">
              {client.logo_url ? (
                <img src={client.logo_url} alt={client.company_name} className="w-32 h-32 rounded-full object-cover bg-surface-container-high border-4 border-outline-variant" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-surface-container-high flex items-center justify-center text-outline border-4 border-outline-variant">
                  <Building2 className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              {client.contact_person && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-outline font-medium mb-1">Owner</div>
                  <div className="text-on-surface">{client.contact_person}</div>
                </div>
              )}
              {client.contact_email && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-outline font-medium mb-1">Contact Email</div>
                  <div className="text-on-surface">
                    <a href={`mailto:${client.contact_email}`} className="hover:text-primary transition-colors">
                      {client.contact_email}
                    </a>
                  </div>
                </div>
              )}
              {client.phone_number && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-outline font-medium mb-1">Phone</div>
                  <div className="text-on-surface flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-outline" /> {client.phone_number}
                  </div>
                </div>
              )}
              {client.location && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-outline font-medium mb-1">Location</div>
                  <div className="text-on-surface flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-outline" /> {client.location}
                  </div>
                </div>
              )}
              {client.referral_source && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-outline font-medium mb-1">Referral Source</div>
                  <div className="text-on-surface">{client.referral_source}</div>
                </div>
              )}
              {client.pan_number && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-outline font-medium mb-1">PAN Number</div>
                  <div className="text-on-surface font-mono">{client.pan_number}</div>
                </div>
              )}
              {client.vat_id && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-outline font-medium mb-1">VAT ID</div>
                  <div className="text-on-surface font-mono">{client.vat_id}</div>
                </div>
              )}

              {/* Socials - show only if there are social links */}
              {hasSocialLinks && (
                <div className="pt-4 border-t border-outline-variant">
                  <div className="text-xs uppercase tracking-wider text-outline font-medium mb-3">Social Media</div>
                  <div className="flex gap-2">
                    {social.facebook && (
                      <a href={normalizeUrl(social.facebook)} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-container-high rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors">
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    {social.instagram && (
                      <a href={normalizeUrl(social.instagram)} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-container-high rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors">
                        <Camera className="w-4 h-4" />
                      </a>
                    )}
                    {social.tiktok && (
                      <a href={normalizeUrl(social.tiktok)} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-container-high rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors">
                        <Music2 className="w-4 h-4" />
                      </a>
                    )}
                    {social.threads && (
                      <a href={normalizeUrl(social.threads)} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-container-high rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors">
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          {/* Projects */}
          <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 h-fit">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-on-surface text-lg">Projects</CardTitle>
                <CardDescription className="text-on-surface-variant">All video projects running for this client.</CardDescription>
              </div>
              <AddProjectDialog clientId={client.id} clientName={client.company_name} />
            </CardHeader>
            <CardContent>
              {projects && projects.length > 0 ? (
                <div className="divide-y divide-outline-variant">
                  {projects.map((project) => (
                    <div key={project.id} className="py-4 flex items-center justify-between group">
                      <div>
                        <div className="font-medium text-on-surface mb-1 group-hover:text-primary transition-colors">{project.title}</div>
                        <div className="text-xs text-outline">Created {new Date(project.created_at).toLocaleDateString()}</div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`
                          ${project.status === 'completed' ? 'bg-m3-success-subtle text-m3-success border-m3-success' : ''}
                          ${project.status === 'in_progress' ? 'bg-m3-info-subtle text-m3-info border-m3-info' : ''}
                          ${project.status === 'on_hold' ? 'bg-m3-warning-subtle text-m3-warning border-m3-warning' : ''}
                          ${project.status === 'not_started' ? 'bg-surface-container-high text-on-surface-variant border-outline-variant' : ''}
                        `}
                      >
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-surface-container-low rounded-lg border border-dashed border-outline-variant mt-4">
                  <FolderKanban className="w-8 h-8 text-on-surface-variant mx-auto mb-3" />
                  <div className="text-on-surface-variant font-medium">No projects yet</div>
                  <div className="text-sm text-outline mt-1">Start a new video project for {client.company_name}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Meetings */}
          <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 h-fit">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-on-surface text-lg">Client Meetings</CardTitle>
                <CardDescription className="text-on-surface-variant">Schedule and track meetings with this client.</CardDescription>
              </div>
              <ClientMeetingDialog clientId={client.id} />
            </CardHeader>
            <CardContent>
              {meetings && meetings.length > 0 ? (
                <div className="divide-y divide-outline-variant">
                  {meetings.map((meeting: any) => (
                    <div key={meeting.id} className="py-4 flex items-center justify-between group">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-m3-info-subtle mt-0.5">
                          <CalendarDays className="w-4 h-4 text-m3-info" />
                        </div>
                        <div>
                          <div className="font-medium text-on-surface mb-0.5">{meeting.title}</div>
                          <div className="text-xs text-outline space-x-2">
                            <span>{format(new Date(meeting.meeting_date), 'MMM d, yyyy h:mm a')}</span>
                            {meeting.duration_minutes && <span>• {meeting.duration_minutes} min</span>}
                            {meeting.location && <span>• {meeting.location}</span>}
                          </div>
                          {meeting.notes && (
                            <div className="text-xs text-outline mt-1 line-clamp-1">{meeting.notes}</div>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`
                          ${meeting.status === 'scheduled' ? 'bg-m3-info-subtle text-m3-info border-m3-info' : ''}
                          ${meeting.status === 'completed' ? 'bg-m3-success-subtle text-m3-success border-m3-success' : ''}
                          ${meeting.status === 'cancelled' ? 'bg-surface-container-high text-on-surface-variant border-outline-variant' : ''}
                        `}
                      >
                        {meeting.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-surface-container-low rounded-lg border border-dashed border-outline-variant mt-4">
                  <CalendarDays className="w-8 h-8 text-on-surface-variant mx-auto mb-3" />
                  <div className="text-on-surface-variant font-medium">No meetings scheduled</div>
                  <div className="text-sm text-outline mt-1">Schedule a meeting with {client.company_name}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
