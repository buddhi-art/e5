import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EmployeeForm } from "./employee-form"
import { Phone, MapPin, Archive } from "lucide-react"
import { EmployeeActions } from "./employee-actions"
import { EditEmployeeDialog } from "./edit-employee-dialog"

// Layer 2: ISR - Cache for 5 minutes
export const revalidate = 300

export default async function EmployeesPage() {
  const supabase = await createClient()

  const { data: activeEmployees, error: activeErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "employee")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  const { data: archivedEmployees, error: archivedErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "employee")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })

  const { data: designationsData } = await supabase
    .from("designations")
    .select("name")
    .order("name")
  
  const designations = designationsData?.map(d => d.name) || []

  if (activeErr) console.error('Active employees error:', activeErr.message)
  if (archivedErr) console.error('Archived employees error:', archivedErr.message)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Employees</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Manage your team members and their access.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
            <Tabs defaultValue="active">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-zinc-900 dark:text-white">Team Roster</CardTitle>
                  <TabsList className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                    <TabsTrigger value="active" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white">
                      Active ({activeEmployees?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="archived" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white">
                      Archived ({archivedEmployees?.length || 0})
                    </TabsTrigger>
                  </TabsList>
                </div>
                <CardDescription className="text-zinc-600 dark:text-zinc-400 mt-2">List of all employee accounts.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <TabsContent value="active" className="mt-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/50">
                        <TableHead className="text-zinc-600 dark:text-zinc-400">Name</TableHead>
                        <TableHead className="text-zinc-600 dark:text-zinc-400">Designation</TableHead>
                        <TableHead className="text-zinc-600 dark:text-zinc-400">Phone</TableHead>
                        <TableHead className="text-zinc-600 dark:text-zinc-400">Location</TableHead>
                        <TableHead className="text-zinc-600 dark:text-zinc-400">Joined</TableHead>
                        <TableHead className="text-zinc-600 dark:text-zinc-400 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeEmployees && activeEmployees.length > 0 ? (
                        activeEmployees.map((employee: any) => (
                          <TableRow key={employee.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/50">
                            <TableCell>
                              <Link href={`/admin/employees/${employee.id}`} className="font-medium text-zinc-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition-colors">{employee.full_name}</Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50">{employee.designation || "None"}</Badge>
                            </TableCell>
                            <TableCell className="text-zinc-700 dark:text-zinc-300">
                              {employee.phone_number ? <span className="inline-flex items-center gap-1.5"><Phone className="w-3 h-3 text-zinc-500 dark:text-zinc-500" />{employee.phone_number}</span> : <span className="text-zinc-600">&mdash;</span>}
                            </TableCell>
                            <TableCell className="text-zinc-700 dark:text-zinc-300">
                              {employee.location ? <span className="inline-flex items-center gap-1.5"><MapPin className="w-3 h-3 text-zinc-500 dark:text-zinc-500" />{employee.location}</span> : <span className="text-zinc-600">&mdash;</span>}
                            </TableCell>
                            <TableCell className="text-zinc-600 dark:text-zinc-400">
                              {employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : new Date(employee.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex items-center gap-1">
                                <EditEmployeeDialog employee={employee} designations={designations} />
                                <EmployeeActions employeeId={employee.id} employeeName={employee.full_name} isArchived={false} />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow><TableCell colSpan={6} className="text-center py-6 text-zinc-500 dark:text-zinc-500">No active employees found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="archived" className="mt-0">
                  {archivedEmployees && archivedEmployees.length > 0 ? (
                    <div className="space-y-3">
                      {archivedEmployees.map((employee: any) => (
                        <div key={employee.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            <Archive className="w-4 h-4 text-zinc-500 shrink-0" />
                            <div>
                              <div className="font-medium text-zinc-700 dark:text-zinc-400">{employee.full_name}</div>
                              <div className="text-xs text-zinc-500">{employee.designation || "No designation"} &middot; Archived {new Date(employee.deleted_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <EmployeeActions employeeId={employee.id} employeeName={employee.full_name} isArchived={true} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-zinc-500 dark:text-zinc-500">No archived employees.</div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        <div>
          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 sticky top-24">
            <CardHeader>
              <CardTitle className="text-zinc-900 dark:text-white">Add Employee</CardTitle>
              <CardDescription className="text-zinc-600 dark:text-zinc-400">Create a new login for a team member.</CardDescription>
            </CardHeader>
            <CardContent><EmployeeForm designations={designations} /></CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
