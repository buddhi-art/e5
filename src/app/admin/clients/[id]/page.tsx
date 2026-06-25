import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Phone, MapPin, Globe, Camera, Music2, MessageCircle, ArrowLeft, FolderKanban, CalendarDays } from 'lucide-react'
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
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="outline" size="icon" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-zinc-800">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1 flex items-center gap-3">
            {client.company_name}
            <Badge
              variant="outline"
              className={`border-zinc-300 dark:border-zinc-700 font-normal ${client.status === 'active' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' :
                client.status === 'potential' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                  'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400'
                }`}
            >
              {client.status}
            </Badge>
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">{client.nature_of_company || 'Unspecified Nature'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-zinc-900 dark:text-white text-lg">Client Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center mb-6">
              {client.logo_url ? (
                <img src={client.logo_url} alt={client.company_name} className="w-32 h-32 rounded-full object-cover bg-zinc-100 dark:bg-zinc-800 border-4 border-zinc-200 dark:border-zinc-800" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-500 border-4 border-zinc-200 dark:border-zinc-800/50">
                  <Building2 className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              {client.contact_person && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-medium mb-1">Owner</div>
                  <div className="text-zinc-900 dark:text-zinc-200">{client.contact_person}</div>
                </div>
              )}
              {client.contact_email && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-medium mb-1">Contact Email</div>
                  <div className="text-zinc-900 dark:text-zinc-200">
                    <a href={`mailto:${client.contact_email}`} className="hover:text-sky-500 transition-colors">
                      {client.contact_email}
                    </a>
                  </div>
                </div>
              )}
              {client.phone_number && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-medium mb-1">Phone</div>
                  <div className="text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> {client.phone_number}
                  </div>
                </div>
              )}
              {client.location && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-medium mb-1">Location</div>
                  <div className="text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> {client.location}
                  </div>
                </div>
              )}
              {client.referral_source && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-medium mb-1">Referral Source</div>
                  <div className="text-zinc-900 dark:text-zinc-200">{client.referral_source}</div>
                </div>
              )}
              {client.pan_number && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-medium mb-1">PAN Number</div>
                  <div className="text-zinc-900 dark:text-zinc-200 font-mono">{client.pan_number}</div>
                </div>
              )}
              {client.vat_id && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-medium mb-1">VAT ID</div>
                  <div className="text-zinc-900 dark:text-zinc-200 font-mono">{client.vat_id}</div>
                </div>
              )}

              {/* Socials - show only if there are social links */}
              {hasSocialLinks && (
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/50">
                  <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-medium mb-3">Social Media</div>
                  <div className="flex gap-2">
                    {social.facebook && (
                      <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    {social.instagram && (
                      <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                        <Camera className="w-4 h-4" />
                      </a>
                    )}
                    {social.tiktok && (
                      <a href={social.tiktok} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                        <Music2 className="w-4 h-4" />
                      </a>
                    )}
                    {social.threads && (
                      <a href={social.threads} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
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
          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 h-fit">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-zinc-900 dark:text-white text-lg">Projects</CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">All video projects running for this client.</CardDescription>
              </div>
              <AddProjectDialog clientId={client.id} clientName={client.company_name} />
            </CardHeader>
            <CardContent>
              {projects && projects.length > 0 ? (
                <div className="divide-y divide-zinc-800/50">
                  {projects.map((project) => (
                    <div key={project.id} className="py-4 flex items-center justify-between group">
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-white mb-1 group-hover:text-sky-600 dark:text-sky-400 transition-colors">{project.title}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-500">Created {new Date(project.created_at).toLocaleDateString()}</div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`
                          ${project.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                          ${project.status === 'in_progress' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' : ''}
                          ${project.status === 'on_hold' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : ''}
                          ${project.status === 'not_started' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700' : ''}
                        `}
                      >
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 mt-4">
                  <FolderKanban className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                  <div className="text-zinc-600 dark:text-zinc-400 font-medium">No projects yet</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">Start a new video project for {client.company_name}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Meetings */}
          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 h-fit">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-zinc-900 dark:text-white text-lg">Client Meetings</CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">Schedule and track meetings with this client.</CardDescription>
              </div>
              <ClientMeetingDialog clientId={client.id} />
            </CardHeader>
            <CardContent>
              {meetings && meetings.length > 0 ? (
                <div className="divide-y divide-zinc-800/50">
                  {meetings.map((meeting: any) => (
                    <div key={meeting.id} className="py-4 flex items-center justify-between group">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-sky-100 dark:bg-sky-900/30 mt-0.5">
                          <CalendarDays className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-white mb-0.5">{meeting.title}</div>
                          <div className="text-xs text-zinc-500 space-x-2">
                            <span>{format(new Date(meeting.meeting_date), 'MMM d, yyyy h:mm a')}</span>
                            {meeting.duration_minutes && <span>• {meeting.duration_minutes} min</span>}
                            {meeting.location && <span>• {meeting.location}</span>}
                          </div>
                          {meeting.notes && (
                            <div className="text-xs text-zinc-500 mt-1 line-clamp-1">{meeting.notes}</div>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`
                          ${meeting.status === 'scheduled' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' : ''}
                          ${meeting.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                          ${meeting.status === 'cancelled' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700' : ''}
                        `}
                      >
                        {meeting.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 mt-4">
                  <CalendarDays className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                  <div className="text-zinc-600 dark:text-zinc-400 font-medium">No meetings scheduled</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">Schedule a meeting with {client.company_name}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
