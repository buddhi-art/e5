import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ClientForm } from "./client-form"
import { ClientActions } from "./client-actions"
import { Archive } from "lucide-react"
import { ClientTableClient } from "./client-table-client"

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
      <div className="morph-fade-in">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Clients</h1>
        <p className="text-on-surface-variant">Manage client relationships, contact info, and their projects.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 morph-fade-in morph-delay-2">
            <Tabs defaultValue="active">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-on-surface">Client Directory</CardTitle>
                  <TabsList className="bg-surface-container-high border-outline-variant/50">
                    <TabsTrigger value="active" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-on-surface">
                      Active ({activeClients?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="archived" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-on-surface">
                      Archived ({archivedClients?.length || 0})
                    </TabsTrigger>
                  </TabsList>
                </div>
                <CardDescription className="text-on-surface-variant mt-2">List of all active, potential, and past clients.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <TabsContent value="active" className="mt-0">
                  <ClientTableClient
                    clients={activeClients || []}
                    companyNatures={companyNatures?.map(n => n.name) || []}
                    referralSources={referralSources?.map(r => r.name) || []}
                  />
                </TabsContent>

                <TabsContent value="archived" className="mt-0">
                  {archivedClients && archivedClients.length > 0 ? (
                    <div className="space-y-3">
                      {archivedClients.map((client: any) => (
                        <div key={client.id} className="flex items-center justify-between p-3 shape-medium bg-surface-container-low border border-outline-variant/50 card-morph">
                          <div className="flex items-center gap-3">
                            <Archive className="w-4 h-4 text-outline shrink-0" />
                            <div>
                              <div className="font-medium text-on-surface">{client.company_name}</div>
                              <div className="text-xs text-outline">
                                Archived {new Date(client.deleted_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <ClientActions clientId={client.id} clientName={client.company_name} isArchived={true} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-outline">
                      No archived clients.
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        <div>
          <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 sticky top-24 morph-fade-in morph-delay-3">
            <CardHeader>
              <CardTitle className="text-on-surface">Add New Client</CardTitle>
              <CardDescription className="text-on-surface-variant">Enter details for a new client.</CardDescription>
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
