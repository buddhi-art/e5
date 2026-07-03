import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmployeeForm } from "./employee-form"
import { Archive } from "lucide-react"
import { EmployeeActions } from "./employee-actions"
import { EmployeeTableClient } from "./employee-table-client"

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
      <div className="morph-fade-in">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Employees</h1>
        <p className="text-on-surface-variant">Manage your team members and their access.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 morph-fade-in morph-delay-2">
            <Tabs defaultValue="active">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-on-surface">Team Roster</CardTitle>
                  <TabsList className="bg-surface-container-high border-outline-variant/50">
                    <TabsTrigger value="active" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-on-surface">
                      Active ({activeEmployees?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="archived" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-on-surface">
                      Archived ({archivedEmployees?.length || 0})
                    </TabsTrigger>
                  </TabsList>
                </div>
                <CardDescription className="text-on-surface-variant mt-2">List of all employee accounts.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <TabsContent value="active" className="mt-0">
                  <EmployeeTableClient
                    employees={activeEmployees || []}
                    designations={designations}
                    isArchived={false}
                  />
                </TabsContent>
                <TabsContent value="archived" className="mt-0">
                  {archivedEmployees && archivedEmployees.length > 0 ? (
                    <div className="space-y-3">
                      {archivedEmployees.map((employee: any) => (
                        <div key={employee.id} className="flex items-center justify-between p-3 shape-medium bg-surface-container-low border border-outline-variant/50 card-morph">
                          <div className="flex items-center gap-3">
                            <Archive className="w-4 h-4 text-outline shrink-0" />
                            <div>
                              <div className="font-medium text-on-surface">{employee.full_name}</div>
                              <div className="text-xs text-outline">{employee.designation || "No designation"} &middot; Archived {new Date(employee.deleted_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <EmployeeActions employeeId={employee.id} employeeName={employee.full_name} isArchived={true} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-outline">No archived employees.</div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        <div>
          <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 sticky top-24 morph-fade-in morph-delay-3">
            <CardHeader>
              <CardTitle className="text-on-surface">Add Employee</CardTitle>
              <CardDescription className="text-on-surface-variant">Create a new login for a team member.</CardDescription>
            </CardHeader>
            <CardContent><EmployeeForm designations={designations} /></CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
