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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Leave Balances ({currentYear})</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Manage employee leave quotas for the current year.</p>
        </div>
        <div className="flex gap-2">
          <SeedBalancesButton year={currentYear} />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-950">
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
                <TableRow key={bal.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <TableCell>
                    <div className="font-medium text-zinc-900 dark:text-white">{bal.profiles?.full_name}</div>
                    <div className="text-xs text-zinc-500">{bal.profiles?.email}</div>
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
                  <TableCell className="text-right text-zinc-500">{bal.used_days}</TableCell>
                  <TableCell className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${bal.remaining_days > 0 ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300' : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'}`}>
                      {bal.remaining_days}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-zinc-500">
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
