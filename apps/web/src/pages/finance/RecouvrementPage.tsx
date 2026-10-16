import { useSearchParams } from "react-router-dom";
import { AlertTriangle, Calendar, Bell } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui";
import { RemindersListPage } from "./RemindersListPage";

const VALID_TABS = ["impayes", "echeances", "relances"];

export function RecouvrementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "impayes";
  const activeTab = VALID_TABS.includes(currentTab) ? currentTab : "impayes";

  const setTab = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="px-6 pt-6">
        <h1 className="text-2xl font-bold">Recouvrement</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Suivi des impayés, échéances et relances familles
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setTab} className="w-full">
        <div className="px-6">
          <TabsList>
            <TabsTrigger value="impayes" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Impayés
            </TabsTrigger>
            <TabsTrigger value="echeances" className="gap-2">
              <Calendar className="h-4 w-4" />
              Échéances
            </TabsTrigger>
            <TabsTrigger value="relances" className="gap-2">
              <Bell className="h-4 w-4" />
              Relances
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="impayes" className="m-0">
          <div className="px-6 py-8">
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Liste des impayés (à venir en 7)</p>
                <p className="text-xs mt-1">
                  Retrouvez ici toutes les factures non soldées avec ancienneté
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="echeances" className="m-0">
          <div className="px-6 py-8">
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Vue des échéances (à venir en 7)</p>
                <p className="text-xs mt-1">
                  Suivez les échéances à venir et en retard
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="relances" className="m-0">
          <RemindersListPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
