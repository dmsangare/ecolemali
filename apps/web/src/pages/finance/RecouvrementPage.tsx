import { useSearchParams } from "react-router-dom";
import { AlertTriangle, Calendar, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RemindersListPage } from "./RemindersListPage";
import { InstallmentsOverview } from "./components/InstallmentsOverview";

const VALID_TABS = ["impayes", "echeances"];

export function RecouvrementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "impayes";
  const activeTab = VALID_TABS.includes(currentTab) ? currentTab : "impayes";

  const setTab = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="px-6 pt-6 max-w-7xl mx-auto">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-sis-md bg-sis-danger-bg text-sis-danger mt-0.5 dark:bg-sis-danger-bg/30">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Recouvrement</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Suivi des impayés, échéances et relances familles
            </p>
          </div>
        </div>
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
          </TabsList>
        </div>

        <TabsContent value="impayes" className="m-0">
          <RemindersListPage />
        </TabsContent>

        <TabsContent value="echeances" className="m-0">
          <InstallmentsOverview />
        </TabsContent>
      </Tabs>
    </div>
  );
}