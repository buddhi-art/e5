import { createClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SeedBalancesButton } from './seed-balances-button'
import { EditBalanceCell } from './edit-balance-cell'

export default async function AdminLeaveBalancesPage() {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()

  const { data: balances } = await supabase
    .from('leave_balances')
    .select(`
      *,
      profiles!leave_balances_user_id_fkey(full_name, email),
      leave_types(name)
    `)
    .eq('year', currentYear)
    .order('user_id')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Leave Balances ({currentYear})</h1>
          <p className="text-on-surface-variant">Manage employee leave quotas for the current year.</p>
        </div>
        <div className="flex gap-2">
          <SeedBalancesButton year={currentYear} />
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl overflow-hidden elevation-1">
        <Table>
          <TableHeader className="bg-surface-container-low">
            <TableRow>
              <TableHead className="font-semibold">Employee</TableHead>
              <TableHead className="font-semibold">Leave Type</TableHead>
              <TableHead className="font-semibold text-right">Total Days</TableHead>
              <TableHead className="font-semibold text-right">Used Days</TableHead>
              <TableHead className="font-semibold text-right">Remaining</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balances && balances.length > 0 ? (
              balances.map((bal: any) => (
                <TableRow key={bal.id} className="hover:bg-surface-container-high">
                  <TableCell>
                    <div className="font-medium text-on-surface">{bal.profiles?.full_name}</div>
                    <div className="text-xs text-outline">{bal.profiles?.email}</div>
                  </TableCell>
                  <TableCell>{bal.leave_types?.name}</TableCell>
                  <TableCell className="text-right font-medium">
                    <EditBalanceCell
                      balanceId={bal.id}
                      userId={bal.user_id}
                      leaveTypeId={bal.leave_type_id}
                      year={currentYear}
                      totalDays={bal.total_days}
                    />
                  </TableCell>
                  <TableCell className="text-right text-outline">{bal.used_days}</TableCell>
                  <TableCell className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${bal.remaining_days > 0 ? 'bg-m3-info-subtle text-m3-info' : 'bg-m3-error-subtle text-m3-error'}`}>
                      {bal.remaining_days}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-outline">
                  No leave balances found for {currentYear}. You may need to generate them.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
