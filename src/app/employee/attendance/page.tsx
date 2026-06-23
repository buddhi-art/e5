import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AttendanceForm } from './attendance-form'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function EmployeeAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch my attendance history
  const { data: myAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  const today = new Date().toISOString().split('T')[0]
  const hasMarkedToday = myAttendance?.some(log => log.date === today)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Daily Attendance</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Mark your daily presence and view your history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-900 dark:text-white">Mark Today's Status</CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">Select your working status for {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent>
            {hasMarkedToday ? (
              <div className="p-6 bg-green-400/10 border border-green-400/20 rounded-lg text-center">
                <h3 className="text-green-400 font-medium mb-1">Attendance Marked</h3>
                <p className="text-sm text-green-500/70">You have already submitted your attendance for today.</p>
              </div>
            ) : (
              <AttendanceForm />
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-900 dark:text-white">Recent History</CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">Your attendance logs for the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/50">
                  <TableHead className="text-zinc-600 dark:text-zinc-400">Date</TableHead>
                  <TableHead className="text-zinc-600 dark:text-zinc-400 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAttendance && myAttendance.length > 0 ? (
                  myAttendance.map((log) => (
                    <TableRow key={log.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/50">
                      <TableCell className="font-medium text-zinc-900 dark:text-white">{log.date}</TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant="outline" 
                          className={`border-zinc-300 dark:border-zinc-700 capitalize ${
                            log.status === 'present' ? 'text-green-400 bg-green-400/10' : 
                            log.status === 'absent' ? 'text-red-400 bg-red-400/10' : 
                            log.status === 'late' ? 'text-orange-400 bg-orange-400/10' :
                            'text-blue-400 bg-blue-400/10'
                          }`}
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-6 text-zinc-500 dark:text-zinc-500">
                      No attendance history found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
