import { createClient } from '@/lib/supabase/server'
import { getSignedUrl } from '@/lib/supabase/storage'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'

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

    // Generate signed URLs for all talent photos
    // (falls back to public URL if signed URL generation fails)
    const photoUrls = new Map<string, string | null>()
    if (talents) {
        for (const talent of talents) {
            if (talent.photo_url) {
                const url = await getSignedUrl('talent-photos', talent.photo_url)
                photoUrls.set(talent.id, url)
            }
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-on-surface">Talent Directory</h1>
                <p className="text-sm text-outline">Browse our network of models, actors, freelancers, and crew.</p>
            </div>

            {!talents || talents.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg border-outline-variant" >
                    <p className="text-outline">No talents in the directory yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {talents.map((talent: any) => {
                        const signedUrl = photoUrls.get(talent.id)
                        return (
                            <div key={talent.id} className="flex items-start gap-4 p-4 rounded-xl border border-outline-variant bg-surface-container-lowest dark:bg-surface-container-lowest">
                                <div className="w-16 h-16 rounded-full bg-surface-container-high dark:bg-surface-container overflow-hidden flex-shrink-0 flex items-center justify-center">
                                    {signedUrl ? (
                                        <img
                                            src={signedUrl}
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
                                            <h3 className="font-medium text-on-surface">
                                                {talent.full_name}
                                            </h3>
                                            {talent.stage_name && (
                                                <p className="text-xs text-outline">aka {talent.stage_name}</p>
                                            )}
                                        </div>
                                        <Badge variant="default" className="capitalize flex-shrink-0 text-[10px]">
                                            {talent.talent_type.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-outline space-y-1 mt-2">
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
                        )
                    })}
                </div>
            )}
        </div>
    )
}
