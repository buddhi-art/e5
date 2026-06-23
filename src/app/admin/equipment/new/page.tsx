import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EquipmentForm } from '../equipment-form'

export default async function NewEquipmentPage() {
  const supabase = await createClient()

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/employee/dashboard')

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/equipment" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors -ml-2 px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <ArrowLeft className="w-4 h-4" />
          Back to Equipment
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Add Equipment</h1>
        <p className="text-sm text-zinc-500">Register new gear or assets into the system.</p>
      </div>

      <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <EquipmentForm />
      </div>
    </div>
  )
}
