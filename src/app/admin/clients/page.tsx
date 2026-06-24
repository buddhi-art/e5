import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ClientForm } from "./client-form"
import { EditClientDialog } from "./edit-client-dialog"
import { ClientActions } from "./client-actions"
import { Phone, Building2, ExternalLink, Archive } from "lucide-react"
import Link from "next/link"

// Layer 2: ISR - Cache for 5 minutes
export const revalidate = 300

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data: activeClients, error: activeClientsErr } = await supabase
    .from("clients")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  const { data: archivedClients, error: archivedClientsErr } = await supabase
    .from("clients")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })

  const { data: companyNatures } = await supabase
    .from("company_natures")
    .select("name")
    .order("name")

  const { data: referralSources } = await supabase
    .from("referral_sources")
    .select("name")
    .order("name")

  if (activeClientsErr) console.error('Active clients error:', activeClientsErr.message)
  if (archivedClientsErr) console.error('Archived clients error:', archivedClientsErr.message)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Clients</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Manage client relationships, contact info, and their projects.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
            <Tabs defaultValue="active">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-zinc-900 dark:text-white">Client Directory</CardTitle>
                  <TabsList className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                    <TabsTrigger value="active" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white">
                      Active ({activeClients?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="archived" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white">
                      Archived ({archivedClients?.length || 0})
                    </TabsTrigger>
                  </TabsList>
                </div>
                <CardDescription className="text-zinc-600 dark:text-zinc-400 mt-2">List of all active, potential, and past clients.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <TabsContent value="active" className="mt-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/50">
                        <TableHead className="text-zinc-600 dark:text-zinc-400">Company</TableHead>
                        <TableHead className="text-zinc-600 dark:text-zinc-400">Contact</TableHead>
                        <TableHead className="text-zinc-600 dark:text-zinc-400">Status</TableHead>
                        <TableHead className="text-zinc-600 dark:text-zinc-400 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeClients && activeClients.length > 0 ? (
                        activeClients.map((client: any) => (
                          <TableRow key={client.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {client.logo_url ? (
                                  <img src={client.logo_url} alt={client.company_name} className="w-8 h-8 rounded-full object-cover bg-zinc-100 dark:bg-zinc-800" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                                    <Building2 className="w-4 h-4" />
                                  </div>
                                )}
                                <div>
                                  <Link href={`/admin/clients/${client.id}`} className="font-medium text-zinc-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                                    {client.company_name}
                                  </Link>
                                  <div className="text-xs text-zinc-500 dark:text-zinc-500">{client.nature_of_company || "Unspecified"}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-zinc-700 dark:text-zinc-300">{client.contact_person || "N/A"}</div>
                              {client.phone_number && (
                                <div className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-1 mt-1">
                                  <Phone className="w-3 h-3" /> {client.phone_number}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`border-zinc-300 dark:border-zinc-700 ${client.status === "active" ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" :
                                  client.status === "potential" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                    "bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
                                  }`}
                              >
                                {client.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex items-center gap-1">
                                <EditClientDialog 
                                  client={client} 
                                  companyNatures={companyNatures?.map(n => n.name) || []} 
                                  referralSources={referralSources?.map(r => r.name) || []} 
                                />
                                <ClientActions clientId={client.id} clientName={client.company_name} isArchived={false} />
                                <Link href={`/admin/clients/${client.id}`} className="inline-flex items-center justify-center rounded-md w-9 h-9 text-zinc-500 hover:text-sky-500 hover:bg-sky-500/10 transition-colors" title="View details">
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-zinc-500 dark:text-zinc-500">
                            No active clients found. Add your first one!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="archived" className="mt-0">
                  {archivedClients && archivedClients.length > 0 ? (
                    <div className="space-y-3">
                      {archivedClients.map((client: any) => (
                        <div key={client.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            <Archive className="w-4 h-4 text-zinc-500 shrink-0" />
                            <div>
                              <div className="font-medium text-zinc-700 dark:text-zinc-400">{client.company_name}</div>
                              <div className="text-xs text-zinc-500">
                                Archived {new Date(client.deleted_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <ClientActions clientId={client.id} clientName={client.company_name} isArchived={true} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-zinc-500 dark:text-zinc-500">
                      No archived clients.
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        <div>
          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 sticky top-24">
            <CardHeader>
              <CardTitle className="text-zinc-900 dark:text-white">Add New Client</CardTitle>
              <CardDescription className="text-zinc-600 dark:text-zinc-400">Enter details for a new client.</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientForm 
                companyNatures={companyNatures?.map(n => n.name) || []} 
                referralSources={referralSources?.map(r => r.name) || []} 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
