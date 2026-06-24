import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProjectForm } from "./project-form"
import { ProjectStatusSelect } from "./project-status-select"
import { ProjectActionsMenu } from "./project-actions-menu"
import { Archive } from "lucide-react"

// Layer 2: ISR - Cache for 5 minutes
export const revalidate = 300

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: allProjects, error: activeProjErr } = await supabase
    .from("projects")
    .select("*, clients ( company_name )")
    .order("created_at", { ascending: false })

  // Split active vs archived in code (safe if deleted_at column doesn't exist)
  const activeProjects = (allProjects || []).filter((p: any) => !p.deleted_at)
  const archivedProjects = (allProjects || []).filter((p: any) => !!p.deleted_at)

  const { data: clients, error: clientsErr } = await supabase
    .from("clients")
    .select("id, company_name")
    .order("company_name", { ascending: true })

  if (activeProjErr) console.error('Projects fetch error:', activeProjErr.message)
  if (clientsErr) console.error('Clients fetch error:', clientsErr.message)

  const typedClients = (clients || []) as { id: string; company_name: string }[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Projects</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Manage client projects and their production phases.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
            <Tabs defaultValue="active">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-zinc-900 dark:text-white">Projects</CardTitle>
                  <TabsList className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                    <TabsTrigger value="active" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white">
                      Active ({activeProjects?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="archived" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white">
                      Archived ({archivedProjects?.length || 0})
                    </TabsTrigger>
                  </TabsList>
                </div>
                <CardDescription className="text-zinc-600 dark:text-zinc-400 mt-2">List of all production projects.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <TabsContent value="active" className="mt-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/50">
                        <TableHead className="text-zinc-600 dark:text-zinc-400">Project Title</TableHead>
                        <TableHead className="text-zinc-600 dark:text-zinc-400">Client</TableHead>
                        <TableHead className="text-zinc-600 dark:text-zinc-400">Status</TableHead>
                        <TableHead className="text-zinc-600 dark:text-zinc-400 text-right w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeProjects && activeProjects.length > 0 ? (
                        activeProjects.map((project: any) => (
                          <TableRow key={project.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/50">
                            <TableCell className="font-medium text-zinc-900 dark:text-white">{project.title}</TableCell>
                            <TableCell className="text-zinc-700 dark:text-zinc-300">{project.clients?.company_name || "Unknown Client"}</TableCell>
                            <TableCell><ProjectStatusSelect projectId={project.id} currentStatus={project.status} /></TableCell>
                            <TableCell className="text-right"><ProjectActionsMenu project={project} clients={typedClients} /></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow><TableCell colSpan={4} className="text-center py-6 text-zinc-500 dark:text-zinc-500">No active projects found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="archived" className="mt-0">
                  {archivedProjects && archivedProjects.length > 0 ? (
                    <div className="space-y-3">
                      {archivedProjects.map((project: any) => (
                        <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            <Archive className="w-4 h-4 text-zinc-500 shrink-0" />
                            <div>
                              <div className="font-medium text-zinc-700 dark:text-zinc-400">{project.title}</div>
                              <div className="text-xs text-zinc-500">{project.clients?.company_name || "Unknown"} &middot; Archived {new Date(project.deleted_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <ProjectActionsMenu project={project} clients={typedClients} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-zinc-500 dark:text-zinc-500">No archived projects.</div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        <div>
          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 sticky top-24">
            <CardHeader>
              <CardTitle className="text-zinc-900 dark:text-white">New Project</CardTitle>
              <CardDescription className="text-zinc-600 dark:text-zinc-400">Start a new project for a client.</CardDescription>
            </CardHeader>
            <CardContent><ProjectForm clients={clients || []} /></CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
