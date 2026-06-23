import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

export default async function BookingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/employee/dashboard')

    const { data: bookings, error } = await supabase
        .from('talent_bookings')
        .select(`
            *,
            talents(full_name, talent_type, photo_url),
            projects(title, id)
        `)
        .order('booking_date', { ascending: false })

    if (error) console.error('Error fetching bookings:', error)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Talent Bookings</h1>
                    <p className="text-sm text-zinc-500">View and manage all talent bookings across projects.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/admin/talents">
                        <Button variant="outline">Directory</Button>
                    </Link>
                    <Link href="/admin/talents/bookings/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Booking
                        </Button>
                    </Link>
                </div>
            </div>

            {!bookings || bookings.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg border-zinc-200 dark:border-zinc-800">
                    <p className="text-zinc-500 mb-4">No bookings yet.</p>
                    <Link href="/admin/talents/bookings/new">
                        <Button>Create Your First Booking</Button>
                    </Link>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-900">
                            <tr className="border-b border-zinc-200 dark:border-zinc-800">
                                <th className="text-left p-3 font-semibold text-zinc-600 dark:text-zinc-400">Talent</th>
                                <th className="text-left p-3 font-semibold text-zinc-600 dark:text-zinc-400">Project</th>
                                <th className="text-left p-3 font-semibold text-zinc-600 dark:text-zinc-400">Dates</th>
                                <th className="text-left p-3 font-semibold text-zinc-600 dark:text-zinc-400">Rate</th>
                                <th className="text-left p-3 font-semibold text-zinc-600 dark:text-zinc-400">Compensation</th>
                                <th className="text-left p-3 font-semibold text-zinc-600 dark:text-zinc-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-zinc-900/50">
                            {bookings.map((booking: any) => (
                                <tr key={booking.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex items-center justify-center">
                                                {booking.talents?.photo_url ? (
                                                    <img
                                                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/talent-photos/${booking.talents.photo_url}`}
                                                        alt={booking.talents.full_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-bold">{booking.talents?.full_name?.charAt(0)}</span>
                                                )}
                                            </div>
                                            <Link href={`/admin/talents/${booking.talent_id}`} className="font-medium text-zinc-900 dark:text-white hover:text-sky-500">
                                                {booking.talents?.full_name || 'Unknown'}
                                            </Link>
                                        </div>
                                    </td>
                                    <td className="p-3 text-zinc-600 dark:text-zinc-400">
                                        {booking.projects?.title || '—'}
                                    </td>
                                    <td className="p-3 text-zinc-600 dark:text-zinc-400">
                                        {new Date(booking.booking_date).toLocaleDateString()}
                                        {booking.end_date && ` - ${new Date(booking.end_date).toLocaleDateString()}`}
                                    </td>
                                    <td className="p-3 text-zinc-600 dark:text-zinc-400">
                                        NPR {Number(booking.rate_amount).toLocaleString('ne-NP')} / {booking.rate_type.replace('_', ' ')}
                                    </td>
                                    <td className="p-3 font-medium text-zinc-900 dark:text-white">
                                        NPR {Number(booking.total_compensation).toLocaleString('ne-NP')}
                                    </td>
                                    <td className="p-3">
                                        <Badge variant={
                                            booking.status === 'confirmed' ? 'default' :
                                                booking.status === 'completed' ? 'default' :
                                                    booking.status === 'cancelled' ? 'destructive' : 'outline'
                                        } className="capitalize">
                                            {booking.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
