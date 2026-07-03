import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Image as ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EquipmentPhoto } from './equipment-photo'

export default async function EmployeeEquipmentPage() {
 const supabase = await createClient()

 // Verify access
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/login')

 // Fetch equipment
 const { data: equipment, error: eqError } = await supabase
 .from('equipment')
 .select('*')
 .is('deleted_at', null)
 .order('name')

 // Fetch checkouts for the current user that are still active
 const { data: myCheckouts, error: checkoutError } = await supabase
 .from('equipment_checkouts')
 .select('equipment_id, checked_out_at, expected_return_at')
 .eq('checked_out_by', user.id)
 .is('checked_in_at', null)

 const myEquipmentIds = new Set(myCheckouts?.map(c => c.equipment_id) || [])

 return (
 <div className="space-y-6">
 <div>
 <h1 className="text-2xl font-bold tracking-tight text-on-surface">Studio Equipment</h1>
 <p className="text-sm text-outline">View available gear and your current checkouts.</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {equipment?.map(eq => {
 const isMine = myEquipmentIds.has(eq.id)

 return (
 <div key={eq.id} className={`flex items-start gap-4 p-4 rounded-xl border ${isMine ? 'border-primary bg-primary/10 ' : 'border-outline-variant bg-surface-container-lowest dark:bg-surface-container-lowest'}`}>
 <div className="w-20 h-20 rounded-md bg-surface-container-high dark:bg-surface-container overflow-hidden flex-shrink-0 flex items-center justify-center relative">
 {eq.image_url ? (
 <EquipmentPhoto imageUrl={eq.image_url} name={eq.name} />
 ) : (
 <ImageIcon className="w-6 h-6 text-outline" />
 )}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start gap-2 mb-1">
 <h3 className="font-medium text-on-surface truncate">
 {eq.name}
 </h3>
 {isMine ? (
 <Badge variant="default" className="bg-primary hover:bg-primary flex-shrink-0">You have this</Badge>
 ) : (
 <Badge variant={
 eq.status === 'available' ? 'default' :
 eq.status === 'checked_out' ? 'secondary' :
 eq.status === 'maintenance' ? 'destructive' : 'outline'
 } className="capitalize flex-shrink-0">
 {eq.status.replace('_', '')}
 </Badge>
 )}
 </div>
 <div className="text-xs text-outline space-y-1">
 <p className="truncate">{eq.category}</p>
 <p className="truncate">{eq.brand} {eq.model}</p>
 <p className="truncate">S/N: {eq.serial_number || 'N/A'}</p>
 </div>
 </div>
 </div>
 )
 })}
 {(!equipment || equipment.length === 0) && (
 <div className="col-span-full text-center py-12 border border-dashed rounded-lg border-outline-variant" >
 <p className="text-outline">No equipment found in the database.</p>
 </div>
 )}
 </div>
 </div>
 )
}
