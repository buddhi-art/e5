import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EquipmentForm } from '../equipment-form'
import { requireAdminOrFounder } from '@/lib/auth/page-guard'

export default async function NewEquipmentPage() {
  await requireAdminOrFounder()


  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/equipment" className="inline-flex items-center gap-2 text-sm text-outline hover:text-on-surface transition-colors -ml-2 px-2 py-1 rounded-md hover:bg-surface-container-high">
          <ArrowLeft className="w-4 h-4" />
          Back to Equipment
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Add Equipment</h1>
        <p className="text-sm text-outline">Register new gear or assets into the system.</p>
      </div>

      <div className="p-6 rounded-xl border border-outline-variant/50 bg-surface-container-lowest elevation-1 shape-large">
        <EquipmentForm />
      </div>
    </div>
  )
}
