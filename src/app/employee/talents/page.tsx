import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { MapPin, DollarSign } from 'lucide-react'

export default async function EmployeeTalentsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'employee') redirect('/admin/dashboard')

    const { data: talents, error } = await supabase
        .from('talents')
        .select('*')
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('full_name')

    if (error) console.error('Error fetching talents:', error)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Talent Directory</h1>
                <p className="text-sm text-zinc-500">Browse our network of models, actors, freelancers, and crew.</p>
            </div>

            {!talents || talents.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg border-zinc-200 dark:border-zinc-800">
                    <p className="text-zinc-500">No talents in the directory yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {talents.map((talent: any) => (
                        <div key={talent.id} className="flex items-start gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {talent.photo_url ? (
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/talent-photos/${talent.photo_url}`}
                                        alt={talent.full_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-400 to-orange-400 text-white font-bold text-lg">
                                        {talent.full_name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                    <div>
                                        <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                                            {talent.full_name}
                                        </h3>
                                        {talent.stage_name && (
                                            <p className="text-xs text-zinc-400">aka {talent.stage_name}</p>
                                        )}
                                    </div>
                                    <Badge variant="default" className="capitalize flex-shrink-0 text-[10px]">
                                        {talent.talent_type.replace(/_/g, ' ')}
                                    </Badge>
                                </div>
                                <div className="text-xs text-zinc-500 space-y-1 mt-2">
                                    {talent.location && (
                                        <p className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {talent.location}
                                        </p>
                                    )}
                                    {talent.skills && talent.skills.length > 0 && (
                                        <p className="truncate">{talent.skills.slice(0, 5).join(', ')}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
