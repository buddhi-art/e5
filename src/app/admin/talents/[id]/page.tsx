import { createClient } from '@/lib/supabase/server'
import { getSignedUrl } from '@/lib/supabase/storage'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TalentDetailActions } from './talent-detail-actions'
import { BookingStatusActions } from './booking-status-actions'

export default async function TalentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/employee/dashboard')

    const { data: talent, error } = await supabase
        .from('talents')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !talent) notFound()

    // Generate signed URL for talent photo if the bucket is private.
    // Falls back to public URL if signed URL generation fails.
    const photoUrl = talent.photo_url
        ? await getSignedUrl('talent-photos', talent.photo_url)
        : null

    // Fetch bookings for this talent
    const { data: bookings } = await supabase
        .from('talent_bookings')
        .select(`
      *,
      projects(title, id)
    `)
        .eq('talent_id', id)
        .order('booking_date', { ascending: false })

    // Fetch project history
    const { data: projectHistory } = await supabase
        .from('talent_project_history')
        .select(`
      *,
      projects(title, id)
    `)
        .eq('talent_id', id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 morph-fade-in">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-surface-container-high overflow-hidden flex items-center justify-center flex-shrink-0">
                        {photoUrl ? (
                            <img
                                src={photoUrl}
                                alt={talent.full_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-400 to-orange-400 text-white font-bold text-xl">
                                {talent.full_name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-on-surface">
                            {talent.full_name}
                        </h1>
                        {talent.stage_name && (
                            <p className="text-sm text-outline">aka {talent.stage_name}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <TalentDetailActions talentId={id} talentName={talent.full_name} isActive={talent.is_active} />
                    <Link href={`/admin/talents/${id}/edit`}>
                        <Button variant="outline">Edit</Button>
                    </Link>
                </div>
            </div>

            {/* Info badges */}
            <div className="flex flex-wrap gap-2">
                <Badge variant="default" className="capitalize">{talent.talent_type.replace(/_/g, ' ')}</Badge>
                {talent.gender && <Badge variant="outline" className="capitalize">{talent.gender}</Badge>}
                {talent.location && <Badge variant="outline">{talent.location}</Badge>}
                <Badge variant={talent.is_active ? 'default' : 'outline'}>{talent.is_active ? 'Active' : 'Inactive'}</Badge>
                {talent.rate_amount && (
                    <Badge variant="secondary">NPR {Number(talent.rate_amount).toLocaleString('ne-NP')} / {talent.rate_type.replace('_', ' ')}</Badge>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    {/* Bookings */}
                    <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest elevation-1 p-6 morph-fade-in morph-delay-1">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-on-surface">Bookings</h2>
                            <Link href={`/admin/talents/bookings/new?talent_id=${id}`}>
                                <Button size="sm">Book for Project</Button>
                            </Link>
                        </div>
                        {!bookings || bookings.length === 0 ? (
                            <p className="text-sm text-outline py-4 text-center">No bookings yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {bookings.map((booking: any) => (
                                    <div key={booking.id} className="flex justify-between items-start p-3 rounded-lg bg-surface-container border border-outline-variant card-morph">
                                        <div>
                                            <p className="font-medium text-sm text-on-surface">
                                                {booking.projects?.title || 'No project'}
                                            </p>
                                            <p className="text-xs text-outline mt-1">
                                                {new Date(booking.booking_date).toLocaleDateString()}
                                                {booking.end_date && ` - ${new Date(booking.end_date).toLocaleDateString()}`}
                                            </p>
                                            {booking.description && (
                                                <p className="text-xs text-on-surface-variant mt-1">{booking.description}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium">NPR {Number(booking.total_compensation).toLocaleString('ne-NP')}</span>
                                                <Badge variant={
                                                    booking.status === 'confirmed' ? 'default' :
                                                        booking.status === 'completed' ? 'default' :
                                                            booking.status === 'cancelled' ? 'destructive' : 'outline'
                                                } className="capitalize text-[10px]">
                                                    {booking.status}
                                                </Badge>
                                            </div>
                                            <BookingStatusActions bookingId={booking.id} currentStatus={booking.status} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Project History */}
                    <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest elevation-1 p-6 morph-fade-in morph-delay-2">
                        <h2 className="text-lg font-semibold text-on-surface mb-4">Past Projects</h2>
                        {!projectHistory || projectHistory.length === 0 ? (
                            <p className="text-sm text-outline py-4 text-center">No past project history.</p>
                        ) : (
                            <div className="space-y-3">
                                {projectHistory.map((ph: any) => (
                                    <div key={ph.id} className="flex justify-between items-start p-3 rounded-lg bg-surface-container border border-outline-variant card-morph">
                                        <div>
                                            <p className="font-medium text-sm text-on-surface">
                                                {ph.projects?.title || 'Unknown project'}
                                            </p>
                                            <p className="text-xs text-outline mt-1">Role: {ph.role}</p>
                                            {ph.feedback && <p className="text-xs text-on-surface-variant mt-1">{ph.feedback}</p>}
                                        </div>
                                        {ph.rating && (
                                            <Badge variant="secondary" className="text-xs">
                                                {'★'.repeat(ph.rating)}{'☆'.repeat(5 - ph.rating)}
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar info */}
                <div className="space-y-6">
                    <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest elevation-1 p-6 morph-fade-in morph-delay-3">
                        <h2 className="text-sm font-semibold text-outline uppercase tracking-wider mb-4">Contact Info</h2>
                        <div className="space-y-3 text-sm">
                            {talent.phone_number && (
                                <div>
                                    <p className="text-outline text-xs">Phone</p>
                                    <p className="text-on-surface">{talent.phone_number}</p>
                                </div>
                            )}
                            {talent.email && (
                                <div>
                                    <p className="text-outline text-xs">Email</p>
                                    <p className="text-on-surface">{talent.email}</p>
                                </div>
                            )}
                            {talent.location && (
                                <div>
                                    <p className="text-outline text-xs">Location</p>
                                    <p className="text-on-surface">{talent.location}</p>
                                </div>
                            )}
                            {talent.date_of_birth && (
                                <div>
                                    <p className="text-outline text-xs">Date of Birth</p>
                                    <p className="text-on-surface">{new Date(talent.date_of_birth).toLocaleDateString()}</p>
                                </div>
                            )}
                            {talent.height_cm && (
                                <div>
                                    <p className="text-outline text-xs">Height</p>
                                    <p className="text-on-surface">{talent.height_cm} cm</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {talent.languages && talent.languages.length > 0 && (
                        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest elevation-1 p-6 morph-fade-in morph-delay-4">
                            <h2 className="text-sm font-semibold text-outline uppercase tracking-wider mb-3">Languages</h2>
                            <div className="flex flex-wrap gap-1.5">
                                {talent.languages.map((lang: string) => (
                                    <Badge key={lang} variant="outline" className="text-xs">{lang}</Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {talent.skills && talent.skills.length > 0 && (
                        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest elevation-1 p-6 morph-fade-in morph-delay-5">
                            <h2 className="text-sm font-semibold text-outline uppercase tracking-wider mb-3">Skills</h2>
                            <div className="flex flex-wrap gap-1.5">
                                {talent.skills.map((skill: string) => (
                                    <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {talent.notes && (
                        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest elevation-1 p-6 morph-fade-in morph-delay-6">
                            <h2 className="text-sm font-semibold text-outline uppercase tracking-wider mb-3">Notes</h2>
                            <p className="text-sm text-on-surface whitespace-pre-wrap">{talent.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
